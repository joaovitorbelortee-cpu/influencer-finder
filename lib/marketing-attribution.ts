import { TRACKING_KEYS, buildTrackedPath } from "@/lib/site"

const TRACKING_STORAGE_KEY = "influencer-finder.tracking"
export type AttributionKey = (typeof TRACKING_KEYS)[number]
export type MarketingAttribution = Partial<Record<AttributionKey, string>>

export function sanitizeMarketingAttribution(input: Record<string, unknown> = {}) {
  const attribution: MarketingAttribution = {}

  for (const key of TRACKING_KEYS) {
    const rawValue = input[key]
    if (typeof rawValue !== "string") {
      continue
    }

    const value = rawValue.trim().slice(0, 200)
    if (!value) {
      continue
    }

    attribution[key] = value
  }

  return attribution
}

export function parseMarketingSearch(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`)
  return sanitizeMarketingAttribution(Object.fromEntries(params.entries()))
}

export function serializeMarketingAttribution(attribution: MarketingAttribution) {
  const params = new URLSearchParams()

  for (const key of TRACKING_KEYS) {
    const value = attribution[key]
    if (value) {
      params.set(key, value)
    }
  }

  return params.toString()
}

export function mergeMarketingAttribution(...sources: MarketingAttribution[]) {
  return sources.reduce<MarketingAttribution>((acc, source) => {
    for (const key of TRACKING_KEYS) {
      const value = source[key]
      if (value) {
        acc[key] = value
      }
    }

    return acc
  }, {})
}

export function buildTrackedClientPath(pathname: string, attribution: MarketingAttribution) {
  return buildTrackedPath(pathname, attribution)
}

export function readStoredMarketingAttribution() {
  if (typeof window === "undefined") {
    return {}
  }

  const stored = window.localStorage.getItem(TRACKING_STORAGE_KEY)
  if (!stored) {
    return {}
  }

  try {
    return sanitizeMarketingAttribution(JSON.parse(stored))
  } catch {
    window.localStorage.removeItem(TRACKING_STORAGE_KEY)
    return {}
  }
}

export function storeMarketingAttribution(attribution: MarketingAttribution) {
  if (typeof window === "undefined") {
    return
  }

  const sanitized = sanitizeMarketingAttribution(attribution)
  if (Object.keys(sanitized).length === 0) {
    return
  }

  window.localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(sanitized))
}

export function getClientMarketingAttribution() {
  if (typeof window === "undefined") {
    return {}
  }

  const fromSearch = parseMarketingSearch(window.location.search)
  const fromStorage = readStoredMarketingAttribution()
  const merged = mergeMarketingAttribution(fromStorage, fromSearch)

  if (Object.keys(merged).length > 0) {
    storeMarketingAttribution(merged)
  }

  return merged
}
