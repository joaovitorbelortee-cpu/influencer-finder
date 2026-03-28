import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { SearchWizard } from "@/components/search/search-wizard"

export default async function NewSearchPage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Nova Busca</h1>
        <p className="text-sm text-muted-foreground">Encontre influenciadores ideais para seu produto em 3 passos</p>
      </div>
      <SearchWizard
        plan={dbUser.plan as "FREE" | "PRO" | "BUSINESS"}
        searchesUsed={dbUser.searches_used}
      />
    </div>
  )
}
