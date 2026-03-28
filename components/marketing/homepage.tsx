"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoiCalculator } from "@/components/marketing/roi-calculator"
import { trackMarketingEvent } from "@/lib/analytics"
import { getBillingPlansForDisplay } from "@/lib/billing"
import { MARKETING_FAQS } from "@/lib/marketing"

interface HomepageProps {
  signupHref: string
  loginHref: string
}

const steps = [
  {
    title: "Defina produto, nicho e faixa de creator",
    description: "Monte a busca em poucos minutos com filtros de campanha e palavras-chave.",
    icon: Target,
  },
  {
    title: "Receba creators com dados acionaveis",
    description: "Veja tier, engajamento, contato e links sem precisar abrir vinte abas.",
    icon: Search,
  },
  {
    title: "Aborde com mensagem pronta e exporte",
    description: "Ganhe velocidade comercial com estrategia de outreach e CSV quando precisar operar em escala.",
    icon: Mail,
  },
]

const differentiators = [
  "Pesquisa guiada para campanhas de creators no Brasil",
  "Mensagens de outreach prontas para acelerar o primeiro contato",
  "Planos simples para validar rapido e escalar sem trocar de ferramenta",
]

const plans = getBillingPlansForDisplay()

const featuredResults = [
  {
    name: "@shapecomanna",
    fit: "Alto fit para fitness premium",
    detail: "42k seguidores | 4.8% de engajamento | email valido",
  },
  {
    name: "@rotinadelucrar",
    fit: "Boa aderencia para educacao de compra",
    detail: "88k seguidores | 3.6% de engajamento | roteiro pronto",
  },
  {
    name: "@vidacomproposito",
    fit: "Conteudo aspiracional e linguagem consultiva",
    detail: "16k seguidores | 5.2% de engajamento | link externo ativo",
  },
]

