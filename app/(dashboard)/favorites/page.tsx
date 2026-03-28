import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { FavoritesClient } from "./favorites-client"

export default async function FavoritesPage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) redirect("/login")

  const favorites = await prisma.searchResult.findMany({
    where: { search: { user_id: dbUser.id }, is_favorite: true },
    include: {
      influencer: true,
      search: { select: { id: true, niche: true, product_name: true } },
    },
    orderBy: { created_at: "desc" },
  })

  const data = favorites.map((r) => ({
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
    isFavorite: true,
    aiStrategy: r.ai_strategy,
    aiSubject: r.ai_subject,
    aiOutreachMessage: r.ai_outreach_message,
    aiPartnership: r.ai_partnership,
    aiEstimatedValue: r.ai_estimated_value,
    aiTalkingPoints: r.ai_talking_points,
    searchNiche: r.search.niche,
    searchProduct: r.search.product_name,
    searchId: r.search.id,
  }))

  const searches = await prisma.search.findMany({
    where: { user_id: dbUser.id },
    select: { id: true, niche: true, product_name: true },
    orderBy: { created_at: "desc" },
  })

  return <FavoritesClient favorites={data} searches={searches} />
}
