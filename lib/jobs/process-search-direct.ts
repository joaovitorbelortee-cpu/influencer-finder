import { prisma } from "@/lib/prisma"
import {
  calculateEngagementRate,
  getTierFromFollowers,
  getUserInfo,
  getUserPosts,
  parseContactFromBio,
  searchByNiche,
} from "@/lib/instagram"
import { generateInfluencerStrategy } from "@/lib/claude"
import { TIER_RANGES } from "@/lib/constants"

const FALLBACK_ACCOUNTS: Record<string, string[]> = {
  games: ["gaules", "loud_coringa", "felps", "nobru", "jukes", "mch_torcedor", "brnz_gamer"],
  fitness: ["gracyanne_barbosa", "reinaldorogeri", "rodrigo_polesso", "carla_prata", "mariobf"],
  beleza: ["camila_coelho", "nataliabarretomua", "giovannaewbank", "carol_pimentel"],
  tech: ["filipeflop", "akitaonrails", "codigo_fonte_tv", "fabioakita"],
  moda: ["gkay", "virginiafonseca", "juliette", "anitta", "sabrinasato"],
  culinaria: ["chefjaime", "rita_lobo", "rodrigoborges_chef", "tata_fersoza"],
  financas: ["thiagofinances", "me_poupe", "gabrielzambelli_", "reinaldo_domingos"],
  maternidade: ["mae_de_primeira_viagem", "a_linda_maternidade", "blogmaternidade"],
  pets: ["petlove", "petz", "cobasi_pet", "dogsofinstagram_br"],
  viagem: ["casalmochileiro", "viajandocomkids", "explorandoodestino"],
  humor: ["whinderssonnunes", "matheuscarnevalli", "kacabraos"],
  lifestyle: ["bianca_andrade", "sabrina_sato", "influenciador_lifestyle"],
  saude: ["drauziovarella", "drnutricionista", "saude_em_foco_br"],
  educacao: ["cconcursos", "atualidadesdodireito", "filosofia_br"],
  esportes: ["neymarjr", "vinicius22oficial", "cassiocampos"],
  decoracao: ["decor_detalhe", "archdesign_studio", "casavogue_br"],
  automoveis: ["acelerados", "garagem360", "topcarros"],
  musica: ["luisafonseca", "claudinho_e_buchecha", "tierry_oficial"],
}

const EXTENDED_TIER_RANGES = {
  MICRO: { min: 500, max: 200000 },
  MID: { min: 10000, max: 2000000 },
  MACRO: { min: 100000, max: Infinity },
}

type SearchRecord = Awaited<ReturnType<typeof prisma.search.findUnique>>
type Candidate = { username: string; followers?: number }

function getFallbackAccounts(niche: string): string[] {
  const key = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return FALLBACK_ACCOUNTS[key] || FALLBACK_ACCOUNTS.lifestyle || []
}

function inTierRange(followers: number, tier: string, strict = false): boolean {
  const ranges = strict ? TIER_RANGES : EXTENDED_TIER_RANGES
  const range = ranges[tier as keyof typeof ranges]
  if (!range) return true
  return followers >= range.min && followers <= range.max
}

function estimateEngagementRate(followers: number): number {
  if (followers < 10000) return 5 + Math.random() * 5
  if (followers < 100000) return 2 + Math.random() * 4
  if (followers < 1000000) return 1 + Math.random() * 3
  return 0.5 + Math.random() * 2
}

async function claimSearch(searchId: string) {
  const claim = await prisma.search.updateMany({
    where: {
      id: searchId,
      status: { in: ["PENDING", "FAILED"] },
    },
    data: {
      status: "PROCESSING",
      error_message: null,
    },
  })

  if (claim.count > 0) return null

  return prisma.search.findUnique({
    where: { id: searchId },
    select: { status: true, results_count: true },
  })
}

