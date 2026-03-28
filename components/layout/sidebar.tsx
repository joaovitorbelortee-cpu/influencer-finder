"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  Star,
  Settings,
  Zap,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search/new", label: "Nova Busca", icon: Search },
  { href: "/favorites", label: "Favoritos", icon: Star },
  { href: "/settings", label: "Configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1A1A2E] text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold">Influencer Finder</span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#6C63FF] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-4">
        <div className="mb-4 rounded-lg border border-[#6C63FF]/30 bg-gradient-to-br from-[#6C63FF]/30 to-[#6C63FF]/10 p-4">
          <p className="mb-1 text-xs font-semibold text-white">Upgrade para PRO</p>
          <p className="mb-3 text-xs text-white/60">30 buscas/mes + exportacao</p>
          <Link href="/settings">
            <Button size="sm" className="h-8 w-full bg-[#6C63FF] text-xs text-white hover:bg-[#6C63FF]/90">
              Ver planos
            </Button>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
