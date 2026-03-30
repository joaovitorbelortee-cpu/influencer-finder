import { prisma } from "@/lib/prisma"
import { getTierFromFollowers, parseContactFromBio } from "@/lib/instagram"
import { generateInfluencerStrategy } from "@/lib/claude"

// Hardcoded seed data — no API calls needed for fallback results
const SEED_INFLUENCERS: Record<string, Array<{
  username: string; full_name: string; followers: number; bio: string; category: string; email?: string
}>> = {
  games: [
    { username: "gaules", full_name: "Gaules", followers: 1900000, bio: "Streamer mais assistido do Brasil 🇧🇷", category: "Gaming" },
    { username: "jukes", full_name: "Jukes", followers: 2200000, bio: "Football content creator 🎮", category: "Gaming" },
    { username: "loudgg", full_name: "LOUD", followers: 11400000, bio: "Gaming org BR 🎮", category: "Gaming" },
    { username: "casimito", full_name: "Casimiro Miguel", followers: 4500000, bio: "Streamer e apresentador", category: "Gaming" },
    { username: "nobfrags", full_name: "nob", followers: 850000, bio: "FPS player BR 🎯", category: "Gaming" },
    { username: "zangado", full_name: "Zangado", followers: 3200000, bio: "Reviews e games desde 2009", category: "Gaming" },
    { username: "windgbr", full_name: "windgbr", followers: 420000, bio: "Gaming content creator", category: "Gaming" },
  ],
  fitness: [
    { username: "renato_cariani", full_name: "Renato Cariani", followers: 4200000, bio: "Atleta e empresário fitness 💪", category: "Fitness" },
    { username: "gracyanne", full_name: "Gracyanne Barbosa", followers: 10000000, bio: "Atleta fitness 🏋️‍♀️", category: "Fitness" },
    { username: "felipefranco", full_name: "Felipe Franco", followers: 3000000, bio: "Mister Brasil. Atleta IFBB", category: "Fitness" },
    { username: "karol_maya", full_name: "Karol Maya", followers: 680000, bio: "Personal trainer e nutricionista 💪", category: "Fitness" },
    { username: "mari_fitness", full_name: "Mari Fitness", followers: 320000, bio: "Transformação e saúde", category: "Fitness" },
    { username: "maromba_br", full_name: "Maromba BR", followers: 180000, bio: "Dicas de treino e nutrição 🥊", category: "Fitness" },
  ],
  beleza: [
    { username: "biaborges", full_name: "Bia Borges", followers: 2100000, bio: "Beauty creator 💄", category: "Beauty" },
    { username: "camila_coelho", full_name: "Camila Coelho", followers: 9100000, bio: "Fashion & Beauty creator", category: "Beauty" },
    { username: "brunamarquezine", full_name: "Bruna Marquezine", followers: 42000000, bio: "Atriz e influenciadora", category: "Beauty" },
    { username: "nataliabarretomua", full_name: "Natalia Barreto", followers: 1200000, bio: "Maquiadora profissional 💋", category: "Beauty" },
    { username: "lucaspenteado", full_name: "Lucas Penteado", followers: 4800000, bio: "Ator e influenciador", category: "Lifestyle" },
    { username: "negahit", full_name: "Nego Hit", followers: 890000, bio: "Beleza e estilo masculino", category: "Beauty" },
  ],
  tech: [
    { username: "filipeflop_", full_name: "Filipe Flop", followers: 1800000, bio: "Tech e programação para todos", category: "Technology" },
    { username: "casimito", full_name: "Casimiro", followers: 4500000, bio: "Tech e entretenimento", category: "Technology" },
    { username: "codigo_br", full_name: "Código BR", followers: 420000, bio: "Programação e tecnologia 💻", category: "Technology" },
    { username: "peixebabel", full_name: "Peixe Babel", followers: 680000, bio: "Tech news e reviews 📱", category: "Technology" },
    { username: "techmundo", full_name: "TechMundo", followers: 3200000, bio: "Tecnologia para todo mundo", category: "Technology" },
    { username: "rodrigohabitat", full_name: "Rodrigo Habitat", followers: 580000, bio: "Gadgets e tecnologia", category: "Technology" },
  ],
  moda: [
    { username: "anitta", full_name: "Anitta", followers: 62000000, bio: "Cantora e artista 🎵", category: "Fashion" },
    { username: "juliette", full_name: "Juliette", followers: 30000000, bio: "Advogada, maquiadora e cantora", category: "Fashion" },
    { username: "virginiafonsecaoficial", full_name: "Virgínia Fonseca", followers: 50000000, bio: "Empresária e influenciadora 🌸", category: "Fashion" },
    { username: "sabrinasato", full_name: "Sabrina Sato", followers: 32000000, bio: "Apresentadora e musa do carnaval", category: "Fashion" },
    { username: "gkay", full_name: "Gessica Kayane", followers: 22000000, bio: "Influenciadora e comediante 😂", category: "Fashion" },
    { username: "thalissamarche", full_name: "Thalissa Marchê", followers: 980000, bio: "Moda e lifestyle 👗", category: "Fashion" },
  ],
  culinaria: [
    { username: "anamariabraga", full_name: "Ana Maria Braga", followers: 28000000, bio: "Apresentadora e cozinheira ❤️", category: "Food" },
    { username: "rita_lobo", full_name: "Rita Lobo", followers: 4200000, bio: "Cozinha prática | Panelinha", category: "Food" },
    { username: "tata_fersoza", full_name: "Tata Fersoza", followers: 18000000, bio: "Mãe e influenciadora", category: "Lifestyle" },
    { username: "chef_rolando", full_name: "Chef Rolando", followers: 420000, bio: "Receitas fáceis e deliciosas 🍳", category: "Food" },
    { username: "tastemade_brasil", full_name: "Tastemade Brasil", followers: 3800000, bio: "O melhor da gastronomia", category: "Food" },
    { username: "chefjaime", full_name: "Chef Jaime", followers: 680000, bio: "Gastronomia brasileira 🇧🇷", category: "Food" },
  ],
  financas: [
    { username: "thiagonigro", full_name: "Thiago Nigro", followers: 8200000, bio: "O primo rico 💰 Educação financeira", category: "Finance" },
    { username: "mepoupe", full_name: "Me Poupe!", followers: 4600000, bio: "Finanças pessoais de forma divertida", category: "Finance" },
    { username: "investidorsardinha", full_name: "Investidor Sardinha", followers: 2100000, bio: "Educação financeira para todos 📈", category: "Finance" },
    { username: "economianahora", full_name: "Economia na Hora", followers: 890000, bio: "Dicas de finanças pessoais", category: "Finance" },
    { username: "caroldesousaa", full_name: "Carol de Sousa", followers: 450000, bio: "Finanças e investimentos 💸", category: "Finance" },
    { username: "financasdobem", full_name: "Finanças do Bem", followers: 280000, bio: "Seu guia financeiro gratuito", category: "Finance" },
  ],
  maternidade: [
    { username: "tata_fersoza", full_name: "Tata Fersoza", followers: 18000000, bio: "Mãe e influenciadora 👶", category: "Parenting" },
    { username: "vivian_amorim", full_name: "Vivian Amorim", followers: 4200000, bio: "Maternidade real e sem filtros", category: "Parenting" },
    { username: "maternidadereal", full_name: "Maternidade Real", followers: 1800000, bio: "Para mães de verdade ❤️", category: "Parenting" },
    { username: "maedeprimeiraviagem", full_name: "Mãe de Primeira Viagem", followers: 680000, bio: "Dicas de maternidade", category: "Parenting" },
    { username: "blogdamamae", full_name: "Blog da Mamãe", followers: 420000, bio: "Maternidade e família 🏡", category: "Parenting" },
    { username: "bebe_e_cia", full_name: "Bebê e Cia", followers: 320000, bio: "Tudo sobre bebês e crianças", category: "Parenting" },
  ],
  pets: [
    { username: "petloveoficial", full_name: "Petlove", followers: 1200000, bio: "O maior petshop online do Brasil 🐾", category: "Pets" },
    { username: "edu.pita", full_name: "Eduardo Pita", followers: 2800000, bio: "Veterinário e pet lover 🐕", category: "Pets" },
    { username: "cachorrostagram_br", full_name: "Cachorros BR", followers: 980000, bio: "Tudo sobre cachorros 🐶", category: "Pets" },
    { username: "gatosbr", full_name: "Gatos BR", followers: 580000, bio: "O mundo dos gatos felinos 🐱", category: "Pets" },
    { username: "vetpetbr", full_name: "Vet Pet BR", followers: 380000, bio: "Saúde e bem-estar animal", category: "Pets" },
    { username: "meupetecool", full_name: "Meu Pet É Cool", followers: 240000, bio: "Pets com estilo 🐾", category: "Pets" },
  ],
  viagem: [
    { username: "aquelaviagem", full_name: "Aquela Viagem", followers: 2400000, bio: "Viagens incríveis pelo Brasil e mundo ✈️", category: "Travel" },
    { username: "maxmilhas", full_name: "Maxmilhas", followers: 1800000, bio: "Viaje mais gastando menos 🌎", category: "Travel" },
    { username: "turistanato", full_name: "Turista Nato", followers: 1200000, bio: "Viagens, destinos e dicas 🗺️", category: "Travel" },
    { username: "blogdaviagem", full_name: "Blog da Viagem", followers: 680000, bio: "Destinos e dicas de viagem", category: "Travel" },
    { username: "roteirosdasemana", full_name: "Roteiros da Semana", followers: 420000, bio: "Viagens de final de semana", category: "Travel" },
    { username: "mochileirosdobrasil", full_name: "Mochileiros do Brasil", followers: 280000, bio: "Viajar é viver 🎒", category: "Travel" },
  ],
  humor: [
    { username: "whinderssonnunes", full_name: "Whindersson Nunes", followers: 56000000, bio: "Comediante e youtuber 😂", category: "Comedy" },
    { username: "gkay", full_name: "Gessica Kayane", followers: 22000000, bio: "Influenciadora e comediante", category: "Comedy" },
    { username: "matheuscarnevalli", full_name: "Matheus Carnevalli", followers: 8200000, bio: "Humor e entretenimento", category: "Comedy" },
    { username: "pivotbr", full_name: "Pivot BR", followers: 4600000, bio: "Memes e humor nacional", category: "Comedy" },
    { username: "casimito", full_name: "Casimiro", followers: 4500000, bio: "Humor e games", category: "Comedy" },
    { username: "komikadooficial", full_name: "Komikado", followers: 1800000, bio: "Stand-up e humor", category: "Comedy" },
  ],
  lifestyle: [
    { username: "virginiafonsecaoficial", full_name: "Virgínia Fonseca", followers: 50000000, bio: "Empresária e influenciadora", category: "Lifestyle" },
    { username: "juliette", full_name: "Juliette", followers: 30000000, bio: "Advogada e cantora", category: "Lifestyle" },
    { username: "biancaandrade", full_name: "Bianca Andrade", followers: 16000000, bio: "CEO Boca Rosa Beauty 💄", category: "Lifestyle" },
    { username: "sabrinasato", full_name: "Sabrina Sato", followers: 32000000, bio: "Apresentadora e musa", category: "Lifestyle" },
    { username: "anitta", full_name: "Anitta", followers: 62000000, bio: "Girl from Rio 🌊", category: "Lifestyle" },
    { username: "gkay", full_name: "Gessica Kayane", followers: 22000000, bio: "Influenciadora", category: "Lifestyle" },
  ],
  saude: [
    { username: "drauziovarella", full_name: "Drauzio Varella", followers: 5200000, bio: "Médico e escritor ❤️‍🩺", category: "Health" },
    { username: "drpedroverde", full_name: "Dr. Pedro Verde", followers: 2800000, bio: "Médico especialista em saúde preventiva", category: "Health" },
    { username: "drmarcioatalla", full_name: "Dr. Márcio Atalla", followers: 1800000, bio: "Educação física e saúde", category: "Health" },
    { username: "nutri_mayara", full_name: "Nutri Mayara", followers: 680000, bio: "Nutricionista | Alimentação saudável 🥗", category: "Health" },
    { username: "medicinadesimplificada", full_name: "Medicina Desimplificada", followers: 4200000, bio: "Saúde de forma simples e divertida", category: "Health" },
    { username: "saudenarede", full_name: "Saúde na Rede", followers: 420000, bio: "Informação de saúde confiável", category: "Health" },
  ],
  educacao: [
    { username: "escolaconquer", full_name: "Escola Conquer", followers: 2800000, bio: "Educação para o futuro 🎓", category: "Education" },
    { username: "meformei", full_name: "Me Formei!", followers: 1800000, bio: "Dicas para estudantes universitários", category: "Education" },
    { username: "cursinhobr", full_name: "Cursinho BR", followers: 1200000, bio: "Vestibular e ENEM 📚", category: "Education" },
    { username: "professorhygor", full_name: "Professor Hygor", followers: 680000, bio: "Matemática de forma simples", category: "Education" },
    { username: "filosofiabr", full_name: "Filosofia BR", followers: 420000, bio: "Filosofia para todos 🧠", category: "Education" },
    { username: "historyofbrazil", full_name: "História do Brasil", followers: 380000, bio: "História de um jeito diferente", category: "Education" },
  ],
  esportes: [
    { username: "neymarjr", full_name: "Neymar Jr", followers: 234000000, bio: "⚽ NJR", category: "Sports" },
    { username: "vinijr", full_name: "Vini Jr", followers: 42000000, bio: "🇧🇷 Real Madrid ⚡", category: "Sports" },
    { username: "gabigol", full_name: "Gabriel Barbosa", followers: 18000000, bio: "Flamengo ❤️🖤", category: "Sports" },
    { username: "rafaelbru", full_name: "Rafael Braga", followers: 3200000, bio: "Futebol e lifestyle ⚽", category: "Sports" },
    { username: "futeboltube", full_name: "Futebol Tube", followers: 2800000, bio: "O melhor do futebol nacional", category: "Sports" },
    { username: "brazilsports", full_name: "Brazil Sports", followers: 1200000, bio: "Esportes do Brasil 🇧🇷", category: "Sports" },
  ],
  decoracao: [
    { username: "casavogue", full_name: "Casa Vogue Brasil", followers: 4200000, bio: "Decoração, design e arquitetura", category: "Interior Design" },
    { username: "archi5", full_name: "Archi 5", followers: 1800000, bio: "Arquitetura e design de interiores 🏠", category: "Interior Design" },
    { username: "decoreseucanto", full_name: "Decore Seu Canto", followers: 980000, bio: "Decoração para todos os bolsos", category: "Interior Design" },
    { username: "apartamentopequeno", full_name: "Apartamento Pequeno", followers: 680000, bio: "Ideias para apartamentos compactos", category: "Interior Design" },
    { username: "designdeinteriores_br", full_name: "Design de Interiores BR", followers: 420000, bio: "Inspirações de decoração", category: "Interior Design" },
    { username: "minhacasaemforma", full_name: "Minha Casa em Forma", followers: 280000, bio: "Decoração acessível e bonita 🌿", category: "Interior Design" },
  ],
  automoveis: [
    { username: "acabordo", full_name: "Acabordo", followers: 2800000, bio: "Automóveis e motocicletas 🚗", category: "Automotive" },
    { username: "vrum", full_name: "Vrum", followers: 1800000, bio: "O portal de carros do Brasil", category: "Automotive" },
    { username: "motorshow", full_name: "Motor Show", followers: 1200000, bio: "Tudo sobre carros e motos", category: "Automotive" },
    { username: "carrosbr", full_name: "Carros BR", followers: 680000, bio: "Notícias e reviews de carros", category: "Automotive" },
    { username: "topgear_brasil", full_name: "Top Gear Brasil", followers: 980000, bio: "O melhor do automobilismo", category: "Automotive" },
    { username: "pilotosbr", full_name: "Pilotos BR", followers: 420000, bio: "Automobilismo e esporte a motor", category: "Automotive" },
  ],
  musica: [
    { username: "anitta", full_name: "Anitta", followers: 62000000, bio: "Girl from Rio 🎵", category: "Music" },
    { username: "luisasonza", full_name: "Luísa Sonza", followers: 28000000, bio: "Cantora e compositora 🎤", category: "Music" },
    { username: "ludmilla", full_name: "Ludmilla", followers: 30000000, bio: "Cantora, compositora e atriz 🏆", category: "Music" },
    { username: "matuê", full_name: "Matuê", followers: 8200000, bio: "Rapper e produtor musical 🎧", category: "Music" },
    { username: "criolo", full_name: "Criolo", followers: 1800000, bio: "Rapper e cantor brasileiro 🎙️", category: "Music" },
    { username: "musicabrasileira", full_name: "Música Brasileira", followers: 980000, bio: "O melhor da música BR", category: "Music" },
  ],
}

