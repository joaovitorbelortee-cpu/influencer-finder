// RapidAPI Instagram Scraper
// Host: instagram-scraper-api2.p.rapidapi.com

const RAPIDAPI_HOST = "instagram-scraper-api2.p.rapidapi.com"
const BASE_URL = `https://${RAPIDAPI_HOST}`

function getHeaders() {
  return {
    "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
    "x-rapidapi-host": RAPIDAPI_HOST,
  }
}

export interface InstagramUser {
  pk: string
  username: string
  full_name: string
  biography: string
  follower_count: number
  following_count: number
  media_count: number
  profile_pic_url: string
  is_business_account: boolean
  category: string
  public_email: string
  external_url: string
  contact_phone_number: string
  business_contact_method: string
}

export interface InstagramPost {
  like_count: number
  comment_count: number
  play_count?: number
}

// Maps niche to relevant hashtags (Portuguese + English)
const NICHE_HASHTAGS: Record<string, string[]> = {
  games:       ["gaming", "gamer", "games", "gameplay", "gamerbrasil", "streamer", "jogos"],
  fitness:     ["fitness", "academia", "treino", "musculacao", "fitnessbrasil", "workout", "gym"],
  beleza:      ["beleza", "makeup", "beauty", "maquiagem", "skincare", "cabelo"],
  tech:        ["tech", "tecnologia", "gadgets", "techbrasil", "programacao", "developer"],
  moda:        ["moda", "fashion", "style", "ootd", "modabrasil", "lookdodia"],
  culinaria:   ["culinaria", "receitas", "gastronomia", "food", "foodblogger", "cozinha"],
  financas:    ["financaspessoais", "investimentos", "dinheiro", "riqueza", "financas", "cripto"],
  maternidade: ["maternidade", "mae", "bebe", "gravidez", "mom", "mamaebrasil"],
  pets:        ["pets", "cachorro", "gato", "dog", "cat", "petsbrasil", "doglovers"],
  viagem:      ["viagem", "travel", "turismo", "mochileiro", "travelblogger", "viajar"],
  humor:       ["humor", "comedia", "memes", "engracado", "risadas", "stand_up"],
  lifestyle:   ["lifestyle", "vida", "rotina", "diariodevida", "dayinmylife"],
  saude:       ["saude", "bemestar", "saude_mental", "autocuidado", "health", "wellness"],
  educacao:    ["educacao", "estudos", "aprendizado", "concurso", "vestibular", "dicas"],
  esportes:    ["esportes", "futebol", "sports", "atletismo", "basquete", "corrida"],
  decoracao:   ["decoracao", "homedecor", "interiores", "arquitetura", "design", "casanova"],
  automoveis:  ["carros", "automoveis", "motorsport", "cars", "carro", "autoshow"],
  musica:      ["musica", "music", "artista", "cantor", "banda", "festivais"],
}

function getHashtagsForNiche(niche: string): string[] {
  const key = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return NICHE_HASHTAGS[key] || [niche, niche + "brasil", niche + "br"]
}

export async function searchByHashtag(hashtag: string): Promise<{ username: string; followers?: number }[]> {
  const response = await fetch(
    `${BASE_URL}/v1/hashtag?hashtag=${encodeURIComponent(hashtag)}`,
    { headers: getHeaders() }
  )

  if (!response.ok) {
    throw new Error(`Instagram hashtag search failed: ${response.status}`)
  }

  const data = await response.json()
  const results: { username: string; followers?: number }[] = []
  const seen = new Set<string>()

  function extractFromSections(sections: any[]) {
    for (const section of sections || []) {
      const medias = section?.layout_content?.medias ||
                     section?.layout_content?.one_by_two_item?.clips?.items ||
                     []
      for (const media of medias) {
        const user = media?.media?.user || media?.user
        const username = user?.username
        if (username && !seen.has(username)) {
          seen.add(username)
          results.push({
            username,
            followers: user?.follower_count || user?.edge_followed_by?.count || undefined,
          })
        }
      }
    }
  }

  // Try all known response structures
  extractFromSections(data?.data?.sections)
  extractFromSections(data?.data?.recent?.sections)
  extractFromSections(data?.data?.top?.sections)
  extractFromSections(data?.data?.edge_hashtag_to_top_posts?.edges?.map((e: any) => ({
    layout_content: { medias: [{ media: e?.node }] }
  })))

  return results.slice(0, 50)
}

export async function searchByNiche(niche: string, maxResults = 60): Promise<{ username: string; followers?: number }[]> {
  const hashtags = getHashtagsForNiche(niche)
  const all: { username: string; followers?: number }[] = []
  const seen = new Set<string>()

  for (const tag of hashtags.slice(0, 4)) {
    try {
      const found = await searchByHashtag(tag)
      for (const item of found) {
        if (!seen.has(item.username)) {
          seen.add(item.username)
          all.push(item)
        }
      }
      if (all.length >= maxResults) break
    } catch (err) {
      console.warn(`Hashtag search failed for #${tag}:`, err)
    }
  }

  return all.slice(0, maxResults)
}

export async function getUserInfo(username: string): Promise<InstagramUser | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/v1/info?username_or_id_or_url=${encodeURIComponent(username)}`,
      { headers: getHeaders() }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data?.data || null
  } catch {
    return null
  }
}

export async function getUserPosts(username: string): Promise<InstagramPost[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/v1/posts?username_or_id_or_url=${encodeURIComponent(username)}`,
      { headers: getHeaders() }
    )

    if (!response.ok) return []

    const data = await response.json()
    const posts: InstagramPost[] = []

    if (data?.data?.items) {
      for (const item of data.data.items.slice(0, 12)) {
        posts.push({
          like_count: item.like_count || 0,
          comment_count: item.comment_count || 0,
          play_count: item.play_count,
        })
      }
    }

    return posts
  } catch {
    return []
  }
}

export function calculateEngagementRate(
  followers: number,
  posts: InstagramPost[]
): number {
  if (!posts.length || !followers) return 0

  const totalEngagement = posts.reduce(
    (sum, post) => sum + post.like_count + post.comment_count,
    0
  )
  const avgEngagement = totalEngagement / posts.length
  return (avgEngagement / followers) * 100
}

export function parseContactFromBio(bio: string): {
  email: string | null
  hasWhatsapp: boolean
  hasDm: boolean
  links: string[]
} {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = bio.match(emailRegex) || []
  const hasWhatsapp = /whatsapp|wpp|zap|📱/i.test(bio)
  const hasDm = /dm|direct|msg|mensagem/i.test(bio)
  const urlRegex = /https?:\/\/[^\s]+/g
  const links = bio.match(urlRegex) || []

  return {
    email: emails[0] || null,
    hasWhatsapp,
    hasDm,
    links,
  }
}

export function getTierFromFollowers(followers: number): "MICRO" | "MID" | "MACRO" {
  if (followers <= 50000) return "MICRO"
  if (followers <= 500000) return "MID"
  return "MACRO"
}
