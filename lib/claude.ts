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

  const prompt = `Analise este influenciador e gere uma estratégia de parceria completa:

INFLUENCIADOR:
- Username: @${influencer.username}
- Nome: ${influencer.full_name || "N/A"}
- Bio: ${influencer.bio || "N/A"}
- Seguidores: ${influencer.followers_count.toLocaleString("pt-BR")}
- Taxa de engajamento: ${influencer.engagement_rate.toFixed(2)}%
- Categoria: ${influencer.category || influencer.tier}
- Tier: ${influencer.tier}

PRODUTO/SERVIÇO:
- Nome: ${search.product_name}
- Descrição: ${search.product_description}
- Link: ${search.product_link || "N/A"}
- Faixa de preço: ${search.price_range || "N/A"}
- Nicho alvo: ${search.niche}
- Tom: ${search.tone}
- Tipos de parceria: ${search.partnership_types.join(", ") || "Flexível"}
- Orçamento: ${search.budget || "A combinar"}

Retorne um JSON válido com exatamente esta estrutura:
{
  "strategy": "Análise estratégica detalhada de 2-3 parágrafos explicando por que este influenciador é adequado e como abordar a parceria",
  "outreach_subject": "Assunto do email de prospecção (máximo 60 caracteres)",
  "outreach_message": "Mensagem de email completa e personalizada em tom ${search.tone}, pronta para enviar",
  "partnership_suggestion": "Tipo específico de parceria recomendada e como estruturá-la",
  "estimated_value": "Valor estimado do post/parceria em reais com justificativa",
  "key_talking_points": ["ponto 1", "ponto 2", "ponto 3", "ponto 4", "ponto 5"]
}`

  // Best free models on OpenRouter — tries in order of preference
  const FREE_MODELS = [
    "google/gemini-2.0-flash-exp:free",       // Google Gemini 2.0 Flash (rápido e capaz)
    "deepseek/deepseek-r1:free",              // DeepSeek R1 (excelente raciocínio)
    "meta-llama/llama-4-maverick:free",       // Llama 4 Maverick
    "google/gemma-3-27b-it:free",             // Gemma 3 27B
    "microsoft/phi-4:free",                   // Phi-4
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completion = await (openrouter.chat.completions.create as any)({
    model: FREE_MODELS[0],
    max_tokens: 2000,
    models: FREE_MODELS,    // fallback automático para os próximos se o 1º falhar
    route: "fallback",
    messages: [
      {
        role: "system",
        content:
          "Você é um estrategista de marketing de influência especializado no mercado brasileiro. Sempre responda em português brasileiro. Retorne apenas JSON válido, sem markdown ou texto adicional.",
      },
      { role: "user", content: prompt },
    ],
  })

  const text = completion.choices[0]?.message?.content || ""

  try {
    return JSON.parse(text.trim()) as AIStrategy
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0]) as AIStrategy
    }
    throw new Error("Failed to parse AI response as JSON")
  }
}
