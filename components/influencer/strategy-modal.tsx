"use client"

import { useState } from "react"
import { Loader2, RefreshCw, DollarSign, Target, MessageSquare, Lightbulb } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface StrategyModalProps {
  open: boolean
  onClose: () => void
  resultId: string
  influencerName: string
  strategy?: string | null
  subject?: string | null
  outreachMessage?: string | null
  partnership?: string | null
  estimatedValue?: string | null
  talkingPoints?: string[]
}

export function StrategyModal({
  open,
  onClose,
  resultId,
  influencerName,
  strategy,
  subject,
  outreachMessage,
  partnership,
  estimatedValue,
  talkingPoints = [],
}: StrategyModalProps) {
  const [loading, setLoading] = useState(false)
  const [localStrategy, setLocalStrategy] = useState({
    strategy,
    subject,
    outreachMessage,
    partnership,
    estimatedValue,
    talkingPoints,
  })
  const { toast } = useToast()

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/search-results/${resultId}/strategy`, {
        method: "PATCH",
      })

      if (res.ok) {
        const data = await res.json()
        setLocalStrategy({
          strategy: data.ai_strategy,
          subject: data.ai_subject,
          outreachMessage: data.ai_outreach_message,
          partnership: data.ai_partnership,
          estimatedValue: data.ai_estimated_value,
          talkingPoints: data.ai_talking_points || [],
        })
        toast({ title: "Estrategia regenerada com sucesso!" })
      }
    } catch {
      toast({ title: "Erro ao regenerar estrategia", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#6C63FF]" />
            Estrategia para @{influencerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {localStrategy.strategy ? (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1A1A2E]">
                <Lightbulb className="h-4 w-4 text-[#6C63FF]" />
                Analise Estrategica
              </h4>
              <p className="text-sm leading-relaxed text-gray-600">{localStrategy.strategy}</p>
            </div>
          ) : null}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            {localStrategy.partnership ? (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Parceria sugerida
                </h4>
                <p className="text-sm text-gray-700">{localStrategy.partnership}</p>
              </div>
            ) : null}

            {localStrategy.estimatedValue ? (
              <div>
                <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Valor estimado
                </h4>
                <p className="text-sm text-gray-700">{localStrategy.estimatedValue}</p>
              </div>
            ) : null}
          </div>

          {localStrategy.talkingPoints && localStrategy.talkingPoints.length > 0 ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Pontos-chave
              </h4>
              <ul className="space-y-1.5">
                {localStrategy.talkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#6C63FF]/10 text-xs text-[#6C63FF]">
                      {index + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Separator />

          {localStrategy.subject || localStrategy.outreachMessage ? (
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#1A1A2E]">
                <MessageSquare className="h-4 w-4 text-[#6C63FF]" />
                Mensagem de prospeccao
              </h4>

              {localStrategy.subject ? (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Assunto: </span>
                  <span className="text-sm font-medium">{localStrategy.subject}</span>
                </div>
              ) : null}

              {localStrategy.outreachMessage ? (
                <div className="whitespace-pre-wrap rounded-lg border bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                  {localStrategy.outreachMessage}
                </div>
              ) : null}
            </div>
          ) : null}

          {!localStrategy.strategy && !loading ? (
            <div className="py-6 text-center text-muted-foreground">
              <p className="text-sm">Estrategia ainda nao gerada.</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleRegenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerar
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
