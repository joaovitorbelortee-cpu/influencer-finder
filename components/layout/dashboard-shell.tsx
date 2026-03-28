import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface DashboardShellProps {
  children: React.ReactNode
  userName?: string
  userEmail?: string
  plan?: string
}

export function DashboardShell({ children, userName, userEmail, plan }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Header userName={userName} userEmail={userEmail} plan={plan} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
