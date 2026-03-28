"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, getTierLabel } from "@/lib/utils"
import { Eye, Trash2, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface Search {
  id: string
  niche: string
  tier: string
  status: string
  results_count: number
  created_at: string | Date
  product_name: string
}

interface SearchHistoryProps {
  searches: Search[]
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline" | "info" }> = {
    PENDING: { label: "Pendente", variant: "secondary" },
    PROCESSING: { label: "Processando", variant: "info" },
    DONE: { label: "Concluído", variant: "success" },
    FAILED: { label: "Falhou", variant: "destructive" },
  }
  const config = configs[status] || { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "PENDING": return <Clock className="w-4 h-4 text-gray-400" />
    case "PROCESSING": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    case "DONE": return <CheckCircle className="w-4 h-4 text-green-500" />
    case "FAILED": return <XCircle className="w-4 h-4 text-red-500" />
    default: return null
  }
}

export function SearchHistory({ searches }: SearchHistoryProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/searches/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Busca excluída com sucesso" })
        router.refresh()
      } else {
        toast({ title: "Erro ao excluir", variant: "destructive" })
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Buscas Recentes</CardTitle>
          <Link href="/search/new">
            <Button size="sm" className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
              Nova Busca
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {searches.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">Nenhuma busca realizada ainda.</p>
            <Link href="/search/new">
              <Button className="mt-4 bg-[#6C63FF] hover:bg-[#6C63FF]/90">
                Fazer Primeira Busca
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Produto</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nicho</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tier</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Resultados</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {searches.map((search) => (
                  <tr key={search.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium max-w-[150px] truncate">{search.product_name}</td>
                    <td className="py-3 px-2 capitalize">{search.niche}</td>
                    <td className="py-3 px-2">{getTierLabel(search.tier)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={search.status} />
                        <StatusBadge status={search.status} />
                      </div>
                    </td>
                    <td className="py-3 px-2">{search.results_count}</td>
                    <td className="py-3 px-2 text-muted-foreground">{formatDate(search.created_at)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/search/${search.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(search.id)}
                          disabled={deleting === search.id}
                        >
                          {deleting === search.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
