"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase-browser"
import {
  buildTrackedClientPath,
  getClientMarketingAttribution,
  type MarketingAttribution,
} from "@/lib/marketing-attribution"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [attribution, setAttribution] = useState<MarketingAttribution>({})

  useEffect(() => {
    setAttribution(getClientMarketingAttribution())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: "As senhas nao conferem", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast({ title: error.message, variant: "destructive" })
      } else {
        toast({ title: "Senha redefinida com sucesso!" })
        router.push(buildTrackedClientPath("/login", attribution))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-[#1A1A2E]">Nova senha</CardTitle>
        <CardDescription>Digite sua nova senha</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
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
            <Label htmlFor="confirm">Confirmar</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#6C63FF] hover:bg-[#6C63FF]/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar nova senha"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
