"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Send, Sparkles, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface EmailModalProps {
  open: boolean
  onClose: () => void
  resultId: string
  influencerName: string
  recipientEmail: string
  defaultSubject?: string | null
  defaultBody?: string | null
}

export function EmailModal({
  open,
  onClose,
  resultId: _resultId,
  influencerName,
  recipientEmail,
  defaultSubject,
  defaultBody,
}: EmailModalProps) {
  const [subject, setSubject] = useState(defaultSubject || `Proposta de parceria - @${influencerName}`)
  const [body, setBody] = useState(defaultBody || "")
  const [improving, setImproving] = useState(false)
  const { toast } = useToast()

  function handleOpenMailto() {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Preencha o assunto e a mensagem", variant: "destructive" })
      return
    }
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, "_blank")
    onClose()
  }

  async function handleImproveWithAI() {
    if (!body.trim()) {
      toast({ title: "Escreva uma mensagem antes de melhorar com IA", variant: "destructive" })
      return
    }
    setImproving(true)
    try {
      const res = await fetch("/api/improve-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, influencerName }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.subject) setSubject(data.subject)
        if (data.body) setBody(data.body)
        toast({ title: "Mensagem melhorada com IA!" })
      } else {
        toast({ title: "Erro ao melhorar com IA", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao melhorar com IA", variant: "destructive" })
    } finally {
      setImproving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#6C63FF]" />
            Enviar E-mail para @{influencerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Para</Label>
            <p className="text-sm font-medium mt-1">{recipientEmail}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Mensagem</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImproveWithAI}
                disabled={improving}
                className="h-7 text-xs text-[#6C63FF] hover:text-[#6C63FF] hover:bg-[#6C63FF]/10"
              >
                {improving ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Melhorar com IA
              </Button>
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={12}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleOpenMailto}
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir no E-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