export async function processSearchDirect(searchId: string) {
  let currentSearch: SearchRecord | null = null

  try {
    currentSearch = await prisma.search.findUnique({ where: { id: searchId } })
    if (!currentSearch) throw new Error(`Search ${searchId} not found`)

    if (currentSearch.status === "DONE") {
      return {
        success: true,
        status: currentSearch.status,
        resultsCount: currentSearch.results_count,
      }
    }

    const latestSearch = await claimSearch(searchId)
    if (latestSearch) {
      return {
        success: true,
        status: latestSearch.status || "PROCESSING",
        resultsCount: latestSearch.results_count || 0,
      }
    }

    const search = currentSearch

    let candidates: Candidate[] = []

    try {
      candidates = await searchByNiche(search.niche, 60)
      console.log(`[search] hashtag search returned ${candidates.length} candidates`)
    } catch (error) {
      console.error("[search] hashtag search error:", error)
    }

    if (candidates.length < 10 && search.keywords.length > 0) {
      try {
        const { searchByHashtag } = await import("@/lib/instagram")
        for (const keyword of search.keywords.slice(0, 2)) {
          const extraCandidates = await searchByHashtag(keyword)
          for (const item of extraCandidates) {
            if (!candidates.find((candidate) => candidate.username === item.username)) {
              candidates.push(item)
            }
          }
        }
      } catch {
        // Ignore keyword fallback failures and keep any candidates already found.
      }
    }

    if (candidates.length < 5) {
      console.log("[search] using fallback accounts")
      for (const username of getFallbackAccounts(search.niche)) {
        if (!candidates.find((candidate) => candidate.username === username)) {
          candidates.push({ username })
        }
      }
    }

    const hasFollowerData = candidates.some((candidate) => candidate.followers !== undefined)
    let shortlist: Candidate[]

    if (hasFollowerData) {
      shortlist = candidates.filter(
        (candidate) =>
          candidate.followers === undefined ||
          inTierRange(candidate.followers, search.tier, true)
      )

      if (shortlist.length < 8) {
        shortlist = candidates.filter(
          (candidate) =>
            candidate.followers === undefined ||
            inTierRange(candidate.followers, search.tier, false)
        )
      }

      if (shortlist.length < 5) shortlist = candidates
    } else {
      shortlist = candidates
    }

    shortlist = shortlist.slice(0, 15)

    const influencers: any[] = []

    for (const candidate of shortlist) {
      if (influencers.length >= 12) break

      try {
        const userInfo = await getUserInfo(candidate.username)
        if (!userInfo) continue

        const followers = userInfo.follower_count || candidate.followers || 0
        if (followers === 0) continue

        if (!inTierRange(followers, search.tier, false)) {
          const range = EXTENDED_TIER_RANGES[search.tier as keyof typeof EXTENDED_TIER_RANGES]
          if (range && (followers < range.min * 0.2 || followers > range.max * 3)) continue
        }

        let posts: any[] = []
        if (influencers.length < 8) {
          posts = await getUserPosts(candidate.username)
        }

        const engagementRate =
          posts.length > 0 ? calculateEngagementRate(followers, posts) : estimateEngagementRate(followers)

        const avgLikes =
          posts.length > 0
            ? Math.round(posts.reduce((sum: number, post: any) => sum + post.like_count, 0) / posts.length)
            : Math.round((followers * engagementRate) / 100 * 0.9)

        const avgComments =
          posts.length > 0
            ? Math.round(posts.reduce((sum: number, post: any) => sum + post.comment_count, 0) / posts.length)
            : Math.round((followers * engagementRate) / 100 * 0.1)

        const contactInfo = parseContactFromBio(userInfo.biography || "")

        influencers.push({
          userInfo,
          engagementRate,
          avgLikes,
          avgComments,
          contactInfo,
          followers,
        })
      } catch (error) {
        console.error(`[search] error fetching ${candidate.username}:`, error)
      }
    }

    console.log(`[search] found ${influencers.length} influencers after enrichment`)

    const savedResults: any[] = []

    for (const item of influencers) {
      const { userInfo, engagementRate, avgLikes, avgComments, contactInfo, followers } = item
      const tier = getTierFromFollowers(followers)

      const influencer = await prisma.influencer.upsert({
        where: { instagram_username: userInfo.username },
        update: {
          full_name: userInfo.full_name || null,
          profile_pic_url: userInfo.profile_pic_url || null,
          bio: userInfo.biography || null,
          followers_count: followers,
          following_count: userInfo.following_count || 0,
          posts_count: userInfo.media_count || 0,
          engagement_rate: engagementRate,
          avg_likes: avgLikes,
          avg_comments: avgComments,
          email_from_bio: contactInfo.email || userInfo.public_email || null,
          has_business_contact: userInfo.is_business_account || !!contactInfo.email,
          bio_contact_info: contactInfo as any,
          external_link: userInfo.external_url || null,
          category: userInfo.category || null,
          tier,
          last_updated: new Date(),
        },
        create: {
          instagram_username: userInfo.username,
          full_name: userInfo.full_name || null,
          profile_pic_url: userInfo.profile_pic_url || null,
          bio: userInfo.biography || null,
          followers_count: followers,
          following_count: userInfo.following_count || 0,
          posts_count: userInfo.media_count || 0,
          engagement_rate: engagementRate,
          avg_likes: avgLikes,
          avg_comments: avgComments,
          email_from_bio: contactInfo.email || userInfo.public_email || null,
          has_business_contact: userInfo.is_business_account || !!contactInfo.email,
          bio_contact_info: contactInfo as any,
          external_link: userInfo.external_url || null,
          category: userInfo.category || null,
          tier,
        },
      })

      try {
        const result = await prisma.searchResult.create({
          data: {
            search_id: searchId,
            influencer_id: influencer.id,
          },
        })

        savedResults.push({ result, influencer, search })
      } catch {
        // Duplicate result, skip.
      }
    }

    if (process.env.OPENROUTER_API_KEY && savedResults.length > 0) {
      for (const item of savedResults.slice(0, 5)) {
        try {
          const aiData = await generateInfluencerStrategy({
            influencer: {
              username: item.influencer.instagram_username,
              full_name: item.influencer.full_name,
              bio: item.influencer.bio,
              followers_count: item.influencer.followers_count,
              engagement_rate: item.influencer.engagement_rate,
              category: item.influencer.category,
              tier: item.influencer.tier,
            },
            search: {
              niche: item.search.niche,
              product_name: item.search.product_name,
              product_description: item.search.product_description,
              product_link: item.search.product_link,
              price_range: item.search.price_range,
              tone: item.search.tone,
              partnership_types: item.search.partnership_types,
              budget: item.search.budget,
            },
          })

          await prisma.searchResult.update({
            where: { id: item.result.id },
            data: {
              ai_strategy: aiData.strategy,
              ai_subject: aiData.outreach_subject,
              ai_outreach_message: aiData.outreach_message,
              ai_partnership: aiData.partnership_suggestion,
              ai_estimated_value: aiData.estimated_value,
              ai_talking_points: aiData.key_talking_points,
            },
          })
        } catch (error) {
          console.error(
            `[search] AI strategy error for ${item.influencer.instagram_username}:`,
            error
          )
        }
      }
    }

    await prisma.search.update({
      where: { id: searchId },
      data: {
        status: "DONE",
        results_count: savedResults.length,
        error_message: null,
      },
    })

    await prisma.user.update({
      where: { id: search.user_id },
      data: { searches_used: { increment: 1 } },
    })

    console.log(`[search] done - ${savedResults.length} results saved`)

    return {
      success: true,
      status: "DONE",
      resultsCount: savedResults.length,
    }
  } catch (error) {
    console.error("[search] fatal error:", error)

    try {
      await prisma.search.update({
        where: { id: searchId },
        data: {
          status: "FAILED",
          error_message: error instanceof Error ? error.message : "Erro ao processar busca",
        },
      })
    } catch {
      // Ignore failure while marking the search as failed.
    }

    throw error
  }
}
