"use client"

import { useState } from "react"
import { TrendingUp, Users, MousePointerClick, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value)
}

export function RoiCalculator() {
  const [creators, setCreators] = useState(12)
  const [ticket, setTicket] = useState(179)
  const [conversionRate, setConversionRate] = useState(2.4)

  const estimatedReach = creators * 18000
  const qualifiedVisits = Math.round(estimatedReach * 0.028)
  const estimatedSales = Math.max(
    1,
    Math.round(qualifiedVisits * (conversionRate / 100))
  )
  const projectedRevenue = estimatedSales * ticket

  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-[#0f172a] px-6 py-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.45)] lg:px-8"
      aria-labelledby="roi-title"
    >
      <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-4">
          <Badge variant="info" className="w-fit bg-cyan-500/15 text-cyan-100">
            Simulador rapido de ROI
          </Badge>
          <div className="space-y-3">
            <h2
              id="roi-title"
              className="text-3xl font-semibold leading-tight [font-family:var(--font-display)] sm:text-4xl"
            >
              Veja quanto uma campanha com creators pode devolver antes de gastar em media.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Ajuste os parametros abaixo para simular alcance, visitas qualificadas e faturamento potencial
              com base no volume de creators ativados.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-200">
              <span>Creators ativados</span>
              <Input
                type="number"
                min={1}
                value={creators}
                onChange={(event) => setCreators(Math.max(1, Number(event.target.value) || 1))}
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Ticket medio</span>
              <Input
                type="number"
                min={1}
                value={ticket}
                onChange={(event) => setTicket(Math.max(1, Number(event.target.value) || 1))}
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span>Conversao do trafego (%)</span>
              <Input
                type="number"
                min={0.1}
                step={0.1}
                value={conversionRate}
                onChange={(event) =>
                  setConversionRate(Math.max(0.1, Number(event.target.value) || 0.1))
                }
                className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Alcance potencial",
              value: formatNumber(estimatedReach),
              icon: Users,
              tone: "from-sky-500/25 to-sky-300/10",
            },
            {
              label: "Visitas qualificadas",
              value: formatNumber(qualifiedVisits),
              icon: MousePointerClick,
              tone: "from-emerald-500/25 to-emerald-300/10",
            },
            {
              label: "Pedidos estimados",
              value: formatNumber(estimatedSales),
              icon: ShoppingCart,
              tone: "from-amber-500/25 to-amber-300/10",
            },
            {
              label: "Faturamento potencial",
              value: formatCurrency(projectedRevenue),
              icon: TrendingUp,
              tone: "from-fuchsia-500/25 to-fuchsia-300/10",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${item.tone} p-5`}
            >
              <item.icon className="mb-6 h-5 w-5 text-white/80" />
              <p className="text-sm text-slate-300">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
