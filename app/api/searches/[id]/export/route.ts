import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { escapeCsvField } from "@/lib/csv"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  if (dbUser.plan === "FREE") {
    return NextResponse.json({ error: "Exportação disponível apenas nos planos PRO e BUSINESS" }, { status: 403 })
  }

  const search = await prisma.search.findUnique({
    where: { id: params.id, user_id: dbUser.id },
    include: {
      results: {
        include: { influencer: true },
        orderBy: { influencer: { engagement_rate: "desc" } },
      },
    },
  })

  if (!search) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const header = [
    "Username", "Nome", "Seguidores", "Engajamento (%)", "Tier", "E-mail",
    "Link Externo", "Conta Business", "Estratégia IA", "Mensagem Outreach",
    "Tipo Parceria", "Valor Estimado"
  ]

  const rows = search.results.map((r) => [
    r.influencer.instagram_username,
    r.influencer.full_name || "",
    r.influencer.followers_count,
    r.influencer.engagement_rate.toFixed(2),
    r.influencer.tier,
    r.influencer.email_from_bio || "",
    r.influencer.external_link || "",
    r.influencer.has_business_contact ? "Sim" : "Não",
    (r.ai_strategy || "").replace(/,/g, ";").replace(/\n/g, " "),
    (r.ai_outreach_message || "").replace(/,/g, ";").replace(/\n/g, " "),
    r.ai_partnership || "",
    r.ai_estimated_value || "",
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((value) => escapeCsvField(value)).join(","))
    .join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="influencers-${search.niche}-${search.id.slice(0, 8)}.csv"`,
    },
  })
}
