import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { sanitizeMarketingAttribution } from "@/lib/marketing-attribution"
import { z } from "zod"

const attributionSchema = z
  .object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
    fbclid: z.string().max(200).optional(),
  })
  .partial()

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  attribution: attributionSchema.optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, attribution } = schema.parse(body)
    const sanitizedAttribution = sanitizeMarketingAttribution(attribution)

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          signup_source: "marketing-funnel",
          acquisition: sanitizedAttribution,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user) {
      await prisma.user.upsert({
        where: { email },
        update: { name },
        create: { id: data.user.id, email, name },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 422 })
    }

    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
