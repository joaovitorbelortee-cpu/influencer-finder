import { prisma } from "@/lib/prisma"
import {
  searchByNiche,
  getUserInfo,
  getUserPosts,
  calculateEngagementRate,
  parseContactFromBio,
  getTierFromFollowers,
} from "@/lib/instagram"
import { generateInfluencerStrategy } from "@/lib/claude"
import { TIER_RANGES } from "@/lib/constants"

// Fallback real influencers per niche (used if RapidAPI returns nothing)
const FALLBACK_ACCOUNTS: Record<string, string[]> = {
  games:       ["gaules", "loud_coringa", "felps", "nobru", "jukes", "mch_torcedor", "brnz_gamer"],
  fitness:     ["gracyanne_barbosa", "reinaldorogeri", "rodrigo_polesso", "carla_prata", "mariobf"],
  beleza:      ["camila_coelho", "nataliabarretomua", "giovannaewbank", "carol_pimentel"],
  tech:        ["filipeflop", "akitaonrails", "codigo_fonte_tv", "fabioakita"],
  moda:        ["gkay", "virginiafonseca", "juliette", "anitta", "sabrinasato"],
  culinaria:   ["chefjaime", "rita_lobo", "rodrigoborges_chef", "tata_fersoza"],
  financas:    ["thiagofinances", "me_poupe", "gabrielzambelli_", "reinaldo_domingos"],
  maternidade: ["mae_de_primeira_viagem", "a_linda_maternidade", "blogmaternidade"],
  pets:        ["petlove", "petz", "cobasi_pet", "dogsofinstagram_br"],
  viagem:      ["casalmochileiro", "viajandocomkids", "explorandoodestino"],
  humor:       ["whinderssonnunes", "matheuscarnevalli", "kacabraos"],
  lifestyle:   ["bianca_andrade", "sabrina_sato", "influenciador_lifestyle"],
  saude:       ["drauziovarella", "drnutricionista", "saude_em_foco_br"],
  educacao:    ["cconcursos", "atualidadesdodireito", "filosofia_br"],
  esportes:    ["neymarjr", "vinicius22oficial", "cassiocampos"],
  decoracao:   ["decor_detalhe", "archdesign_studio", "casavogue_br"],
  automoveis:  ["acelerados", "garagem360", "topcarros"],
  musica:      ["luisafonseca", "claudinho_e_buchecha", "tierry_oficial"],
}

function getFallbackAccounts(niche: string): string[] {
  const key = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return FALLBACK_ACCOUNTS[key] || FALLBACK_ACCOUNTS["lifestyle"] || []
}

// Extended tier ranges — much more lenient to avoid 0 results
const EXTENDED_TIER_RANGES = {
  MICRO: { min: 500,     max: 200000  },  // 500 to 200K (strict: 1K-50K)
  MID:   { min: 10000,   max: 2000000 },  // 10K to 2M (strict: 50K-500K)
  MACRO: { min: 100000,  max: Infinity }, // 100K+ (strict: 500K+)
}

function inTierRange(followers: number, tier: string, strict = false): boolean {
  const ranges = strict ? TIER_RANGES : EXTENDED_TIER_RANGES
  const range = ranges[tier as keyof typeof ranges]
  if (!range) return true // unknown tier → accept all
  return followers >= range.min && followers <= range.max
}

function estimateEngagementRate(followers: number): number {
  if (followers < 10000)  return 5 + Math.random() * 5
  if (followers < 100000) return 2 + Math.random() * 4
  if (followers < 1000000) return 1 + Math.random() * 3
  return 0.5 + Math.random() * 2
}

