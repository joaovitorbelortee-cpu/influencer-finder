import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { sendOutreachEmail } from "@/lib/email"
import { PLAN_LIMITS } from "@/lib/constants"

const schema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 })
  }

  const plan = dbUser.plan as "FREE" | "PRO" | "BUSINESS"
  const limits = PLAN_LIMITS[plan]

  if (limits.emails === 0) {
    return NextResponse.json(
      { error: "Envio de e-mail nao disponivel no plano gratuito" },
      { status: 403 }
    )
  }

  if (dbUser.emails_sent >= limits.emails) {
    return NextResponse.json(
      { error: "Limite de e-mails atingido neste mes" },
      { status: 403 }
    )
  }

  const result = await prisma.searchResult.findUnique({
    where: { id: params.id },
    include: {
      search: { select: { user_id: true } },
      influencer: { select: { email_from_bio: true } },
    },
  })

  if (!result || result.search.user_id !== dbUser.id) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 })
  }

  if (!result.influencer.email_from_bio) {
    return NextResponse.json(
      { error: "Influenciador sem e-mail disponivel" },
      { status: 400 }
    )
  }

  try {
    const payload = await req.json()
    const { subject, body } = schema.parse(payload)

    await sendOutreachEmail({
      to: result.influencer.email_from_bio,
      subject,
      body,
      fromName: dbUser.name,
    })

    await prisma.searchResult.update({
      where: { id: params.id },
      data: { outreach_status: "SENT", email_sent_at: new Date() },
    })

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { emails_sent: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 422 })
    }

    console.error("Email send error:", error)
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 })
  }
}
