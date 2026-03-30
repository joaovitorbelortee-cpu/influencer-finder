import OpenAI from "openai"

function getOpenRouter() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Influencer Finder",
    },
  })
}

export interface AIStrategy {
  strategy: string
  outreach_subject: string
  outreach_message: string
  partnership_suggestion: string
  estimated_value: string
  key_talking_points: string[]
}

interface GenerateStrategyParams {
  influencer: {
    username: string
    full_name?: string | null
    bio?: string | null
    followers_count: number
    engagement_rate: number
    category?: string | null
    tier: string
  }
  search: {
    niche: string
    product_name: string
    product_description: string
    product_link?: string | null
    price_range?: string | null
    tone: string
    partnership_types: string[]
    budget?: string | null
  }
}

export async function generateInfluencerStrategy(
  params: GenerateStrategyParams
): Promise<AIStrategy> {
  const { influencer, search } = params
  const openrouter = getOpenRouter()

  const prompt = `Analise este influenciador e gere uma estrategia de parceria completa:

INFLUENCIADOR:
- Username: @${influencer.username}
- Nome: ${influencer.full_name || "N/A"}
- Bio: ${influencer.bio || "N/A"}
- Seguidores: ${influencer.followers_count.toLocaleString("pt-BR")}
- Taxa de engajamento: ${influencer.engagement_rate.toFixed(2)}%
- Categoria: ${influencer.category || influencer.tier}
- Tier: ${influencer.tier}

PRODUTO/SERVICO:
- Nome: ${search.product_name}
- Descricao: ${search.product_description}
- Link: ${search.product_link || "N/A"}
- Faixa de preco: ${search.price_range || "N/A"}
- Nicho alvo: ${search.niche}
- Tom: ${search.tone}
- Tipos de parceria: ${search.partnership_types.join(", ") || "Flexivel"}
- Orcamento: ${search.budget || "A combinar"}

Retorne um JSON valido com exatamente esta estrutura:
{
  "strategy": "Analise estrategica detalhada de 2-3 paragrafos explicando por que este influenciador e adequado e como abordar a parceria",
  "outreach_subject": "Assunto do email de prospeccao (maximo 60 caracteres)",
  "outreach_message": "Mensagem de email completa e personalizada em tom ${search.tone}, pronta para enviar",
  "partnership_suggestion": "Tipo especifico de parceria recomendada e como estrutura-la",
  "estimated_value": "Valor estimado do post/parceria em reais com justificativa",
  "key_talking_points": ["ponto 1", "ponto 2", "ponto 3", "ponto 4", "ponto 5"]
}`

  const completion = await openrouter.chat.completions.create({
    model: "openrouter/free",
    max_tokens: 2000,
    messages: [
      {
        role: "system",
        content:
          "Voce e um estrategista de marketing de influencia especializado no mercado brasileiro. Sempre responda em portugues brasileiro. Retorne apenas JSON valido, sem markdown ou texto adicional.",
      },
      { role: "user", content: prompt },
    ],
  })

  const msg = completion.choices[0]?.message
  const text = msg?.content || (msg as any)?.reasoning || ""

  if (!text) throw new Error("Empty response from AI")

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON found in AI response")
  return JSON.parse(match[0]) as AIStrategy
}
