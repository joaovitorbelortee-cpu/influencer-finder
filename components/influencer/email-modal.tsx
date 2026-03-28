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
import { Loader2, Send } from "lucide-react"
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
  resultId,
  influencerName,
  recipientEmail,
  defaultSubject,
  defaultBody,
}: EmailModalProps) {
  const [subject, setSubject] = useState(defaultSubject || `Proposta de parceria - @${influencerName}`)
  const [body, setBody] = useState(defaultBody || "")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Preencha o assunto e a mensagem", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/search-results/${resultId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      })
      if (res.ok) {
        toast({ title: "E-mail enviado com sucesso!" })
        onClose()
      } else {
        const data = await res.json()
        toast({ title: data.error || "Erro ao enviar e-mail", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao enviar e-mail", variant: "destructive" })
    } finally {
      setSending(false)
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
            <Label htmlFor="body">Mensagem</Label>
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
            onClick={handleSend}
            disabled={sending}
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
