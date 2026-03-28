import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase"

const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublic =
    pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route))
  const isApi = pathname.startsWith("/api")
  const isWebhook = pathname.startsWith("/api/webhooks")

  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  const { supabase, supabaseResponse } = createMiddlewareClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isWebhook || isApi) return supabaseResponse

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
