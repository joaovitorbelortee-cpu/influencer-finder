import { redirect } from "next/navigation"
import { Homepage } from "@/components/marketing/homepage"

export const dynamic = "force-dynamic"
import { getBillingPlansForDisplay } from "@/lib/billing"
import { MARKETING_FAQS } from "@/lib/marketing"
import { getUser } from "@/lib/supabase"
import { MarketingSearchParams, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, buildTrackedPath, getSiteUrl, isSupabaseConfigured } from "@/lib/site"

export const metadata = {
  title: `${SITE_NAME} | Prospeccao de creators para campanhas que vendem`,
  description: SITE_DESCRIPTION,
}

interface HomePageProps {
  searchParams?: MarketingSearchParams
}

export default async function Home({ searchParams = {} }: HomePageProps) {
  if (isSupabaseConfigured()) {
    try {
      const user = await getUser()
      if (user) redirect("/dashboard")
    } catch (error) {
      console.error("Failed to load authenticated user on homepage:", error)
    }
  }

  const siteUrl = getSiteUrl()
  const plans = getBillingPlansForDisplay()
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        slogan: SITE_TAGLINE,
        url: siteUrl,
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.label,
          priceCurrency: "BRL",
          price: Number(plan.price.replace(/[^\d]/g, "")) || 0,
          description: plan.features.join(", "),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: MARKETING_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Homepage
        signupHref={buildTrackedPath("/signup", searchParams)}
        loginHref={buildTrackedPath("/login", searchParams)}
      />
    </>
  )
}