export function Homepage({ signupHref, loginHref }: HomepageProps) {
  const trackCta = (placement: string, destination: string) => {
    trackMarketingEvent("marketing_cta_click", {
      placement,
      destination,
    })
  }

  return (
    <main className="bg-[#f4efe7] text-slate-900">
      <section className="relative overflow-hidden bg-[#112031] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(90,200,250,0.26),_transparent_35%),radial-gradient(circle_at_85%_15%,_rgba(244,114,182,0.20),_transparent_30%),linear-gradient(135deg,_#08111d_0%,_#112031_45%,_#18344d_100%)]" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-6 pb-14 pt-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-white/10">
                <Sparkles className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Creator Revenue OS</p>
                <p className="text-lg font-semibold">Influencer Finder</p>
              </div>
            </Link>

            <nav className="flex items-center gap-3 text-sm text-white/80">
              <a href="#como-funciona" className="hidden hover:text-white md:inline-flex">
                Como funciona
              </a>
              <a href="#precos" className="hidden hover:text-white md:inline-flex">
                Planos
              </a>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href={loginHref} onClick={() => trackCta("header_login", "login")}>
                  Entrar
                </Link>
              </Button>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[0.9fr,1.1fr] lg:py-16">
            <div className="max-w-2xl space-y-7">
              <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
                Prospeccao de creators para ecommerce, infoproduto e servico
              </Badge>

              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">
                  Pare de escolher creator no feeling
                </p>
                <h1 className="max-w-3xl text-5xl font-semibold leading-[0.94] [font-family:var(--font-display)] sm:text-6xl lg:text-7xl">
                  Descubra quem pode vender seu produto antes de investir pesado em ads.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-200/88 sm:text-lg">
                  Encontre creators alinhados ao seu nicho, gere outreach com IA e organize sua prospeccao
                  em um fluxo pensado para sair do caos e virar pipeline.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-cyan-300 px-7 text-slate-950 hover:bg-cyan-200"
                >
                  <Link href={signupHref} onClick={() => trackCta("hero_primary", "signup")}>
                    Comecar gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/20 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="#precos">
                    Ver planos
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              <div className="grid gap-3 pt-3 sm:grid-cols-3">
                {differentiators.map((item) => (
                  <div key={item} className="border-l border-white/15 pl-4 text-sm text-slate-200/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-10 hidden h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl lg:block" />
              <div className="absolute right-0 top-0 hidden h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl lg:block" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_35px_120px_rgba(8,17,29,0.55)] backdrop-blur">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#08111d]/85 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Busca ativa</p>
                      <p className="mt-2 text-2xl font-semibold">
                        Campanha de creators para ticket medio de R$179
                      </p>
                    </div>
                    <Badge variant="success" className="bg-emerald-400/15 text-emerald-100">
                      12 matches quentes
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-4">
                    {featuredResults.map((result) => (
                      <div
                        key={result.name}
                        className="grid gap-2 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 sm:grid-cols-[1fr,auto] sm:items-center"
                      >
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-white">{result.name}</p>
                          <p className="text-sm text-cyan-100">{result.fit}</p>
                          <p className="text-xs text-slate-400">{result.detail}</p>
                        </div>
                        <div className="inline-flex items-center rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                          estrategia pronta
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                    {[
                      { label: "Tempo para shortlist", value: "ate 15 min" },
                      { label: "Mensagem inicial", value: "gera em segundos" },
                      { label: "Exportacao", value: "CSV e operacao" },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.7fr,1.3fr]">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit bg-slate-900 text-white hover:bg-slate-900">
              Operacao clara
            </Badge>
            <h2 className="text-4xl font-semibold leading-tight [font-family:var(--font-display)] sm:text-5xl">
              Um fluxo enxuto para sair do briefing e entrar em contato mais rapido.
            </h2>
            <p className="max-w-md text-sm leading-7 text-slate-600 sm:text-base">
              Em vez de planilha, navegacao manual e mensagem improvisada, voce centraliza busca,
              qualificacao e outreach no mesmo lugar.
            </p>
          </div>

          <div className="space-y-5">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="grid gap-4 border-b border-slate-200 pb-5 last:border-b-0 sm:grid-cols-[auto,1fr]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Passo {index + 1}</p>
                  <h3 className="text-xl font-semibold text-slate-950">{step.title}</h3>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
        <RoiCalculator />
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.82fr,1.18fr]">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit border-slate-300 text-slate-700">
                Porque times usam
              </Badge>
              <h2 className="text-4xl font-semibold leading-tight [font-family:var(--font-display)] sm:text-5xl">
                Menos tempo procurando perfil, mais tempo fechando parceria.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Qualificacao em camadas",
                  text: "Tier, engajamento, canais de contato e contexto do creator em uma leitura so.",
                  icon: ShieldCheck,
                },
                {
                  title: "Outreach mais rapido",
                  text: "Sugestao de abordagem inicial para acelerar testes de pitch e proposta.",
                  icon: Mail,
                },
                {
                  title: "Visao para escalar",
                  text: "Exporte, favorite e mantenha historico para nao recomecar a cada campanha.",
                  icon: TrendingUp,
                },
              ].map((item) => (
                <div key={item.title} className="space-y-4 rounded-[1.75rem] border border-slate-200 p-5">
                  <item.icon className="h-5 w-5 text-slate-900" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="precos" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="space-y-4 text-center">
          <Badge variant="secondary" className="mx-auto w-fit bg-slate-900 text-white hover:bg-slate-900">
            Planos simples
          </Badge>
          <h2 className="text-4xl font-semibold leading-tight [font-family:var(--font-display)] sm:text-5xl">
            Comece validando. Escale quando a operacao pedir volume.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Entre gratis, teste o fluxo completo e suba de plano quando o volume de creators e outreach
            pedir mais velocidade.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-[2rem] border p-6 ${
                plan.key === "PRO"
                  ? "border-slate-950 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{plan.highlight}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{plan.label}</h3>
                </div>
                {plan.highlighted ? (
                  <Badge className="bg-cyan-300 text-slate-950 hover:bg-cyan-300">mais vendido</Badge>
                ) : null}
              </div>

              <div className="mt-8 flex items-end gap-1">
                <span className="text-4xl font-semibold">{plan.price}</span>
                <span
                  className={`pb-1 text-sm ${plan.key === "PRO" ? "text-slate-300" : "text-slate-500"}`}
                >
                  {plan.cadence}
                </span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 ${plan.key === "PRO" ? "text-cyan-300" : "text-emerald-500"}`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`mt-8 h-11 w-full rounded-full ${
                  plan.key === "PRO"
                    ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                <Link
                  href={signupHref}
                  onClick={() => trackCta(`pricing_${plan.key.toLowerCase()}`, "signup")}
                >
                  Criar conta
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#fff9f1]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr,1.2fr]">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit border-slate-300 text-slate-700">
                FAQ
              </Badge>
              <h2 className="text-4xl font-semibold leading-tight [font-family:var(--font-display)] sm:text-5xl">
                O que voce precisa saber antes de subir a primeira campanha.
              </h2>
            </div>

            <div className="space-y-5">
              {MARKETING_FAQS.map((faq) => (
                <div key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-950">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#08111d] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">
                Pronto para testar agora
              </Badge>
              <h2 className="text-4xl font-semibold leading-tight [font-family:var(--font-display)] sm:text-5xl">
                Entre gratis e valide sua primeira lista de creators ainda hoje.
              </h2>
              <p className="text-sm leading-7 text-slate-300 sm:text-base">
                Se o produto vende e o creator tem aderencia, voce precisa descobrir isso rapido. O resto da
                operacao vem depois.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-cyan-300 px-7 text-slate-950 hover:bg-cyan-200"
              >
                <Link href={signupHref} onClick={() => trackCta("final_primary", "signup")}>
                  Criar conta gratis
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={loginHref} onClick={() => trackCta("final_secondary", "login")}>
                  Ja tenho conta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
