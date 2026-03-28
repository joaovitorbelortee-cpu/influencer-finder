import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { processSearchDirect } from "@/lib/jobs/process-search-direct"

export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 })
  }

  const search = await prisma.search.findFirst({
    where: { id: params.id, user_id: dbUser.id },
    select: { id: true, status: true, results_count: true },
  })

  if (!search) {
    return NextResponse.json({ error: "Busca nao encontrada" }, { status: 404 })
  }

  if (search.status === "DONE") {
    return NextResponse.json({
      success: true,
      status: search.status,
      resultsCount: search.results_count,
    })
  }

  try {
    const result = await processSearchDirect(search.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Process search error:", error)
    return NextResponse.json({ error: "Erro ao processar busca" }, { status: 500 })
  }
}
