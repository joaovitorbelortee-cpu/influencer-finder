"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { getFreePlan } from "@/lib/billing"
import {
  buildTrackedClientPath,
  getClientMarketingAttribution,
  type MarketingAttribution,
} from "@/lib/marketing-attribution"

const freePlan = getFreePlan()

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [attribution, setAttribution] = useState<MarketingAttribution>({})

  useEffect(() => {
    setAttribution(getClientMarketingAttribution())
  }, [])

  const withTracking = (pathname: string) => buildTrackedClientPath(pathname, attribution)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: "As senhas nao conferem", variant: "destructive" })
      return
    }
    if (password.length < 6) {
      toast({ title: "Senha deve ter ao menos 6 caracteres", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, attribution }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Conta criada! Verifique seu e-mail para confirmar." })
        router.push(withTracking("/login"))
      } else {
        toast({ title: data.error || "Erro ao criar conta", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#1A1A2E]">Criar conta</CardTitle>
        <CardDescription>Comece gratis com {freePlan.features[0]}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Joao Silva"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#6C63FF] hover:bg-[#6C63FF]/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar conta gratis"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Ja tem conta?{" "}
          <Link href={withTracking("/login")} className="font-medium text-[#6C63FF] hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