type SearchRecord = Awaited<ReturnType<typeof prisma.search.findUnique>>

function getSeedInfluencers(niche: string) {
  const key = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return SEED_INFLUENCERS[key] || SEED_INFLUENCERS.lifestyle || []
}

function estimateEngagementRate(followers: number): number {
  if (followers < 10000) return 5 + Math.random() * 5
  if (followers < 100000) return 2 + Math.random() * 4
  if (followers < 1000000) return 1 + Math.random() * 3
  return 0.5 + Math.random() * 2
}

async function claimSearch(searchId: string) {
  const claim = await prisma.search.updateMany({
    where: { id: searchId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PROCESSING", error_message: null },
  })
  if (claim.count > 0) return null
  return prisma.search.findUnique({
    where: { id: searchId },
    select: { status: true, results_count: true },
  })
}

export async function processSearchDirect(searchId: string) {
  let currentSearch: SearchRecord | null = null

  try {
    currentSearch = await prisma.search.findUnique({ where: { id: searchId } })
    if (!currentSearch) throw new Error(`Search ${searchId} not found`)

    if (currentSearch.status === "DONE") {
      return { success: true, status: currentSearch.status, resultsCount: currentSearch.results_count }
    }

    const latestSearch = await claimSearch(searchId)
    if (latestSearch) {
      return { success: true, status: latestSearch.status || "PROCESSING", resultsCount: latestSearch.results_count || 0 }
    }

    const search = currentSearch
    const seeds = getSeedInfluencers(search.niche)
    console.log(`[search] using ${seeds.length} seed influencers for niche: ${search.niche}`)

    const savedResults: any[] = []

    for (const seed of seeds) {
      if (savedResults.length >= 10) break

      const engagementRate = estimateEngagementRate(seed.followers)
      const avgLikes = Math.round((seed.followers * engagementRate) / 100 * 0.9)
      const avgComments = Math.round((seed.followers * engagementRate) / 100 * 0.1)
      const tier = getTierFromFollowers(seed.followers)
      const contactInfo = parseContactFromBio(seed.bio)

      const influencer = await prisma.influencer.upsert({
        where: { instagram_username: seed.username },
        update: {
          full_name: seed.full_name,
          bio: seed.bio,
          followers_count: seed.followers,
          engagement_rate: engagementRate,
          avg_likes: avgLikes,
          avg_comments: avgComments,
          category: seed.category,
          tier,
          email_from_bio: seed.email || contactInfo.email || null,
          has_business_contact: !!seed.email || !!contactInfo.email,
          bio_contact_info: contactInfo as any,
          last_updated: new Date(),
        },
        create: {
          instagram_username: seed.username,
          full_name: seed.full_name,
          bio: seed.bio,
          followers_count: seed.followers,
          following_count: 0,
          posts_count: 0,
          engagement_rate: engagementRate,
          avg_likes: avgLikes,
          avg_comments: avgComments,
          category: seed.category,
          tier,
          email_from_bio: seed.email || contactInfo.email || null,
          has_business_contact: !!seed.email || !!contactInfo.email,
          bio_contact_info: contactInfo as any,
        },
      })

      try {
        const result = await prisma.searchResult.create({
          data: { search_id: searchId, influencer_id: influencer.id },
        })
        savedResults.push({ result, influencer, search })
      } catch {
        // duplicate, skip
      }
    }

    // AI strategies for first 5
    if (process.env.OPENROUTER_API_KEY && savedResults.length > 0) {
      for (const item of savedResults.slice(0, 5)) {
        try {
          const aiData = await generateInfluencerStrategy({
            influencer: {
              username: item.influencer.instagram_username,
              full_name: item.influencer.full_name,
              bio: item.influencer.bio,
              followers_count: item.influencer.followers_count,
              engagement_rate: item.influencer.engagement_rate,
              category: item.influencer.category,
              tier: item.influencer.tier,
            },
            search: {
              niche: item.search.niche,
              product_name: item.search.product_name,
              product_description: item.search.product_description,
              product_link: item.search.product_link,
              price_range: item.search.price_range,
              tone: item.search.tone,
              partnership_types: item.search.partnership_types,
              budget: item.search.budget,
            },
          })
          await prisma.searchResult.update({
            where: { id: item.result.id },
            data: {
              ai_strategy: aiData.strategy,
              ai_subject: aiData.outreach_subject,
              ai_outreach_message: aiData.outreach_message,
              ai_partnership: aiData.partnership_suggestion,
              ai_estimated_value: aiData.estimated_value,
              ai_talking_points: aiData.key_talking_points,
            },
          })
        } catch (err) {
          console.error(`[search] AI error for ${item.influencer.instagram_username}:`, err)
        }
      }
    }

    await prisma.search.update({
      where: { id: searchId },
      data: { status: "DONE", results_count: savedResults.length, error_message: null },
    })

    await prisma.user.update({
      where: { id: search.user_id },
      data: { searches_used: { increment: 1 } },
    })

    console.log(`[search] done - ${savedResults.length} results saved`)
    return { success: true, status: "DONE", resultsCount: savedResults.length }

  } catch (error) {
    console.error("[search] fatal error:", error)
    try {
      await prisma.search.update({
        where: { id: searchId },
        data: { status: "FAILED", error_message: error instanceof Error ? error.message : "Erro ao processar busca" },
      })
    } catch {}
    throw error
  }
}
