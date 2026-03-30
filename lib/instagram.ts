// RapidAPI Instagram Scraper
// Host: instagram-api-fast-reliable-data-scraper.p.rapidapi.com

const RAPIDAPI_HOST = "instagram-api-fast-reliable-data-scraper.p.rapidapi.com"
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

// Maps niche to relevant hashtags (used as keyword hints for fallback accounts)
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

export function getHashtagsForNiche(niche: string): string[] {
  const key = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return NICHE_HASHTAGS[key] || [niche, niche + "brasil", niche + "br"]
}

// Hashtag search is not available on the free plan — returns empty so fallback accounts are used
export async function searchByHashtag(_hashtag: string): Promise<{ username: string; followers?: number }[]> {
  return []
}

export async function searchByNiche(_niche: string, _maxResults = 60): Promise<{ username: string; followers?: number }[]> {
  return []
}

export async function getUserInfo(username: string): Promise<InstagramUser | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/profile?username=${encodeURIComponent(username)}`,
      { headers: getHeaders() }
    )

    if (!response.ok) return null

    const data = await response.json()
    if (!data || !data.username) return null

    return {
      pk: String(data.pk || ""),
      username: data.username,
      full_name: data.full_name || "",
      biography: data.biography || "",
      follower_count: data.follower_count || 0,
      following_count: data.following_count || 0,
      media_count: data.media_count || 0,
      profile_pic_url: data.profile_pic_url || "",
      is_business_account: Boolean(data.business_contact_method || data.public_email || data.category),
      category: data.category || "",
      public_email: data.public_email || "",
      external_url: data.external_url || "",
      contact_phone_number: "",
      business_contact_method: data.business_contact_method || "",
    }
  } catch {
    return null
  }
}

// Accepts username (legacy) or numeric user_id string from userInfo.pk
export async function getUserPosts(usernameOrId: string): Promise<InstagramPost[]> {
  try {
    let userId: string | number = usernameOrId

    // If it looks like a username (not numeric), resolve to user_id first
    if (!/^\d+$/.test(usernameOrId)) {
      const profileRes = await fetch(
        `${BASE_URL}/profile?username=${encodeURIComponent(usernameOrId)}`,
        { headers: getHeaders() }
      )
      if (!profileRes.ok) return []
      const profileData = await profileRes.json()
      userId = profileData?.pk
      if (!userId) return []
    }

    const response = await fetch(
      `${BASE_URL}/reels?user_id=${userId}`,
      { headers: getHeaders() }
    )
    if (!response.ok) return []

    const data = await response.json()
    const posts: InstagramPost[] = []

    if (data?.data?.items) {
      for (const item of data.data.items.slice(0, 12)) {
        const media = item?.media || item
        posts.push({
          like_count: media.like_count || 0,
          comment_count: media.comment_count || 0,
          play_count: media.play_count,
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
