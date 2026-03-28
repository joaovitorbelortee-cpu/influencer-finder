"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Crown, Check } from "lucide-react"
import { PLAN_LIMITS } from "@/lib/constants"

interface UserInfo {
  id: string
  name: string
  email: string
  plan: "FREE" | "PRO" | "BUSINESS"
  searchesUsed: number
  emailsSent: number
  stripeCustomerId: string | null
}

interface Props {
  user: UserInfo
  limits: { searches: number; results: number; emails: number; export: boolean }
}

const PLANS = [
  {
    key: "FREE",
    label: "Gratuito",
    price: "R$0/mês",
    features: ["3 buscas/mês", "10 resultados/busca", "Sem envio de e-mail", "Sem exportação"],
  },
  {
    key: "PRO",
    label: "Pro",
    price: "R$97/mês",
    priceId: "price_pro_monthly",
    features: ["30 buscas/mês", "30 resultados/busca", "10 e-mails/mês", "Exportação CSV"],
    highlighted: true,
  },
  {
    key: "BUSINESS",
    label: "Business",
    price: "R$297/mês",
    priceId: "price_business_monthly",
    features: ["Buscas ilimitadas", "50 resultados/busca", "100 e-mails/mês", "Exportação CSV", "Suporte prioritário"],
  },
]

export function SettingsClient({ user, limits }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast({ title: "Perfil atualizado com sucesso!" })
      } else {
        toast({ title: "Erro ao salvar", variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpgrade(priceId: string) {
    setUpgrading(priceId)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast({ title: "Erro ao iniciar checkout", variant: "destructive" })
    } finally {
      setUpgrading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast({ title: "Erro ao acessar portal", variant: "destructive" })
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e assinatura</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user.email} disabled className="bg-gray-50" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>
            <Button type="submit" disabled={saving} className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#6C63FF]" />
            Plano Atual: <span className="text-[#6C63FF]">{user.plan}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Buscas usadas", value: `${user.searchesUsed}/${limits.searches === Infinity ? "∞" : limits.searches}` },
              { label: "E-mails enviados", value: `${user.emailsSent}/${limits.emails === 0 ? "0" : limits.emails}` },
              { label: "Export CSV", value: limits.export ? "✓" : "✗" },
              { label: "Resultado/busca", value: limits.results },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-lg font-bold text-[#1A1A2E]">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {user.plan !== "FREE" && (
            <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Gerenciar Assinatura
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planos</CardTitle>
          <CardDescription>Escolha o plano ideal para sua operação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === user.plan
              return (
                <div
                  key={plan.key}
                  className={`rounded-xl border-2 p-5 relative ${
                    plan.highlighted ? "border-[#6C63FF]" : isCurrent ? "border-green-400" : "border-gray-200"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#6C63FF] text-white text-xs font-semibold px-3 py-1 rounded-full">Popular</span>
                    </div>
                  )}
                  <h3 className="font-bold text-[#1A1A2E]">{plan.label}</h3>
                  <p className="text-2xl font-bold mt-1 mb-3">{plan.price}</p>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>Plano atual</Button>
                  ) : plan.key !== "FREE" && plan.priceId ? (
                    <Button
                      className="w-full bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                      onClick={() => handleUpgrade(plan.priceId!)}
                      disabled={!!upgrading}
                    >
                      {upgrading === plan.priceId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar"}
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            A exclusão da conta é permanente e remove todos os seus dados.
          </p>
          <Button variant="outline" className="border-red-300 text-red-500 hover:bg-red-50">
            Excluir Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
