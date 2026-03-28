export const PLAN_LIMITS = {
  FREE: { searches: 3, results: 10, emails: 0, export: false },
  PRO: { searches: 30, results: 30, emails: 10, export: true },
  BUSINESS: { searches: Infinity, results: 50, emails: 100, export: true },
} as const

export const TIER_RANGES = {
  MICRO: { min: 1000, max: 50000, label: "Micro", description: "1K-50K seguidores" },
  MID: { min: 50001, max: 500000, label: "Mid", description: "50K-500K seguidores" },
  MACRO: { min: 500001, max: Infinity, label: "Macro", description: "500K+ seguidores" },
} as const

export const NICHES = [
  "fitness", "beleza", "tech", "games", "moda", "culinária",
  "finanças", "maternidade", "pets", "viagem", "humor", "lifestyle",
  "saúde", "educação", "esportes", "decoração", "automóveis", "música"
]

export const PARTNERSHIP_TYPES = ["Publipost", "Permuta", "Afiliado", "Embaixador", "Review"]
export const TONES = ["Profissional", "Casual", "Direto ao ponto"]
export const PRICE_RANGES = ["Até R$50", "R$50-200", "R$200-500", "R$500+"]

export const PLAN_PRICES = {
  PRO: { monthly: "R$97", priceId: "price_pro_monthly" },
  BUSINESS: { monthly: "R$297", priceId: "price_business_monthly" },
}
