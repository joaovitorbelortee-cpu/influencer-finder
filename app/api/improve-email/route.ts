import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const { subject, body, influencerName } = await req.json()
  if (!body) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: "OpenRouter nao configurado" }, { status: 500 })

  const prompt = `Você é um especialista em marketing de influência. Melhore o seguinte e-mail de proposta de parceria para o influenciador @${influencerName}.
Torne a mensagem mais persuasiva, profissional e personalizada. Mantenha o tom amigável mas profissional.
Responda APENAS em JSON com os campos "subject" e "body".

Assunto atual: ${subject}
Mensagem atual:
${body}

JSON de resposta:`

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://influencer-finder-five.vercel.app",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    })

    if (!res.ok) return NextResponse.json({ error: "Erro na API de IA" }, { status: 500 })

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ""

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: "Resposta inválida da IA" }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ subject: parsed.subject, body: parsed.body })
  } catch {
    return NextResponse.json({ error: "Erro ao processar IA" }, { status: 500 })
  }
}
