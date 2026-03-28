import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { createCheckoutSession, createOrRetrieveCustomer } from "@/lib/stripe"
import { z } from "zod"

const schema = z.object({
  priceId: z.string(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  try {
    const body = await req.json()
    const { priceId } = schema.parse(body)

    const customer = await createOrRetrieveCustomer({
      email: dbUser.email,
      name: dbUser.name,
      userId: dbUser.id,
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
      metadata: { userId: dbUser.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Checkout error:", err)
    return NextResponse.json({ error: "Erro ao criar sessão de checkout" }, { status: 500 })
  }
}
