import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"
import { processSearchDirect } from "@/lib/jobs/process-search-direct"

export const maxDuration = 60 // Vercel Pro allows up to 60s

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const result = await processSearchDirect(params.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Process search error:", error)
    return NextResponse.json(
      { error: "Erro ao processar busca" },
      { status: 500 }
    )
  }
}
