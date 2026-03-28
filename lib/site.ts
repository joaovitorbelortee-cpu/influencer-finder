export const SITE_NAME = "Influencer Finder"
export const SITE_TAGLINE = "Encontre creators que fazem sentido para a sua campanha"
export const SITE_DESCRIPTION =
  "Descubra influenciadores no Brasil, gere abordagem pronta com IA e organize sua prospeccao em minutos."

export const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const

export type MarketingSearchParams = Record<string, string | string[] | undefined>

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function buildTrackedPath(
  pathname: string,
  searchParams: MarketingSearchParams = {}
) {
  const params = new URLSearchParams()

  for (const key of TRACKING_KEYS) {
    const value = searchParams[key]
    if (typeof value === "string" && value.trim()) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
