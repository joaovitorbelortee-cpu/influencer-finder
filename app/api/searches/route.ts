import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS } from "@/lib/constants"
import { processSearchDirect } from "@/lib/jobs/process-search-direct"
import { z } from "zod"

const schema = z.object({
  niche: z.string().min(1).max(100),
  product_name: z.string().min(1).max(100),
  product_description: z.string().min(20).max(1000),
  product_link: z.string().url().optional().nullable(),
  price_range: z.string().optional().nullable(),
  keywords: z.array(z.string()).max(5).default([]),
  tier: z.enum(["MICRO", "MID", "MACRO"]),
  include_adjacent: z.boolean().default(false),
  tone: z.string().default("Profissional"),
  partnership_types: z.array(z.string()).default([]),
  budget: z.string().optional().nullable(),
  auto_send_email: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  const plan = dbUser.plan as "FREE" | "PRO" | "BUSINESS"
  const limits = PLAN_LIMITS[plan]

  if (limits.searches !== Infinity && dbUser.searches_used >= limits.searches) {
    return NextResponse.json(
      { error: "Limite de buscas do plano atingido. Faça upgrade para continuar." },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const search = await prisma.search.create({
      data: {
        user_id: dbUser.id,
        niche: data.niche,
        product_name: data.product_name,
        product_description: data.product_description,
        product_link: data.product_link,
        price_range: data.price_range,
        keywords: data.keywords,
        tier: data.tier,
        include_adjacent: data.include_adjacent,
        tone: data.tone,
        partnership_types: data.partnership_types,
        budget: data.budget,
        auto_send_email: data.auto_send_email,
        status: "PENDING",
      },
    })

    // Process search in background (fire-and-forget)
    // Don't await - return immediately so user sees the search was created
    processSearchDirect(search.id).catch((err) => {
      console.error("Background search processing error:", err)
    })

    return NextResponse.json({ id: search.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: err.errors }, { status: 422 })
    }
    console.error("Search creation error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const searches = await prisma.search.findMany({
    where: { user_id: dbUser.id },
    orderBy: { created_at: "desc" },
    take: 50,
  })

  return NextResponse.json(searches)
}
