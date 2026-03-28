"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Crown, Check } from "lucide-react"
import { buildTrackedClientPath, getClientMarketingAttribution, type MarketingAttribution } from "@/lib/marketing-attribution"

interface UserInfo {
  id: string
  name: string
  email: string
  plan: "FREE" | "PRO" | "BUSINESS"
  searchesUsed: number
  emailsSent: number
  stripeCustomerId: string | null
}

interface PaidPlan {
  key: "PRO" | "BUSINESS"
  label: string
  priceWithCadence: string
  features: string[]
  priceId: string
  highlighted?: boolean
}

interface Props {
  user: UserInfo
  limits: { searches: number; results: number; emails: number; export: boolean }
  paidPlans: PaidPlan[]
}

const FREE_PLAN = {
  key: "FREE",
  label: "Gratuito",
  priceWithCadence: "R$0/mes",
  features: [
    "3 buscas/mes",
    "10 resultados/busca",
    "Sem envio de email",
    "Sem exportacao",
  ],
}

function isPaidPlan(plan: typeof FREE_PLAN | PaidPlan): plan is PaidPlan {
  return "priceId" in plan
}

export function SettingsClient({ user, limits, paidPlans }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [attribution, setAttribution] = useState<MarketingAttribution>({})

  const plans = [FREE_PLAN, ...paidPlans]

  useEffect(() => {
    setAttribution(getClientMarketingAttribution())
  }, [])

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
        body: JSON.stringify({ priceId, attribution }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast({ title: "Erro ao iniciar checkout", variant: "destructive" })
      }
    } finally {
      setUpgrading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast({ title: "Erro ao acessar portal", variant: "destructive" })
      }
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e assinatura</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Atualize suas informacoes pessoais</CardDescription>
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
              <p className="text-xs text-muted-foreground">O e-mail nao pode ser alterado</p>
            </div>
            <Button type="submit" disabled={saving} className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alteracoes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#6C63FF]" />
            Plano atual: <span className="text-[#6C63FF]">{user.plan}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Buscas usadas",
                value: `${user.searchesUsed}/${limits.searches === Infinity ? "inf" : limits.searches}`,
              },
              {
                label: "Emails enviados",
                value: `${user.emailsSent}/${limits.emails === 0 ? "0" : limits.emails}`,
              },
              { label: "Export CSV", value: limits.export ? "sim" : "nao" },
              { label: "Resultado/busca", value: limits.results },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-[#1A1A2E]">{item.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          {user.plan !== "FREE" ? (
            <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gerenciar assinatura
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planos</CardTitle>
          <CardDescription>Escolha o plano ideal para sua operacao</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.key === user.plan
              const checkoutHref = buildTrackedClientPath("/signup", attribution)

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border-2 p-5 ${
                    "highlighted" in plan && plan.highlighted
                      ? "border-[#6C63FF]"
                      : isCurrent
                        ? "border-green-400"
                        : "border-gray-200"
                  }`}
                >
                  {"highlighted" in plan && plan.highlighted ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-[#6C63FF] px-3 py-1 text-xs font-semibold text-white">
                        Popular
                      </span>
                    </div>
                  ) : null}

                  <h3 className="font-bold text-[#1A1A2E]">{plan.label}</h3>
                  <p className="mb-3 mt-1 text-2xl font-bold">{plan.priceWithCadence}</p>

                  <ul className="mb-4 space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano atual
                    </Button>
                  ) : isPaidPlan(plan) ? (
                    <Button
                      className="w-full bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                      onClick={() => handleUpgrade(plan.priceId)}
                      disabled={Boolean(upgrading)}
                    >
                      {upgrading === plan.priceId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assinar"}
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <a href={checkoutHref}>Criar conta</a>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            A exclusao da conta e permanente e remove todos os seus dados.
          </p>
          <Button variant="outline" className="border-red-300 text-red-500 hover:bg-red-50">
            Excluir conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