export async function processSearchDirect(searchId: string) {
  // eslint-disable-next-line prefer-const
  let search: Awaited<ReturnType<typeof prisma.search.findUnique>> | undefined
  try {
    search = await prisma.search.findUnique({ where: { id: searchId } })
    if (!search) throw new Error(`Search ${searchId} not found`)
    const currentSearch = search

    await prisma.search.update({
      where: { id: searchId },
      data: { status: "PROCESSING" },
    })

    // ── Step 1: Collect candidate usernames ───────────────────────────────────
    let candidates: { username: string; followers?: number }[] = []

    try {
      candidates = await searchByNiche(currentSearch.niche, 60)
      console.log(`[search] hashtag search returned ${candidates.length} candidates`)
    } catch (error) {
      console.error("[search] hashtag search error:", error)
    }

    // Add extra keywords as extra hashtag searches
    if (candidates.length < 10 && currentSearch.keywords.length > 0) {
      try {
        const { searchByHashtag } = await import("@/lib/instagram")
        for (const kw of currentSearch.keywords.slice(0, 2)) {
          const extra = await searchByHashtag(kw)
          for (const item of extra) {
            if (!candidates.find(c => c.username === item.username)) {
              candidates.push(item)
            }
          }
        }
      } catch {}
    }

    // If still too few, use fallback real accounts
    if (candidates.length < 5) {
      console.log("[search] using fallback accounts")
      const fallback = getFallbackAccounts(currentSearch.niche)
      for (const u of fallback) {
        if (!candidates.find(c => c.username === u)) {
          candidates.push({ username: u })
        }
      }
    }

    // ── Step 2: Pre-filter by tier using known follower count ─────────────────
    // Candidates from hashtag search may already have follower counts
    const hasFollowerData = candidates.some(c => c.followers !== undefined)
    let shortlist: { username: string; followers?: number }[]

    if (hasFollowerData) {
      // First pass: strict tier match
      shortlist = candidates.filter(c => c.followers === undefined || inTierRange(c.followers, currentSearch.tier, true))
      // If too few, use extended range
      if (shortlist.length < 8) {
        shortlist = candidates.filter(c => c.followers === undefined || inTierRange(c.followers, currentSearch.tier, false))
      }
      // If still too few, take all
      if (shortlist.length < 5) shortlist = candidates
    } else {
      shortlist = candidates
    }

    // Limit to avoid timeout (each getUserInfo + getUserPosts = ~1-3s)
    shortlist = shortlist.slice(0, 15)

    // ── Step 3: Enrich candidates with getUserInfo ────────────────────────────
    const influencers: any[] = []

    for (const candidate of shortlist) {
      if (influencers.length >= 12) break
      try {
        const userInfo = await getUserInfo(candidate.username)
        if (!userInfo) continue

        const followers = userInfo.follower_count || candidate.followers || 0
        if (followers === 0) continue

        // Apply tier filter (extended) — if strict gives 0 results we accept adjacent
        if (!inTierRange(followers, currentSearch.tier, false)) {
          // Only skip if very far outside range
          const range = EXTENDED_TIER_RANGES[currentSearch.tier as keyof typeof EXTENDED_TIER_RANGES]
          if (range && (followers < range.min * 0.2 || followers > range.max * 3)) continue
        }

        // Get posts for engagement calc (only for first 8 to save time)
        let posts: any[] = []
        if (influencers.length < 8) {
          posts = await getUserPosts(candidate.username)
        }

        const engagementRate = posts.length > 0
          ? calculateEngagementRate(followers, posts)
          : estimateEngagementRate(followers)

        const avgLikes = posts.length > 0
          ? Math.round(posts.reduce((s: number, p: any) => s + p.like_count, 0) / posts.length)
          : Math.round(followers * engagementRate / 100 * 0.9)

        const avgComments = posts.length > 0
          ? Math.round(posts.reduce((s: number, p: any) => s + p.comment_count, 0) / posts.length)
          : Math.round(followers * engagementRate / 100 * 0.1)

        const contactInfo = parseContactFromBio(userInfo.biography || "")

        influencers.push({ userInfo, engagementRate, avgLikes, avgComments, contactInfo, followers })
      } catch (err) {
        console.error(`[search] error fetching ${candidate.username}:`, err)
      }
    }

    console.log(`[search] found ${influencers.length} influencers after enrichment`)

    // ── Step 4: Save to DB ────────────────────────────────────────────────────
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
          data: { search_id: searchId, influencer_id: influencer.id },
        })
        savedResults.push({ result, influencer, search })
      } catch {
        // duplicate, skip
      }
    }

    // ── Step 5: AI strategies ─────────────────────────────────────────────────
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
        } catch (err) {
          console.error(`[search] AI strategy error for ${item.influencer.instagram_username}:`, err)
        }
      }
    }

    // ── Step 6: Finish ────────────────────────────────────────────────────────
    await prisma.search.update({
      where: { id: searchId },
      data: { status: "DONE", results_count: savedResults.length },
    })

    await prisma.user.update({
      where: { id: currentSearch.user_id },
      data: { searches_used: { increment: 1 } },
    })

    console.log(`[search] done — ${savedResults.length} results saved`)
    return { success: true, resultsCount: savedResults.length }

  } catch (error) {
    console.error("[search] fatal error:", error)
    try {
      if (searchId) {
        await prisma.search.update({
          where: { id: searchId },
          data: { status: "FAILED" },
        })
      }
    } catch {}
    throw error
  }
}
