"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, DollarSign, Target, MessageSquare, Lightbulb } from "lucide-react"
import { useState } from "react"
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
    strategy, subject, outreachMessage, partnership, estimatedValue, talkingPoints,
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
        toast({ title: "Estratégia regenerada com sucesso!" })
      }
    } catch {
      toast({ title: "Erro ao regenerar estratégia", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#6C63FF]" />
            Estratégia para @{influencerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Strategy */}
          {localStrategy.strategy && (
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A2E] mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#6C63FF]" />
                Análise Estratégica
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">{localStrategy.strategy}</p>
            </div>
          )}

          <Separator />

          {/* Partnership & Value */}
          <div className="grid grid-cols-2 gap-4">
            {localStrategy.partnership && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Parceria Sugerida
                </h4>
                <p className="text-sm text-gray-700">{localStrategy.partnership}</p>
              </div>
            )}
            {localStrategy.estimatedValue && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Valor Estimado
                </h4>
                <p className="text-sm text-gray-700">{localStrategy.estimatedValue}</p>
              </div>
            )}
          </div>

          {/* Talking Points */}
          {localStrategy.talkingPoints && localStrategy.talkingPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Pontos-Chave
              </h4>
              <ul className="space-y-1.5">
                {localStrategy.talkingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Outreach Email */}
          {(localStrategy.subject || localStrategy.outreachMessage) && (
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A2E] mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#6C63FF]" />
                Mensagem de Prospecção
              </h4>
              {localStrategy.subject && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Assunto: </span>
                  <span className="text-sm font-medium">{localStrategy.subject}</span>
                </div>
              )}
              {localStrategy.outreachMessage && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border">
                  {localStrategy.outreachMessage}
                </div>
              )}
            </div>
          )}

          {!localStrategy.strategy && !loading && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Estratégia ainda não gerada.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleRegenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
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
