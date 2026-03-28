import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const result = await prisma.searchResult.findUnique({
    where: { id: params.id },
    include: { search: { select: { user_id: true } } },
  })

  if (!result || result.search.user_id !== dbUser.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const updated = await prisma.searchResult.update({
    where: { id: params.id },
    data: { is_favorite: !result.is_favorite },
  })

  return NextResponse.json({ is_favorite: updated.is_favorite })
}
