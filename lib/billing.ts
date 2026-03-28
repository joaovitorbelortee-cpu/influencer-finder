export type PlanKey = "FREE" | "PRO" | "BUSINESS"
export type PaidPlanKey = Exclude<PlanKey, "FREE">

export interface PlanLimits {
  searches: number
  results: number
  emails: number
  export: boolean
}

export interface BillingPlanDefinition {
  key: PlanKey
  label: string
  price: string
  priceWithCadence: string
  cadence: string
  highlight: string
  features: string[]
  limits: PlanLimits
  defaultPriceId?: string
  highlighted?: boolean
}

const BILLING_PLAN_ORDER: PlanKey[] = ["FREE", "PRO", "BUSINESS"]

export const BILLING_PLANS: Record<PlanKey, BillingPlanDefinition> = {
  FREE: {
    key: "FREE",
    label: "Starter",
    price: "R$0",
    priceWithCadence: "R$0/mes",
    cadence: "/mes",
    highlight: "Validacao rapida",
    features: [
      "3 buscas por mes",
      "10 resultados por busca",
      "Entrada rapida para testar nichos",
    ],
    limits: {
      searches: 3,
      results: 10,
      emails: 0,
      export: false,
    },
  },
  PRO: {
    key: "PRO",
    label: "Pro",
    price: "R$97",
    priceWithCadence: "R$97/mes",
    cadence: "/mes",
    highlight: "Mais escolhido",
    features: [
      "30 buscas por mes",
      "30 resultados por busca",
      "10 emails enviados por mes",
      "Exportacao CSV",
    ],
    limits: {
      searches: 30,
      results: 30,
      emails: 10,
      export: true,
    },
    defaultPriceId: "price_pro_monthly",
    highlighted: true,
  },
  BUSINESS: {
    key: "BUSINESS",
    label: "Business",
    price: "R$297",
    priceWithCadence: "R$297/mes",
    cadence: "/mes",
    highlight: "Operacao recorrente",
    features: [
      "Buscas ilimitadas",
      "50 resultados por busca",
      "100 emails por mes",
      "Exportacao CSV",
      "Suporte prioritario",
    ],
    limits: {
      searches: Number.POSITIVE_INFINITY,
      results: 50,
      emails: 100,
      export: true,
    },
    defaultPriceId: "price_business_monthly",
  },
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  FREE: BILLING_PLANS.FREE.limits,
  PRO: BILLING_PLANS.PRO.limits,
  BUSINESS: BILLING_PLANS.BUSINESS.limits,
}

export function getBillingPlansForDisplay() {
  return BILLING_PLAN_ORDER.map((key) => BILLING_PLANS[key])
}

export function getFreePlan() {
  return BILLING_PLANS.FREE
}

export function getPaidPlansForDisplay() {
  return getBillingPlansForDisplay().filter(
    (plan): plan is BillingPlanDefinition & { key: PaidPlanKey; defaultPriceId: string } =>
      plan.key !== "FREE" && Boolean(plan.defaultPriceId)
  )
}

export function getPriceIdForPlan(plan: PaidPlanKey) {
  if (plan === "PRO") {
    return process.env.STRIPE_PRO_PRICE_ID || BILLING_PLANS.PRO.defaultPriceId!
  }

  return process.env.STRIPE_BUSINESS_PRICE_ID || BILLING_PLANS.BUSINESS.defaultPriceId!
}

export function getResolvedPaidPlans() {
  return getPaidPlansForDisplay().map((plan) => ({
    ...plan,
    priceId: getPriceIdForPlan(plan.key),
  }))
}

export function getPlanFromPriceId(priceId: string): PaidPlanKey | null {
  for (const plan of getPaidPlansForDisplay()) {
    if (priceId === getPriceIdForPlan(plan.key)) {
      return plan.key
    }
  }

  return null
}

export function isKnownPriceId(priceId: string) {
  return Boolean(getPlanFromPriceId(priceId))
}
