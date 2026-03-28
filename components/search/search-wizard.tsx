"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { NICHES, PARTNERSHIP_TYPES, PRICE_RANGES, TONES, TIER_RANGES, PLAN_LIMITS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { X, Plus, Loader2, ChevronRight, ChevronLeft } from "lucide-react"

interface SearchWizardProps {
  plan: "FREE" | "PRO" | "BUSINESS"
  searchesUsed: number
}

export function SearchWizard({ plan, searchesUsed }: SearchWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productLink, setProductLink] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [niche, setNiche] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [tier, setTier] = useState<"MICRO" | "MID" | "MACRO">("MICRO")
  const [includeAdjacent, setIncludeAdjacent] = useState(false)
  const [tone, setTone] = useState("Profissional")
  const [partnershipTypes, setPartnershipTypes] = useState<string[]>([])
  const [budget, setBudget] = useState("")
  const [autoSendEmail, setAutoSendEmail] = useState(false)

  const limits = PLAN_LIMITS[plan]
  const canSearch = limits.searches === Infinity || searchesUsed < limits.searches

  function addKeyword() {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw) && keywords.length < 5) {
      setKeywords([...keywords, kw])
      setKeywordInput("")
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw))
  }

  function togglePartnership(type: string) {
    setPartnershipTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  async function handleSubmit() {
    if (!canSearch) {
      toast({
        title: "Limite de buscas atingido",
        description: "Faça upgrade do seu plano para continuar.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          product_name: productName,
          product_description: productDescription,
          product_link: productLink || null,
          price_range: priceRange || null,
          keywords,
          tier,
          include_adjacent: includeAdjacent,
          tone,
          partnership_types: partnershipTypes,
          budget: budget || null,
          auto_send_email: autoSendEmail,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: "Busca iniciada! Aguarde os resultados." })
        router.push(`/search/${data.id}`)
      } else {
        const err = await res.json()
        toast({ title: err.error || "Erro ao criar busca", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro de conexão", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const steps = ["Produto", "Influenciador", "Campanha"]
  const progress = (step / 3) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  i + 1 <= step
                    ? "bg-[#6C63FF] text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {i + 1}
              </div>
              <span className={cn(
                "text-sm font-medium hidden sm:block",
                i + 1 === step ? "text-[#1A1A2E]" : "text-muted-foreground"
              )}>
                {s}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Product */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Sobre seu Produto</h2>
              <p className="text-sm text-muted-foreground">Conte-nos sobre o produto que deseja promover</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="productName">Nome do Produto *</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Suplemento Proteico XYZ"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="productDescription">Descrição *</Label>
              <Textarea
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Descreva seu produto, seus benefícios e diferenciais..."
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="productLink">Link do Produto (opcional)</Label>
              <Input
                id="productLink"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="https://seusite.com/produto"
                type="url"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Faixa de Preço (opcional)</Label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a faixa de preço" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!productName || !productDescription}
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Influencer */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Perfil do Influenciador</h2>
              <p className="text-sm text-muted-foreground">Defina o tipo de influenciador que busca</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="niche">Nicho *</Label>
              <div className="relative">
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Pesquise um nicho (ex: fitness, beleza, tech...)"
                  list="niche-list"
                />
                <datalist id="niche-list">
                  {NICHES.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNiche(n)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors capitalize",
                      niche === n
                        ? "bg-[#6C63FF] text-white border-[#6C63FF]"
                        : "border-gray-200 text-gray-600 hover:border-[#6C63FF] hover:text-[#6C63FF]"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Keywords adicionais (máx. 5)</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Ex: proteina, academia"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                />
                <Button variant="outline" onClick={addKeyword} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1">
                    {kw}
                    <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tier de Influenciador *</Label>
              <RadioGroup value={tier} onValueChange={(v) => setTier(v as any)}>
                {(Object.entries(TIER_RANGES) as [keyof typeof TIER_RANGES, typeof TIER_RANGES[keyof typeof TIER_RANGES]][]).map(([key, value]) => (
                  <div
                    key={key}
                    onClick={() => setTier(key)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      tier === key
                        ? "border-[#6C63FF] bg-[#6C63FF]/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <RadioGroupItem value={key} id={key} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{value.label}</p>
                      <p className="text-xs text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="adjacent"
                checked={includeAdjacent}
                onCheckedChange={(v) => setIncludeAdjacent(!!v)}
              />
              <Label htmlFor="adjacent" className="cursor-pointer text-sm">
                Incluir tiers adjacentes (maior cobertura)
              </Label>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!niche}
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Campaign */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-1">Configurações da Campanha</h2>
              <p className="text-sm text-muted-foreground">Defina como deseja abordar os influenciadores</p>
            </div>

            <div className="space-y-1.5">
              <Label>Tom da Mensagem</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipos de Parceria</Label>
              <div className="flex flex-wrap gap-2">
                {PARTNERSHIP_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => togglePartnership(type)}
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-lg border-2 transition-colors",
                      partnershipTypes.includes(type)
                        ? "bg-[#6C63FF] text-white border-[#6C63FF]"
                        : "border-gray-200 text-gray-600 hover:border-[#6C63FF] hover:text-[#6C63FF]"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget">Orçamento (opcional)</Label>
              <Input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex: R$500-2000 por parceria"
              />
            </div>

            {plan !== "FREE" && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
                <div>
                  <p className="text-sm font-medium">Enviar e-mail automaticamente</p>
                  <p className="text-xs text-muted-foreground">Enviar e-mail para influenciadores que tiverem email</p>
                </div>
                <Switch
                  checked={autoSendEmail}
                  onCheckedChange={setAutoSendEmail}
                />
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !canSearch}
                className="bg-[#6C63FF] hover:bg-[#6C63FF]/90 min-w-[140px]"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Iniciando...</>
                ) : (
                  "Iniciar Busca"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
