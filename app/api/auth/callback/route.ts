import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const name = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Usuário"
      await prisma.user.upsert({
        where: { email: data.user.email! },
        update: {},
        create: { id: data.user.id, email: data.user.email!, name },
      })
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
