import { prisma } from "@/lib/prisma"
import { getTierFromFollowers, parseContactFromBio } from "@/lib/instagram"
import { generateInfluencerStrategy } from "@/lib/claude"

type SeedInfluencer = {
  username: string; full_name: string; followers: number; bio: string; category: string; email?: string
}

// Seed data organized by niche, with influencers across all tiers (MICRO ≤50K, MID 50K-500K, MACRO >500K)
const SEED_INFLUENCERS: Record<string, SeedInfluencer[]> = {
  games: [
    { username: "loudgg", full_name: "LOUD", followers: 11400000, bio: "Gaming org BR 🎮", category: "Gaming" },
    { username: "gaules", full_name: "Gaules", followers: 1900000, bio: "Streamer mais assistido do Brasil 🇧🇷", category: "Gaming" },
    { username: "casimito", full_name: "Casimiro Miguel", followers: 4500000, bio: "Streamer e apresentador", category: "Gaming" },
    { username: "zangado", full_name: "Zangado", followers: 3200000, bio: "Reviews e games desde 2009", category: "Gaming" },
    { username: "nobfrags", full_name: "nob", followers: 850000, bio: "FPS player BR 🎯", category: "Gaming" },
    { username: "windgbr", full_name: "windgbr", followers: 420000, bio: "Gaming content creator", category: "Gaming" },
    { username: "bfragger", full_name: "BFragger", followers: 180000, bio: "Gameplay e dicas de FPS 🎮", category: "Gaming" },
    { username: "gameplaybr_", full_name: "Gameplay BR", followers: 95000, bio: "Gameplays e reviews indie", category: "Gaming" },
    { username: "joystickgirl", full_name: "Joystick Girl", followers: 42000, bio: "Gamer girl brasileira 🕹️", category: "Gaming", email: "contato@joystickgirl.com" },
    { username: "indiegamerbr", full_name: "Indie Gamer BR", followers: 28000, bio: "Jogos indie e análises 🎲", category: "Gaming", email: "indie@gamerbr.com" },
    { username: "retrogamebrasil", full_name: "Retro Game Brasil", followers: 18000, bio: "Nostalgia e retrogaming 🕹️", category: "Gaming" },
    { username: "gamerdicas_", full_name: "Gamer Dicas", followers: 12000, bio: "Dicas e tutoriais de games", category: "Gaming", email: "gamerdicas@gmail.com" },
    { username: "streamerbr_mic", full_name: "Streamer BR", followers: 8500, bio: "Lives diárias e interação", category: "Gaming" },
  ],
  fitness: [
    { username: "gracyanne", full_name: "Gracyanne Barbosa", followers: 10000000, bio: "Atleta fitness 🏋️‍♀️", category: "Fitness" },
    { username: "renato_cariani", full_name: "Renato Cariani", followers: 4200000, bio: "Atleta e empresário fitness 💪", category: "Fitness" },
    { username: "felipefranco", full_name: "Felipe Franco", followers: 3000000, bio: "Mister Brasil. Atleta IFBB", category: "Fitness" },
    { username: "karol_maya", full_name: "Karol Maya", followers: 680000, bio: "Personal trainer e nutricionista 💪", category: "Fitness" },
    { username: "mari_fitness", full_name: "Mari Fitness", followers: 320000, bio: "Transformação e saúde", category: "Fitness" },
    { username: "maromba_br", full_name: "Maromba BR", followers: 180000, bio: "Dicas de treino e nutrição 🥊", category: "Fitness" },
    { username: "fitcoachana", full_name: "Fit Coach Ana", followers: 75000, bio: "Personal online 💪 Treinos para mulheres", category: "Fitness", email: "ana@fitcoach.com.br" },
    { username: "treinogaragem_", full_name: "Treino Garagem", followers: 45000, bio: "Treino em casa sem equipamento", category: "Fitness", email: "treinogaragem@gmail.com" },
    { username: "corrida.urbana", full_name: "Corrida Urbana", followers: 32000, bio: "Corrida de rua e maratona 🏃", category: "Fitness" },
    { username: "yogabrasil_", full_name: "Yoga Brasil", followers: 22000, bio: "Yoga e meditação para todos 🧘", category: "Fitness", email: "contato@yogabrasil.com" },
    { username: "crossfitbr_mic", full_name: "CrossFit BR", followers: 15000, bio: "WODs e dicas de CrossFit 🔥", category: "Fitness" },
    { username: "nutri.fit.dicas", full_name: "Nutri Fit Dicas", followers: 9000, bio: "Nutrição esportiva simplificada", category: "Fitness", email: "nutrifitdicas@gmail.com" },
  ],
  beleza: [
    { username: "camila_coelho", full_name: "Camila Coelho", followers: 9100000, bio: "Fashion & Beauty creator", category: "Beauty" },
    { username: "biaborges", full_name: "Bia Borges", followers: 2100000, bio: "Beauty creator 💄", category: "Beauty" },
    { username: "nataliabarretomua", full_name: "Natalia Barreto", followers: 1200000, bio: "Maquiadora profissional 💋", category: "Beauty" },
    { username: "negahit", full_name: "Nego Hit", followers: 890000, bio: "Beleza e estilo masculino", category: "Beauty" },
    { username: "makeupbr_pro", full_name: "Makeup BR Pro", followers: 350000, bio: "Tutoriais de maquiagem profissional", category: "Beauty" },
    { username: "skincarebrasil_", full_name: "Skincare Brasil", followers: 120000, bio: "Rotina de skincare e reviews 🧴", category: "Beauty" },
    { username: "beautymica", full_name: "Beauty Mica", followers: 48000, bio: "Makes acessíveis e dicas de beleza 💄", category: "Beauty", email: "beautymica@gmail.com" },
    { username: "cabelosbr_", full_name: "Cabelos BR", followers: 35000, bio: "Tratamentos capilares e dicas", category: "Beauty", email: "cabelosbr@outlook.com" },
    { username: "unhasdecoradas_", full_name: "Unhas Decoradas", followers: 25000, bio: "Nail art e tendências 💅", category: "Beauty" },
    { username: "belezanatural_br", full_name: "Beleza Natural BR", followers: 18000, bio: "Beleza sem filtro e autocuidado 🌸", category: "Beauty", email: "contato@belezanatural.com" },
    { username: "perfumariabr", full_name: "Perfumaria BR", followers: 11000, bio: "Reviews de perfumes importados e nacionais", category: "Beauty" },
  ],
  tech: [
    { username: "techmundo", full_name: "TechMundo", followers: 3200000, bio: "Tecnologia para todo mundo", category: "Technology" },
    { username: "filipeflop_", full_name: "Filipe Flop", followers: 1800000, bio: "Tech e programação para todos", category: "Technology" },
    { username: "peixebabel", full_name: "Peixe Babel", followers: 680000, bio: "Tech news e reviews 📱", category: "Technology" },
    { username: "rodrigohabitat", full_name: "Rodrigo Habitat", followers: 580000, bio: "Gadgets e tecnologia", category: "Technology" },
    { username: "codigo_br", full_name: "Código BR", followers: 420000, bio: "Programação e tecnologia 💻", category: "Technology" },
    { username: "setupbrazil", full_name: "Setup Brazil", followers: 150000, bio: "Setups, periféricos e PC gamer", category: "Technology" },
    { username: "devbr_tips", full_name: "Dev BR Tips", followers: 48000, bio: "Dicas de programação para iniciantes 💻", category: "Technology", email: "devbrtips@gmail.com" },
    { username: "gadgetreview_br", full_name: "Gadget Review BR", followers: 35000, bio: "Unboxing e reviews de gadgets", category: "Technology", email: "gadgetreviewbr@gmail.com" },
    { username: "iabrasil_", full_name: "IA Brasil", followers: 22000, bio: "Inteligência artificial e novidades tech 🤖", category: "Technology" },
    { username: "linuxbr_", full_name: "Linux BR", followers: 15000, bio: "Linux, open source e DevOps 🐧", category: "Technology", email: "contato@linuxbr.dev" },
    { username: "appreviewbr", full_name: "App Review BR", followers: 8000, bio: "Reviews de apps e produtividade 📱", category: "Technology" },
  ],
  moda: [
    { username: "virginiafonsecaoficial", full_name: "Virgínia Fonseca", followers: 50000000, bio: "Empresária e influenciadora 🌸", category: "Fashion" },
    { username: "juliette", full_name: "Juliette", followers: 30000000, bio: "Advogada, maquiadora e cantora", category: "Fashion" },
    { username: "sabrinasato", full_name: "Sabrina Sato", followers: 32000000, bio: "Apresentadora e musa do carnaval", category: "Fashion" },
    { username: "gkay", full_name: "Gessica Kayane", followers: 22000000, bio: "Influenciadora e comediante 😂", category: "Fashion" },
    { username: "thalissamarche", full_name: "Thalissa Marchê", followers: 980000, bio: "Moda e lifestyle 👗", category: "Fashion" },
    { username: "estilobr_", full_name: "Estilo BR", followers: 280000, bio: "Tendências de moda brasileira", category: "Fashion" },
    { username: "modaacessivel_", full_name: "Moda Acessível", followers: 45000, bio: "Looks baratos e estilosos 👗", category: "Fashion", email: "modaacessivel@gmail.com" },
    { username: "brechobr_", full_name: "Brechó BR", followers: 38000, bio: "Moda sustentável e brechó online 🌿", category: "Fashion", email: "brechobr@outlook.com" },
    { username: "lookdodia_br", full_name: "Look do Dia BR", followers: 25000, bio: "Inspirações de looks diários", category: "Fashion" },
    { username: "modamasculinabr_", full_name: "Moda Masculina BR", followers: 18000, bio: "Estilo masculino sem complicação 👔", category: "Fashion", email: "modamasculina@gmail.com" },
    { username: "fashionkids_br", full_name: "Fashion Kids BR", followers: 12000, bio: "Moda infantil e kids fashion 🧸", category: "Fashion" },
  ],
  culinaria: [
    { username: "anamariabraga", full_name: "Ana Maria Braga", followers: 28000000, bio: "Apresentadora e cozinheira ❤️", category: "Food" },
    { username: "rita_lobo", full_name: "Rita Lobo", followers: 4200000, bio: "Cozinha prática | Panelinha", category: "Food" },
    { username: "tastemade_brasil", full_name: "Tastemade Brasil", followers: 3800000, bio: "O melhor da gastronomia", category: "Food" },
    { username: "chefjaime", full_name: "Chef Jaime", followers: 680000, bio: "Gastronomia brasileira 🇧🇷", category: "Food" },
    { username: "chef_rolando", full_name: "Chef Rolando", followers: 420000, bio: "Receitas fáceis e deliciosas 🍳", category: "Food" },
    { username: "receitafit_", full_name: "Receita Fit", followers: 150000, bio: "Receitas saudáveis e rápidas 🥗", category: "Food" },
    { username: "confeitariabr_", full_name: "Confeitaria BR", followers: 48000, bio: "Bolos decorados e doces artesanais 🎂", category: "Food", email: "confeitariabr@gmail.com" },
    { username: "churrascomaster", full_name: "Churrasco Master", followers: 35000, bio: "Churrasco perfeito e dicas de cortes 🥩", category: "Food", email: "churrascomaster@gmail.com" },
    { username: "veganbr_", full_name: "Vegan BR", followers: 22000, bio: "Receitas veganas fáceis e saborosas 🌱", category: "Food" },
    { username: "comidasaudavel_", full_name: "Comida Saudável", followers: 15000, bio: "Alimentação consciente no dia a dia", category: "Food", email: "comidasaudavel@gmail.com" },
    { username: "paoartesanal_br", full_name: "Pão Artesanal BR", followers: 9000, bio: "Panificação artesanal em casa 🍞", category: "Food" },
  ],
  financas: [
    { username: "thiagonigro", full_name: "Thiago Nigro", followers: 8200000, bio: "O primo rico 💰 Educação financeira", category: "Finance" },
    { username: "mepoupe", full_name: "Me Poupe!", followers: 4600000, bio: "Finanças pessoais de forma divertida", category: "Finance" },
    { username: "investidorsardinha", full_name: "Investidor Sardinha", followers: 2100000, bio: "Educação financeira para todos 📈", category: "Finance" },
    { username: "economianahora", full_name: "Economia na Hora", followers: 890000, bio: "Dicas de finanças pessoais", category: "Finance" },
    { username: "caroldesousaa", full_name: "Carol de Sousa", followers: 450000, bio: "Finanças e investimentos 💸", category: "Finance" },
    { username: "financasdobem", full_name: "Finanças do Bem", followers: 280000, bio: "Seu guia financeiro gratuito", category: "Finance" },
    { username: "investepequeno", full_name: "Investe Pequeno", followers: 42000, bio: "Investimentos a partir de R$10 📊", category: "Finance", email: "investepequeno@gmail.com" },
    { username: "financasfem", full_name: "Finanças Femininas", followers: 30000, bio: "Educação financeira para mulheres 💜", category: "Finance", email: "financasfem@gmail.com" },
    { username: "criptobr_mic", full_name: "Cripto BR", followers: 20000, bio: "Crypto e blockchain simplificado 🪙", category: "Finance" },
    { username: "economizarbr", full_name: "Economizar BR", followers: 12000, bio: "Dicas de economia doméstica 🏠", category: "Finance", email: "economizarbr@gmail.com" },
  ],
  maternidade: [
    { username: "tata_fersoza", full_name: "Tata Fersoza", followers: 18000000, bio: "Mãe e influenciadora 👶", category: "Parenting" },
    { username: "vivian_amorim", full_name: "Vivian Amorim", followers: 4200000, bio: "Maternidade real e sem filtros", category: "Parenting" },
    { username: "maternidadereal", full_name: "Maternidade Real", followers: 1800000, bio: "Para mães de verdade ❤️", category: "Parenting" },
    { username: "maedeprimeiraviagem", full_name: "Mãe de Primeira Viagem", followers: 680000, bio: "Dicas de maternidade", category: "Parenting" },
    { username: "blogdamamae", full_name: "Blog da Mamãe", followers: 420000, bio: "Maternidade e família 🏡", category: "Parenting" },
    { username: "bebe_e_cia", full_name: "Bebê e Cia", followers: 320000, bio: "Tudo sobre bebês e crianças", category: "Parenting" },
    { username: "maedemenino_", full_name: "Mãe de Menino", followers: 48000, bio: "Maternidade real de mãe de meninos 💙", category: "Parenting", email: "maedemenino@gmail.com" },
    { username: "gravidez.dicas", full_name: "Gravidez Dicas", followers: 32000, bio: "Tudo sobre gravidez e pós-parto 🤰", category: "Parenting" },
    { username: "montessori_br", full_name: "Montessori BR", followers: 22000, bio: "Educação Montessori em casa 🧩", category: "Parenting", email: "montessoribr@gmail.com" },
    { username: "amamentarbr", full_name: "Amamentar BR", followers: 14000, bio: "Apoio e dicas de amamentação 🤱", category: "Parenting" },
  ],
  pets: [
    { username: "edu.pita", full_name: "Eduardo Pita", followers: 2800000, bio: "Veterinário e pet lover 🐕", category: "Pets" },
    { username: "petloveoficial", full_name: "Petlove", followers: 1200000, bio: "O maior petshop online do Brasil 🐾", category: "Pets" },
    { username: "cachorrostagram_br", full_name: "Cachorros BR", followers: 980000, bio: "Tudo sobre cachorros 🐶", category: "Pets" },
    { username: "gatosbr", full_name: "Gatos BR", followers: 580000, bio: "O mundo dos gatos felinos 🐱", category: "Pets" },
    { username: "vetpetbr", full_name: "Vet Pet BR", followers: 380000, bio: "Saúde e bem-estar animal", category: "Pets" },
    { username: "meupetecool", full_name: "Meu Pet É Cool", followers: 240000, bio: "Pets com estilo 🐾", category: "Pets" },
    { username: "adotepet_", full_name: "Adote Pet", followers: 45000, bio: "Adoção responsável de animais 🐾❤️", category: "Pets", email: "adotepet@gmail.com" },
    { username: "petfood.caseiro", full_name: "Pet Food Caseiro", followers: 30000, bio: "Alimentação natural para pets 🥩", category: "Pets", email: "petfoodcaseiro@gmail.com" },
    { username: "dogwalker_sp", full_name: "Dog Walker SP", followers: 18000, bio: "Passeios e adestramento canino 🐕‍🦺", category: "Pets" },
    { username: "aquarismobr", full_name: "Aquarismo BR", followers: 11000, bio: "Aquários e peixes ornamentais 🐠", category: "Pets" },
  ],
  viagem: [
    { username: "aquelaviagem", full_name: "Aquela Viagem", followers: 2400000, bio: "Viagens incríveis pelo Brasil e mundo ✈️", category: "Travel" },
    { username: "maxmilhas", full_name: "Maxmilhas", followers: 1800000, bio: "Viaje mais gastando menos 🌎", category: "Travel" },
    { username: "turistanato", full_name: "Turista Nato", followers: 1200000, bio: "Viagens, destinos e dicas 🗺️", category: "Travel" },
    { username: "blogdaviagem", full_name: "Blog da Viagem", followers: 680000, bio: "Destinos e dicas de viagem", category: "Travel" },
    { username: "roteirosdasemana", full_name: "Roteiros da Semana", followers: 420000, bio: "Viagens de final de semana", category: "Travel" },
    { username: "mochileirosdobrasil", full_name: "Mochileiros do Brasil", followers: 280000, bio: "Viajar é viver 🎒", category: "Travel" },
    { username: "viagembarata_", full_name: "Viagem Barata", followers: 48000, bio: "Viagens econômicas pelo Brasil ✈️💰", category: "Travel", email: "viagembarata@gmail.com" },
    { username: "trilhasbr_", full_name: "Trilhas BR", followers: 32000, bio: "Trilhas e ecoturismo 🏔️", category: "Travel", email: "trilhasbr@gmail.com" },
    { username: "vanlife_brasil", full_name: "Vanlife Brasil", followers: 20000, bio: "Vida sobre rodas pelo Brasil 🚐", category: "Travel" },
    { username: "hostel.tips", full_name: "Hostel Tips", followers: 12000, bio: "Dicas de hospedagem econômica 🏨", category: "Travel", email: "hosteltips@gmail.com" },
  ],
  humor: [
    { username: "whinderssonnunes", full_name: "Whindersson Nunes", followers: 56000000, bio: "Comediante e youtuber 😂", category: "Comedy" },
    { username: "gkay", full_name: "Gessica Kayane", followers: 22000000, bio: "Influenciadora e comediante", category: "Comedy" },
    { username: "matheuscarnevalli", full_name: "Matheus Carnevalli", followers: 8200000, bio: "Humor e entretenimento", category: "Comedy" },
    { username: "pivotbr", full_name: "Pivot BR", followers: 4600000, bio: "Memes e humor nacional", category: "Comedy" },
    { username: "komikadooficial", full_name: "Komikado", followers: 1800000, bio: "Stand-up e humor", category: "Comedy" },
    { username: "humordobem_", full_name: "Humor do Bem", followers: 350000, bio: "Humor leve e familiar 😄", category: "Comedy" },
    { username: "memesbrasil_", full_name: "Memes Brasil", followers: 95000, bio: "Os melhores memes do BR 🤣", category: "Comedy" },
    { username: "comediante_mic", full_name: "Comediante Mic", followers: 42000, bio: "Stand-up e humor no dia a dia 🎤", category: "Comedy", email: "comediante.mic@gmail.com" },
    { username: "piadas.br", full_name: "Piadas BR", followers: 28000, bio: "Humor para todos os momentos", category: "Comedy" },
    { username: "satirabr_", full_name: "Sátira BR", followers: 15000, bio: "Humor e sátira social 😏", category: "Comedy" },
  ],
  lifestyle: [
    { username: "virginiafonsecaoficial", full_name: "Virgínia Fonseca", followers: 50000000, bio: "Empresária e influenciadora", category: "Lifestyle" },
    { username: "juliette", full_name: "Juliette", followers: 30000000, bio: "Advogada e cantora", category: "Lifestyle" },
    { username: "biancaandrade", full_name: "Bianca Andrade", followers: 16000000, bio: "CEO Boca Rosa Beauty 💄", category: "Lifestyle" },
    { username: "sabrinasato", full_name: "Sabrina Sato", followers: 32000000, bio: "Apresentadora e musa", category: "Lifestyle" },
    { username: "lifestylebr_", full_name: "Lifestyle BR", followers: 380000, bio: "Estilo de vida e bem-estar", category: "Lifestyle" },
    { username: "vidaminimalista_", full_name: "Vida Minimalista", followers: 150000, bio: "Minimalismo e organização 🏠", category: "Lifestyle" },
    { username: "rotinabr_", full_name: "Rotina BR", followers: 45000, bio: "Rotina produtiva e organização ✨", category: "Lifestyle", email: "rotinabr@gmail.com" },
    { username: "vidaurbana_", full_name: "Vida Urbana", followers: 30000, bio: "Vida urbana e dicas do dia a dia 🏙️", category: "Lifestyle" },
    { username: "slowliving_br", full_name: "Slow Living BR", followers: 20000, bio: "Vida lenta e consciente 🌿", category: "Lifestyle", email: "slowlivingbr@gmail.com" },
    { username: "diariobr_", full_name: "Diário BR", followers: 10000, bio: "Lifestyle e autoconhecimento", category: "Lifestyle" },
  ],
  saude: [
    { username: "drauziovarella", full_name: "Drauzio Varella", followers: 5200000, bio: "Médico e escritor ❤️‍🩺", category: "Health" },
    { username: "medicinadesimplificada", full_name: "Medicina Desimplificada", followers: 4200000, bio: "Saúde de forma simples e divertida", category: "Health" },
    { username: "drpedroverde", full_name: "Dr. Pedro Verde", followers: 2800000, bio: "Médico especialista em saúde preventiva", category: "Health" },
    { username: "drmarcioatalla", full_name: "Dr. Márcio Atalla", followers: 1800000, bio: "Educação física e saúde", category: "Health" },
    { username: "nutri_mayara", full_name: "Nutri Mayara", followers: 680000, bio: "Nutricionista | Alimentação saudável 🥗", category: "Health" },
    { username: "saudenarede", full_name: "Saúde na Rede", followers: 420000, bio: "Informação de saúde confiável", category: "Health" },
    { username: "psicologabr_", full_name: "Psicóloga BR", followers: 48000, bio: "Saúde mental e autoconhecimento 🧠", category: "Health", email: "psicologabr@gmail.com" },
    { username: "fisioterapia_", full_name: "Fisioterapia BR", followers: 32000, bio: "Dicas de fisioterapia e postura", category: "Health", email: "fisioterapiabr@gmail.com" },
    { username: "saudeintegrativa", full_name: "Saúde Integrativa", followers: 20000, bio: "Medicina integrativa e natural 🌿", category: "Health" },
    { username: "dormirbem_", full_name: "Dormir Bem", followers: 12000, bio: "Qualidade do sono e saúde 😴", category: "Health", email: "dormirbem@gmail.com" },
  ],
  educacao: [
    { username: "escolaconquer", full_name: "Escola Conquer", followers: 2800000, bio: "Educação para o futuro 🎓", category: "Education" },
    { username: "meformei", full_name: "Me Formei!", followers: 1800000, bio: "Dicas para estudantes universitários", category: "Education" },
    { username: "cursinhobr", full_name: "Cursinho BR", followers: 1200000, bio: "Vestibular e ENEM 📚", category: "Education" },
    { username: "professorhygor", full_name: "Professor Hygor", followers: 680000, bio: "Matemática de forma simples", category: "Education" },
    { username: "filosofiabr", full_name: "Filosofia BR", followers: 420000, bio: "Filosofia para todos 🧠", category: "Education" },
    { username: "historyofbrazil", full_name: "História do Brasil", followers: 380000, bio: "História de um jeito diferente", category: "Education" },
    { username: "concursobr_", full_name: "Concurso BR", followers: 45000, bio: "Dicas para concursos públicos 📝", category: "Education", email: "concursobr@gmail.com" },
    { username: "ingles.rapido", full_name: "Inglês Rápido", followers: 38000, bio: "Aprenda inglês de forma prática 🇺🇸", category: "Education", email: "inglesrapido@gmail.com" },
    { username: "estudagrambr", full_name: "Estudagram BR", followers: 22000, bio: "Organização e métodos de estudo 📖", category: "Education" },
    { username: "cienciabr_", full_name: "Ciência BR", followers: 14000, bio: "Ciência de forma divertida 🔬", category: "Education" },
  ],
  esportes: [
    { username: "neymarjr", full_name: "Neymar Jr", followers: 234000000, bio: "⚽ NJR", category: "Sports" },
    { username: "vinijr", full_name: "Vini Jr", followers: 42000000, bio: "🇧🇷 Real Madrid ⚡", category: "Sports" },
    { username: "gabigol", full_name: "Gabriel Barbosa", followers: 18000000, bio: "Flamengo ❤️🖤", category: "Sports" },
    { username: "rafaelbru", full_name: "Rafael Braga", followers: 3200000, bio: "Futebol e lifestyle ⚽", category: "Sports" },
    { username: "futeboltube", full_name: "Futebol Tube", followers: 2800000, bio: "O melhor do futebol nacional", category: "Sports" },
    { username: "brazilsports", full_name: "Brazil Sports", followers: 1200000, bio: "Esportes do Brasil 🇧🇷", category: "Sports" },
    { username: "futebolraiz_", full_name: "Futebol Raiz", followers: 95000, bio: "Futebol de várzea e raiz ⚽", category: "Sports" },
    { username: "basquetebr_", full_name: "Basquete BR", followers: 42000, bio: "NBA e basquete brasileiro 🏀", category: "Sports", email: "basquetebr@gmail.com" },
    { username: "surfbrasil_", full_name: "Surf Brasil", followers: 28000, bio: "Surf e vida na praia 🏄", category: "Sports" },
    { username: "jiujitsubr_", full_name: "Jiu-Jitsu BR", followers: 18000, bio: "Arte suave e competições 🥋", category: "Sports", email: "jiujitsubr@gmail.com" },
    { username: "cicloturismo_", full_name: "Cicloturismo BR", followers: 10000, bio: "Bike e cicloturismo 🚴", category: "Sports" },
  ],
  decoracao: [
    { username: "casavogue", full_name: "Casa Vogue Brasil", followers: 4200000, bio: "Decoração, design e arquitetura", category: "Interior Design" },
    { username: "archi5", full_name: "Archi 5", followers: 1800000, bio: "Arquitetura e design de interiores 🏠", category: "Interior Design" },
    { username: "decoreseucanto", full_name: "Decore Seu Canto", followers: 980000, bio: "Decoração para todos os bolsos", category: "Interior Design" },
    { username: "apartamentopequeno", full_name: "Apartamento Pequeno", followers: 680000, bio: "Ideias para apartamentos compactos", category: "Interior Design" },
    { username: "designdeinteriores_br", full_name: "Design de Interiores BR", followers: 420000, bio: "Inspirações de decoração", category: "Interior Design" },
    { username: "minhacasaemforma", full_name: "Minha Casa em Forma", followers: 280000, bio: "Decoração acessível e bonita 🌿", category: "Interior Design" },
    { username: "diy.casa", full_name: "DIY Casa", followers: 48000, bio: "Faça você mesmo para casa 🔨", category: "Interior Design", email: "diycasa@gmail.com" },
    { username: "plantasbr_", full_name: "Plantas BR", followers: 35000, bio: "Plantas e jardinagem em casa 🌱", category: "Interior Design", email: "plantasbr@gmail.com" },
    { username: "organizacao_br", full_name: "Organização BR", followers: 22000, bio: "Organização e home office ✨", category: "Interior Design" },
    { username: "luminariabr", full_name: "Luminária BR", followers: 12000, bio: "Iluminação e design de ambientes 💡", category: "Interior Design" },
  ],
  automoveis: [
    { username: "acabordo", full_name: "Acabordo", followers: 2800000, bio: "Automóveis e motocicletas 🚗", category: "Automotive" },
    { username: "vrum", full_name: "Vrum", followers: 1800000, bio: "O portal de carros do Brasil", category: "Automotive" },
    { username: "motorshow", full_name: "Motor Show", followers: 1200000, bio: "Tudo sobre carros e motos", category: "Automotive" },
    { username: "topgear_brasil", full_name: "Top Gear Brasil", followers: 980000, bio: "O melhor do automobilismo", category: "Automotive" },
    { username: "carrosbr", full_name: "Carros BR", followers: 680000, bio: "Notícias e reviews de carros", category: "Automotive" },
    { username: "pilotosbr", full_name: "Pilotos BR", followers: 420000, bio: "Automobilismo e esporte a motor", category: "Automotive" },
    { username: "mecanicabr_", full_name: "Mecânica BR", followers: 48000, bio: "Dicas de mecânica para leigos 🔧", category: "Automotive", email: "mecanicabr@gmail.com" },
    { username: "carroeletricobr", full_name: "Carro Elétrico BR", followers: 30000, bio: "Carros elétricos e híbridos ⚡🚗", category: "Automotive" },
    { username: "motosbr_", full_name: "Motos BR", followers: 20000, bio: "Reviews e dicas de motos 🏍️", category: "Automotive", email: "motosbr@gmail.com" },
    { username: "lavandocarros", full_name: "Lavando Carros", followers: 12000, bio: "Detailing e estética automotiva ✨", category: "Automotive" },
  ],
  musica: [
    { username: "anitta", full_name: "Anitta", followers: 62000000, bio: "Girl from Rio 🎵", category: "Music" },
    { username: "ludmilla", full_name: "Ludmilla", followers: 30000000, bio: "Cantora, compositora e atriz 🏆", category: "Music" },
    { username: "luisasonza", full_name: "Luísa Sonza", followers: 28000000, bio: "Cantora e compositora 🎤", category: "Music" },
    { username: "matue", full_name: "Matuê", followers: 8200000, bio: "Rapper e produtor musical 🎧", category: "Music" },
    { username: "criolo", full_name: "Criolo", followers: 1800000, bio: "Rapper e cantor brasileiro 🎙️", category: "Music" },
    { username: "musicabrasileira", full_name: "Música Brasileira", followers: 980000, bio: "O melhor da música BR", category: "Music" },
    { username: "violaobr_", full_name: "Violão BR", followers: 48000, bio: "Aulas e dicas de violão 🎸", category: "Music", email: "violaobr@gmail.com" },
    { username: "bateriabr_", full_name: "Bateria BR", followers: 30000, bio: "Covers e dicas de bateria 🥁", category: "Music" },
    { username: "prodmusical_", full_name: "Prod Musical BR", followers: 20000, bio: "Produção musical e home studio 🎹", category: "Music", email: "prodmusical@gmail.com" },
    { username: "cantor.independente", full_name: "Cantor Independente", followers: 12000, bio: "Música autoral e independente 🎶", category: "Music" },
  ],
}

type SearchRecord = Awaited<ReturnType<typeof prisma.search.findUnique>>

function getSeedInfluencers(niche: string, tier: string): SeedInfluencer[] {
  const key = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const all = SEED_INFLUENCERS[key] || SEED_INFLUENCERS.lifestyle || []

  // Filter by tier: MICRO ≤50K, MID 50K-500K, MACRO >500K
  // If no tier specified or ALL, return all
  if (!tier || tier === "ALL") return all

  return all.filter((s) => {
    const t = getTierFromFollowers(s.followers)
    return t === tier
  })
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
    const seeds = getSeedInfluencers(search.niche, search.tier)
    console.log(`[search] using ${seeds.length} seed influencers for niche: ${search.niche}, tier: ${search.tier}`)

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
          console.log(`[search] AI strategy generated for ${item.influencer.instagram_username}`)
        } catch (err) {
          console.error(`[search] AI error for ${item.influencer.instagram_username}:`, err)
        }
      }
    } else {
      console.log(`[search] skipping AI strategies - OPENROUTER_API_KEY: ${!!process.env.OPENROUTER_API_KEY}, results: ${savedResults.length}`)
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
