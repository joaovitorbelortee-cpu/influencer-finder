import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { createCheckoutSession, createOrRetrieveCustomer } from "@/lib/stripe"
import { isKnownPriceId } from "@/lib/billing"
import { sanitizeMarketingAttribution } from "@/lib/marketing-attribution"
import { z } from "zod"

const attributionSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
    fbclid: z.string().max(200).optional(),
  })
  .partial()

const schema = z.object({
  priceId: z.string(),
  attribution: attributionSchema.optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { priceId, attribution } = schema.parse(body)

    if (!isKnownPriceId(priceId)) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 })
    }

    const marketingMetadata = sanitizeMarketingAttribution(attribution)

    const customer = await createOrRetrieveCustomer({
      email: dbUser.email,
      name: dbUser.name,
      userId: dbUser.id,
      metadata: marketingMetadata,
    })

    if (!dbUser.stripe_customer_id) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripe_customer_id: customer.id },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const session = await createCheckoutSession({
      customerId: customer.id,
      email: dbUser.email,
      priceId,
      successUrl: `${appUrl}/dashboard?upgraded=true`,
      cancelUrl: `${appUrl}/settings`,
      metadata: {
        userId: dbUser.id,
        ...marketingMetadata,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Checkout error:", err)
    return NextResponse.json({ error: "Erro ao criar sessao de checkout" }, { status: 500 })
  }
}
