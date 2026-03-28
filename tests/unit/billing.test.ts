import { afterEach, describe, expect, it } from "vitest"
import { getPlanFromPriceId, getResolvedPaidPlans, isKnownPriceId } from "@/lib/billing"

describe("billing catalog", () => {
  const originalPro = process.env.STRIPE_PRO_PRICE_ID
  const originalBusiness = process.env.STRIPE_BUSINESS_PRICE_ID

  afterEach(() => {
    if (originalPro) {
      process.env.STRIPE_PRO_PRICE_ID = originalPro
    } else {
      delete process.env.STRIPE_PRO_PRICE_ID
    }

    if (originalBusiness) {
      process.env.STRIPE_BUSINESS_PRICE_ID = originalBusiness
    } else {
      delete process.env.STRIPE_BUSINESS_PRICE_ID
    }
  })

  it("resolves paid plans with the current Stripe price ids", () => {
    process.env.STRIPE_PRO_PRICE_ID = "price_live_pro"
    process.env.STRIPE_BUSINESS_PRICE_ID = "price_live_business"

    expect(getResolvedPaidPlans()).toEqual([
      expect.objectContaining({ key: "PRO", priceId: "price_live_pro" }),
      expect.objectContaining({ key: "BUSINESS", priceId: "price_live_business" }),
    ])
  })

  it("maps incoming Stripe prices back to internal plans", () => {
    process.env.STRIPE_PRO_PRICE_ID = "price_live_pro"

    expect(getPlanFromPriceId("price_live_pro")).toBe("PRO")
    expect(isKnownPriceId("price_live_pro")).toBe(true)
    expect(getPlanFromPriceId("price_unknown")).toBeNull()
  })
})
