import { redirect, notFound } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { SearchResultsClient } from "./results-client"

interface Props {
  params: { id: string }
}

export default async function SearchResultsPage({ params }: Props) {
  const user = await getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) redirect("/login")

  const search = await prisma.search.findUnique({
    where: { id: params.id, user_id: dbUser.id },
    include: {
      results: {
        include: { influencer: true },
        orderBy: { influencer: { engagement_rate: "desc" } },
      },
    },
  })

  if (!search) notFound()

  const results = search.results.map((r) => ({
    resultId: r.id,
    id: r.influencer.id,
    username: r.influencer.instagram_username,
    fullName: r.influencer.full_name,
    profilePicUrl: r.influencer.profile_pic_url,
    bio: r.influencer.bio,
    followersCount: r.influencer.followers_count,
    engagementRate: r.influencer.engagement_rate,
    tier: r.influencer.tier,
    emailFromBio: r.influencer.email_from_bio,
    hasBusinessContact: r.influencer.has_business_contact,
    externalLink: r.influencer.external_link,
    isFavorite: r.is_favorite,
    aiStrategy: r.ai_strategy,
    aiSubject: r.ai_subject,
    aiOutreachMessage: r.ai_outreach_message,
    aiPartnership: r.ai_partnership,
    aiEstimatedValue: r.ai_estimated_value,
    aiTalkingPoints: r.ai_talking_points,
  }))

  return (
    <SearchResultsClient
      search={{
        id: search.id,
        niche: search.niche,
        tier: search.tier,
        status: search.status,
        createdAt: search.created_at.toISOString(),
        productName: search.product_name,
      }}
      initialResults={results}
    />
  )
}
