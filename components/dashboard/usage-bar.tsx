import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PLAN_LIMITS } from "@/lib/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UsageBarProps {
  plan: "FREE" | "PRO" | "BUSINESS"
  searchesUsed: number
}

export function UsageBar({ plan, searchesUsed }: UsageBarProps) {
  const limits = PLAN_LIMITS[plan]
  const maxSearches = limits.searches === Infinity ? Infinity : limits.searches
  const percentage = maxSearches === Infinity ? 0 : Math.min((searchesUsed / maxSearches) * 100, 100)

  const planLabels = { FREE: "Gratuito", PRO: "Pro", BUSINESS: "Business" }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Uso do Plano</CardTitle>
          <span className="text-sm font-medium text-[#6C63FF]">Plano {planLabels[plan]}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buscas utilizadas</span>
            <span className="font-medium">
              {searchesUsed} / {maxSearches === Infinity ? "Ilimitado" : maxSearches}
            </span>
          </div>
          {maxSearches !== Infinity && (
            <Progress value={percentage} className="h-2" />
          )}
          {plan === "FREE" && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {maxSearches - searchesUsed > 0
                  ? `${maxSearches - searchesUsed} buscas restantes`
                  : "Limite atingido"}
              </p>
              <Link href="/settings">
                <Button size="sm" variant="outline" className="h-7 text-xs border-[#6C63FF] text-[#6C63FF]">
                  Fazer Upgrade
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
