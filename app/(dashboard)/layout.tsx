import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })

  return (
    <DashboardShell
      userName={dbUser?.name || user.email || ""}
      userEmail={user.email || ""}
      plan={dbUser?.plan || "FREE"}
    >
      {children}
    </DashboardShell>
  )
}
