import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, Mail, Send } from "lucide-react"

interface StatsCardsProps {
  searchesCount: number
  influencersFound: number
  emailsFound: number
  emailsSent: number
}

export function StatsCards({ searchesCount, influencersFound, emailsFound, emailsSent }: StatsCardsProps) {
  const stats = [
    {
      title: "Buscas Realizadas",
      value: searchesCount,
      icon: Search,
      color: "text-[#6C63FF]",
      bg: "bg-purple-50",
    },
    {
      title: "Influenciadores Encontrados",
      value: influencersFound,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "E-mails Encontrados",
      value: emailsFound,
      icon: Mail,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "E-mails Enviados",
      value: emailsSent,
      icon: Send,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-[#1A1A2E] mt-1">{stat.value.toLocaleString("pt-BR")}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
