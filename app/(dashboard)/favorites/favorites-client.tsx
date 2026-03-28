"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfluencerCard, type InfluencerCardData } from "@/components/influencer/influencer-card"
import { Star, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FavoriteData extends InfluencerCardData {
  searchNiche: string
  searchProduct: string
  searchId: string
}

interface Search {
  id: string
  niche: string
  product_name: string
}

interface Props {
  favorites: FavoriteData[]
  searches: Search[]
}

export function FavoritesClient({ favorites, searches }: Props) {
  const { toast } = useToast()
  const [filterSearch, setFilterSearch] = useState("all")
  const [items, setItems] = useState(favorites)

  const filtered = filterSearch === "all" ? items : items.filter((f) => f.searchId === filterSearch)

  function handleUnfavorite(resultId: string) {
    setItems((prev) => prev.filter((f) => f.resultId !== resultId))
  }

  async function handleExport() {
    const rows = filtered.map((f) => [
      f.username,
      f.fullName || "",
      f.followersCount,
      f.engagementRate.toFixed(2) + "%",
      f.emailFromBio || "",
      f.tier,
      f.searchProduct,
    ])
    const header = ["Username", "Nome", "Seguidores", "Engajamento", "E-mail", "Tier", "Produto"]
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "favoritos.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "CSV exportado!" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Favoritos</h1>
          <p className="text-sm text-muted-foreground">{items.length} influenciadores salvos</p>
        </div>
        <div className="flex items-center gap-2">
          {searches.length > 0 && (
            <Select value={filterSearch} onValueChange={setFilterSearch}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por busca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as buscas</SelectItem>
                {searches.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.product_name} ({s.niche})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-1.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-white">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum favorito ainda</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Marque influenciadores com a estrela para vê-los aqui
          </p>
          <Link href="/search/new">
            <Button className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">Fazer uma busca</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((fav) => (
            <InfluencerCard
              key={fav.resultId}
              data={fav}
              onFavoriteToggle={(id, isFav) => { if (!isFav) handleUnfavorite(id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
