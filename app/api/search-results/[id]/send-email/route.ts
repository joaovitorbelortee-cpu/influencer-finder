import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { sendOutreachEmail } from "@/lib/email"
import { PLAN_LIMITS } from "@/lib/constants"
import { z } from "zod"

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const plan = dbUser.plan as "FREE" | "PRO" | "BUSINESS"
  const limits = PLAN_LIMITS[plan]

  if (limits.emails === 0) {
    return NextResponse.json({ error: "Envio de e-mail não disponível no plano gratuito" }, { status: 403 })
  }

  if (dbUser.emails_sent >= limits.emails) {
    return NextResponse.json({ error: "Limite de e-mails atingido neste mês" }, { status: 403 })
  }

  const result = await prisma.searchResult.findUnique({
    where: { id: params.id },
    include: { search: { select: { user_id: true } } },
  })

  if (!result || result.search.user_id !== dbUser.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { to, subject, body: emailBody } = schema.parse(body)

    await sendOutreachEmail({ to, subject, body: emailBody, fromName: dbUser.name })

    await prisma.searchResult.update({
      where: { id: params.id },
      data: { outreach_status: "SENT", email_sent_at: new Date() },
    })

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { emails_sent: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 422 })
    }
    console.error("Email send error:", err)
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 })
  }
}
