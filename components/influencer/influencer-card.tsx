"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StrategyModal } from "./strategy-modal"
import { EmailModal } from "./email-modal"
import {
  Star, Mail, Link as LinkIcon, MessageSquare, Copy, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react"
import { formatFollowers, getEngagementLabel, getTierLabel, cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export interface InfluencerCardData {
  resultId: string
  id: string
  username: string
  fullName?: string | null
  profilePicUrl?: string | null
  bio?: string | null
  followersCount: number
  engagementRate: number
  tier: string
  emailFromBio?: string | null
  hasBusinessContact: boolean
  externalLink?: string | null
  isFavorite: boolean
  aiStrategy?: string | null
  aiSubject?: string | null
  aiOutreachMessage?: string | null
  aiPartnership?: string | null
  aiEstimatedValue?: string | null
  aiTalkingPoints?: string[]
}

interface InfluencerCardProps {
  data: InfluencerCardData
  onFavoriteToggle?: (resultId: string, isFavorite: boolean) => void
}

export function InfluencerCard({ data, onFavoriteToggle }: InfluencerCardProps) {
  const [showFullBio, setShowFullBio] = useState(false)
  const [showStrategy, setShowStrategy] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [isFavorite, setIsFavorite] = useState(data.isFavorite)
  const { toast } = useToast()

  const engagementInfo = getEngagementLabel(data.engagementRate)

  const engagementColorMap: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  }

  async function handleFavorite() {
    const newValue = !isFavorite
    setIsFavorite(newValue)
    try {
      await fetch(`/api/search-results/${data.resultId}/favorite`, { method: "PATCH" })
      onFavoriteToggle?.(data.resultId, newValue)
    } catch {
      setIsFavorite(!newValue)
    }
  }

  async function handleCopyDM() {
    const dm = data.aiOutreachMessage || `Olá @${data.username}! Adorei seu conteúdo e gostaria de conversar sobre uma parceria. Pode me mandar um DM?`
    await navigator.clipboard.writeText(dm)
    toast({ title: "Mensagem copiada!" })
  }

  const bioText = data.bio || ""
  const truncatedBio = bioText.length > 120 ? bioText.slice(0, 120) + "..." : bioText

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={data.profilePicUrl || ""} alt={data.username} />
              <AvatarFallback className="bg-[#6C63FF] text-white text-sm">
                {data.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <a
                  href={`https://instagram.com/${data.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm text-[#1A1A2E] hover:text-[#6C63FF] flex items-center gap-1"
                >
                  @{data.username}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
                <button onClick={handleFavorite} className="flex-shrink-0">
                  <Star
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                    )}
                  />
                </button>
              </div>
              {data.fullName && (
                <p className="text-xs text-muted-foreground">{data.fullName}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {getTierLabel(data.tier)}
            </Badge>
            <span className="text-xs font-semibold text-[#1A1A2E]">
              {formatFollowers(data.followersCount)} seguidores
            </span>
            <Badge
              className={cn(
                "text-xs ml-auto",
                engagementColorMap[engagementInfo.color]
              )}
            >
              {data.engagementRate.toFixed(1)}% {engagementInfo.label}
            </Badge>
          </div>

          {/* Bio */}
          {bioText && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                {showFullBio ? bioText : truncatedBio}
              </p>
              {bioText.length > 120 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-xs text-[#6C63FF] mt-1 flex items-center gap-0.5"
                >
                  {showFullBio ? (
                    <><ChevronUp className="w-3 h-3" /> Menos</>
                  ) : (
                    <><ChevronDown className="w-3 h-3" /> Mais</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Contact Icons */}
          <div className="flex items-center gap-1 mb-3">
            {data.emailFromBio && (
              <span title={data.emailFromBio}>
                <Mail className="w-4 h-4 text-green-500" />
              </span>
            )}
            {data.externalLink && (
              <a href={data.externalLink} target="_blank" rel="noopener noreferrer">
                <LinkIcon className="w-4 h-4 text-blue-500" />
              </a>
            )}
            {data.hasBusinessContact && (
              <span title="Conta business">
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 flex-1 border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white"
              onClick={() => setShowStrategy(true)}
            >
              Ver Estratégia
            </Button>
            {data.emailFromBio && (
              <Button
                size="sm"
                className="text-xs h-7 flex-1 bg-[#6C63FF] hover:bg-[#6C63FF]/90"
                onClick={() => setShowEmail(true)}
              >
                <Mail className="w-3 h-3 mr-1" />
                E-mail
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2"
              onClick={handleCopyDM}
              title="Copiar DM"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <StrategyModal
        open={showStrategy}
        onClose={() => setShowStrategy(false)}
        resultId={data.resultId}
        influencerName={data.username}
        strategy={data.aiStrategy}
        subject={data.aiSubject}
        outreachMessage={data.aiOutreachMessage}
        partnership={data.aiPartnership}
        estimatedValue={data.aiEstimatedValue}
        talkingPoints={data.aiTalkingPoints}
      />

      {data.emailFromBio && (
        <EmailModal
          open={showEmail}
          onClose={() => setShowEmail(false)}
          resultId={data.resultId}
          influencerName={data.username}
          recipientEmail={data.emailFromBio}
          defaultSubject={data.aiSubject}
          defaultBody={data.aiOutreachMessage}
        />
      )}
    </>
  )
}
