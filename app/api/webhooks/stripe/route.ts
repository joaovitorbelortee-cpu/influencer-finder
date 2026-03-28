import { NextRequest, NextResponse } from "next/server"
import { getStripeForWebhook } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripeForWebhook().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature error:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (userId && session.subscription) {
          const subscription = await getStripeForWebhook().subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const plan = getPlanFromPriceId(priceId)
          if (plan) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan, stripe_customer_id: session.customer as string },
            })
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)
        const customer = await getStripeForWebhook().customers.retrieve(subscription.customer as string)
        if ("email" in customer && customer.email && plan) {
          await prisma.user.update({
            where: { email: customer.email },
            data: { plan },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await getStripeForWebhook().customers.retrieve(subscription.customer as string)
        if ("email" in customer && customer.email) {
          await prisma.user.update({
            where: { email: customer.email },
            data: { plan: "FREE", searches_used: 0, emails_sent: 0 },
          })
        }
        break
      }

      case "invoice.payment_failed": {
        // Log and optionally notify user
        const invoice = event.data.object as Stripe.Invoice
        console.error("Payment failed for customer:", invoice.customer)
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function getPlanFromPriceId(priceId: string): "PRO" | "BUSINESS" | null {
  const proId = process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly"
  const businessId = process.env.STRIPE_BUSINESS_PRICE_ID || "price_business_monthly"
  if (priceId === proId) return "PRO"
  if (priceId === businessId) return "BUSINESS"
  return null
}
