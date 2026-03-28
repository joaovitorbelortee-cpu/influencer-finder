import Stripe from "stripe"

export const STRIPE_PLANS = {
  PRO: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
  BUSINESS: process.env.STRIPE_BUSINESS_PRICE_ID || "price_business_monthly",
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder")
}

export async function createCheckoutSession(params: {
  customerId?: string
  email: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  const s = getStripe()
  const session = await s.checkout.sessions.create({
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.email,
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  })
  return session
}

export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const s = getStripe()
  const session = await s.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
  return session
}

export async function createOrRetrieveCustomer(params: {
  email: string
  name: string
  userId: string
}) {
  const s = getStripe()
  const existing = await s.customers.search({
    query: `email:'${params.email}'`,
  })
  if (existing.data.length > 0) return existing.data[0]
  return s.customers.create({
    email: params.email,
    name: params.name,
    metadata: { userId: params.userId },
  })
}

export function getStripeForWebhook() {
  return getStripe()
}
