import { createServerSupabaseClient } from "./supabase"
import { prisma } from "./prisma"
import { NextResponse } from "next/server"

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, dbUser: null, error: "Unauthorized" }
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
  })

  if (!dbUser) {
    return { user, dbUser: null, error: "User not found in database" }
  }

  return { user, dbUser, error: null }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}
