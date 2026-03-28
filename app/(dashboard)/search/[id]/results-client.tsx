"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { InfluencerCard, type InfluencerCardData } from "@/components/influencer/influencer-card"
import { formatDate, getTierLabel } from "@/lib/utils"
import { Download, Plus, Search, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SearchInfo {
  id: string
  niche: string
  tier: string
  status: string
  createdAt: string
  productName: string
}

interface SearchResultsClientProps {
  search: SearchInfo
  initialResults: InfluencerCardData[]
}

const PROGRESS_STEPS = [
  "Buscando influenciadores...",
  "Analisando perfis...",
  "Gerando estratégias com IA...",
  "Finalizando...",
]

export function SearchResultsClient({ search, initialResults }: SearchResultsClientProps) {
  const { toast } = useToast()
  const [results, setResults] = useState(initialResults)
  const [status, setStatus] = useState(search.status)
  const [progressStep, setProgressStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEmail, setFilterEmail] = useState(false)
  const [filterContact, setFilterContact] = useState(false)
  const [sortBy, setSortBy] = useState("engagement")

  const isProcessing = status === "PENDING" || status === "PROCESSING"

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/searches/${search.id}/status`)
      if (!res.ok) return
      const data = await res.json()
      setStatus(data.status)
      if (data.results) setResults(data.results)
      if (data.status === "DONE" || data.status === "FAILED") return
      setProgressStep((s) => (s + 1) % PROGRESS_STEPS.length)
    } catch {}
  }, [search.id])

  useEffect(() => {
    if (!isProcessing) return
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [isProcessing, poll])

  async function handleExport() {
    try {
      const res = await fetch(`/api/searches/${search.id}/export`)
      if (!res.ok) { toast({ title: "Erro ao exportar", variant: "destructive" }); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `influencers-${search.niche}-${search.id.slice(0, 8)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: "Erro ao exportar CSV", variant: "destructive" })
    }
  }

  const filtered = results
    .filter((r) => {
      if (searchQuery && !r.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterEmail && !r.emailFromBio) return false
      if (filterContact && !r.hasBusinessContact) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === "engagement") return b.engagementRate - a.engagementRate
      if (sortBy === "followers") return b.followersCount - a.followersCount
      return a.username.localeCompare(b.username)
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">{search.productName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground capitalize">{search.niche}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{getTierLabel(search.tier)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{formatDate(search.createdAt)}</span>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={status !== "DONE"}>
            <Download className="w-4 h-4 mr-1.5" />
            Exportar CSV
          </Button>
          <Link href="/search/new">
            <Button size="sm" className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Busca
            </Button>
          </Link>
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-[#6C63FF] animate-spin" />
            <span className="font-medium text-[#1A1A2E]">{PROGRESS_STEPS[progressStep]}</span>
          </div>
          <Progress value={((progressStep + 1) / PROGRESS_STEPS.length) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Isso pode levar alguns minutos. A página atualiza automaticamente.
          </p>
        </div>
      )}

      {status === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Busca falhou</p>
            <p className="text-xs text-red-600">Ocorreu um erro ao processar sua busca. Tente novamente.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {results.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-8 h-9"
              placeholder="Buscar por @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Switch id="email-filter" checked={filterEmail} onCheckedChange={setFilterEmail} />
            <Label htmlFor="email-filter" className="text-sm cursor-pointer">Tem e-mail</Label>
          </div>

          <div className="flex items-center gap-1.5">
            <Switch id="contact-filter" checked={filterContact} onCheckedChange={setFilterContact} />
            <Label htmlFor="contact-filter" className="text-sm cursor-pointer">Conta business</Label>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engagement">Mais engajamento</SelectItem>
              <SelectItem value="followers">Mais seguidores</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} de {results.length} resultados
          </span>
        </div>
      )}

      {/* Results Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((result) => (
            <InfluencerCard key={result.resultId} data={result} />
          ))}
        </div>
      ) : status === "DONE" && results.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <p className="text-muted-foreground mb-2">Nenhum influenciador encontrado</p>
          <p className="text-sm text-muted-foreground mb-4">Tente ampliar o nicho ou mudar o tier</p>
          <Link href="/search/new">
            <Button className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">Nova Busca</Button>
          </Link>
        </div>
      ) : filtered.length === 0 && results.length > 0 ? (
        <div className="text-center py-10 border rounded-xl bg-white">
          <p className="text-sm text-muted-foreground">Nenhum resultado com os filtros aplicados</p>
          <Button variant="ghost" className="mt-2" onClick={() => { setSearchQuery(""); setFilterEmail(false); setFilterContact(false) }}>
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendente", className: "bg-gray-100 text-gray-600", icon: <Clock className="w-3 h-3" /> },
    PROCESSING: { label: "Processando", className: "bg-blue-100 text-blue-700", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    DONE: { label: "Concluído", className: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
    FAILED: { label: "Falhou", className: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
  }
  const config = map[status] || map.PENDING
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  )
}
