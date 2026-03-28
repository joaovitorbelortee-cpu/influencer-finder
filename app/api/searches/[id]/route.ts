import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const search = await prisma.search.findUnique({
    where: { id: params.id, user_id: dbUser.id },
    include: {
      results: {
        include: { influencer: true },
        orderBy: { influencer: { engagement_rate: "desc" } },
      },
    },
  })

  if (!search) return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 })

  return NextResponse.json(search)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const search = await prisma.search.findUnique({ where: { id: params.id, user_id: dbUser.id } })
  if (!search) return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 })

  await prisma.search.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
