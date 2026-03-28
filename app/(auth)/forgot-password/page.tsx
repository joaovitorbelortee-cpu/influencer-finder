"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { AuthConfigNotice } from "@/components/auth/auth-config-notice"
import { createClient } from "@/lib/supabase-browser"
import {
  buildTrackedClientPath,
  getClientMarketingAttribution,
  type MarketingAttribution,
} from "@/lib/marketing-attribution"
import { isSupabaseConfigured } from "@/lib/site"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [attribution, setAttribution] = useState<MarketingAttribution>({})

  useEffect(() => {
    setAttribution(getClientMarketingAttribution())
  }, [])

  const withTracking = (pathname: string) => buildTrackedClientPath(pathname, attribution)
  const authAvailable = isSupabaseConfigured()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authAvailable) {
      toast({
        title: "Reset indisponivel nesta preview",
        description: "Configure o Supabase no deploy para liberar a recuperacao de senha.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${withTracking("/reset-password")}`,
      })
      if (error) {
        toast({ title: error.message, variant: "destructive" })
      } else {
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold">E-mail enviado!</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Verifique sua caixa de entrada para o link de redefinicao.
          </p>
          <Link href={withTracking("/login")}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#1A1A2E]">Esqueci minha senha</CardTitle>
        <CardDescription>Enviaremos um link para redefinir sua senha</CardDescription>
      </CardHeader>
      <CardContent>
        {!authAvailable ? <AuthConfigNotice /> : null}
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full bg-[#6C63FF] hover:bg-[#6C63FF]/90" disabled={loading || !authAvailable}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar link de reset"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center">
          <Link
            href={withTracking("/login")}
            className="flex items-center justify-center gap-1 text-sm text-[#6C63FF] hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
