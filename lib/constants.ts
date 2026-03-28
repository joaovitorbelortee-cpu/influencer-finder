export { PLAN_LIMITS } from "@/lib/billing"

export const TIER_RANGES = {
  MICRO: { min: 1000, max: 50000, label: "Micro", description: "1K-50K seguidores" },
  MID: { min: 50001, max: 500000, label: "Mid", description: "50K-500K seguidores" },
  MACRO: { min: 500001, max: Infinity, label: "Macro", description: "500K+ seguidores" },
} as const

export const NICHES = [
  "fitness",
  "beleza",
  "tech",
  "games",
  "moda",
  "culinaria",
  "financas",
  "maternidade",
  "pets",
  "viagem",
  "humor",
  "lifestyle",
  "saude",
  "educacao",
  "esportes",
  "decoracao",
  "automoveis",
  "musica",
]

export const PARTNERSHIP_TYPES = ["Publipost", "Permuta", "Afiliado", "Embaixador", "Review"]
export const TONES = ["Profissional", "Casual", "Direto ao ponto"]
export const PRICE_RANGES = ["Ate R$50", "R$50-200", "R$200-500", "R$500+"]
