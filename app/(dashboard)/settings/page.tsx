import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./settings-client"
import { PLAN_LIMITS } from "@/lib/constants"
import { getResolvedPaidPlans } from "@/lib/billing"

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) redirect("/login")

  const plan = dbUser.plan as "FREE" | "PRO" | "BUSINESS"
  const limits = PLAN_LIMITS[plan]

  return (
    <SettingsClient
      user={{
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        plan,
        searchesUsed: dbUser.searches_used,
        emailsSent: dbUser.emails_sent,
        stripeCustomerId: dbUser.stripe_customer_id,
      }}
      limits={limits}
      paidPlans={getResolvedPaidPlans()}
    />
  )
}
