import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { createPortalSession } from "@/lib/stripe"

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser?.stripe_customer_id) {
    return NextResponse.json({ error: "Sem assinatura ativa" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const session = await createPortalSession({
    customerId: dbUser.stripe_customer_id,
    returnUrl: `${appUrl}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
