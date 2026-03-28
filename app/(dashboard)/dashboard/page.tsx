import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { SearchHistory } from "@/components/dashboard/search-history"
import { UsageBar } from "@/components/dashboard/usage-bar"
import { PLAN_LIMITS } from "@/lib/constants"

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      searches: {
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
  })

  if (!dbUser) redirect("/login")

  const plan = dbUser.plan as "FREE" | "PRO" | "BUSINESS"
  const limits = PLAN_LIMITS[plan]

  // Aggregate stats
  const [influencersFound, emailsFound, emailsSent] = await Promise.all([
    prisma.searchResult.count({
      where: { search: { user_id: dbUser.id } },
    }),
    prisma.searchResult.count({
      where: {
        search: { user_id: dbUser.id },
        influencer: { email_from_bio: { not: null } },
      },
    }),
    prisma.searchResult.count({
      where: {
        search: { user_id: dbUser.id },
        outreach_status: "SENT",
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta, {dbUser.name.split(" ")[0]}!</p>
        </div>
      </div>

      <UsageBar
        plan={plan}
        searchesUsed={dbUser.searches_used}
      />

      <StatsCards
        searchesCount={dbUser.searches.length}
        influencersFound={influencersFound}
        emailsFound={emailsFound}
        emailsSent={emailsSent}
      />

      <SearchHistory searches={dbUser.searches.map(s => ({ ...s, created_at: s.created_at.toISOString() }))} />
    </div>
  )
}
