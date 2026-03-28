import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.22),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(96,165,250,0.2),_transparent_24%),linear-gradient(135deg,_#08111d_0%,_#112031_45%,_#18344d_100%)] p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-10 text-white shadow-[0_30px_120px_rgba(8,17,29,0.45)] backdrop-blur lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-white/10">
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Creator Revenue OS</p>
              <p className="text-xl font-semibold">Influencer Finder</p>
            </div>
          </Link>

          <div className="mt-10 space-y-5">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">Aquisicao mais inteligente</p>
            <h1 className="max-w-xl text-5xl leading-[0.96] [font-family:var(--font-display)]">
              Descubra creators com potencial de venda antes de abrir mais uma planilha.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-200/82">
              Crie buscas por nicho, visualize dados uteis e acelere o outreach com contexto suficiente para agir.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              "Comece gratis com 3 buscas e valide o nicho sem risco.",
              "Suba de plano quando quiser operar mais creators e mais outreach.",
              "Mantenha a prospeccao organizada com favoritos, historico e exportacao.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-200/82">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-200" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 ring-1 ring-white/10">
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </div>
            <span className="text-2xl font-bold text-white">Influencer Finder</span>
          </div>
          <div className="mb-6 text-center text-sm text-white/75 lg:hidden">
            3 buscas gratis para validar o seu primeiro nicho
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
