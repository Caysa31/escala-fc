/**
 * gerar-pistas.js
 * Adiciona pista2, pista3, pista4 personalizadas a cada jogador em data/jogadores.json
 * Regra: pista2 ≤ 60 chars (absoluto). Não sobrescreve campos já existentes.
 * Rodar: node scripts/gerar-pistas.js
 */

const fs = require('fs')
const path = require('path')

const JOGADORES_PATH = path.join(__dirname, '..', 'data', 'jogadores.json')

// Lookup table: id → { pista2, pista3, pista4 }
// pista2: estilo de jogo, ≤60 chars ABSOLUTO
// pista3: origem/raiz, 1-2 frases
// pista4: trajetória, 1-2 frases
const PISTAS = {
  1: {
    pista2: "Meia box-to-box com gol nos pés e visão de passe rara.",
    pista3: "Nasceu no Rio de Janeiro e cresceu no Flamengo, clube do coração de toda a família.",
    pista4: "Brilhou no Lyon e no West Ham antes de retornar ao Brasil pela maior taxa da história."
  },
  2: {
    pista2: "Meia habilidoso, dono de dribles curtos e passe decisivo.",
    pista3: "Natural de Salto, no Uruguai, cresceu no futebol platino antes de vir ao Brasil.",
    pista4: "Antes do clube atual, jogou no Cruzeiro."
  },
  3: {
    pista2: "Centroavante dominante na área, letal de cabeça e gol.",
    pista3: "Nasceu em Natal, no Rio Grande do Norte, e foi revelado pelo Fluminense ainda jovem.",
    pista4: "Antes do clube atual, jogou na Fiorentina, na Serie A."
  },
  4: {
    pista2: "Meia jovem com boa leitura tática e qualidade no passe.",
    pista3: "Nasceu em São Paulo e foi revelado nas categorias de base do próprio Corinthians.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  5: {
    pista2: "Atacante veloz e goleador, mata dentro da área com frieza.",
    pista3: "Natural de Santos, no litoral de São Paulo, sonhou no futebol europeu desde jovem.",
    pista4: "Antes do clube atual, jogou no Zenit, na Liga Russa."
  },
  6: {
    pista2: "Meia criativo com visão de passe e faro de gol do meio.",
    pista3: "Natural de Córdoba, na Argentina, aprendeu o futebol nas divisões de base do Talleres.",
    pista4: "Chegou ao clube atual vindo do Talleres, na Liga Profesional."
  },
  7: {
    pista2: "Centroavante argentino de força, garra e gols decisivos.",
    pista3: "Nasceu em Buenos Aires, na Argentina, e passou por vários clubes antes de se fixar no Brasil.",
    pista4: "Chegou ao clube atual vindo do Deportivo Alavés, na La Liga."
  },
  8: {
    pista2: "Atacante raçudo, inteligente e com faro de gol consistente.",
    pista3: "Natural de Recife, em Pernambuco, cresceu sonhando no futebol de alto nível.",
    pista4: "Antes do clube atual, jogou no Athletico-PR."
  },
  9: {
    pista2: "Extrema veloz e driblador, difícil de segurar na ponta.",
    pista3: "Nasceu em Governador Valadares, Minas Gerais, e construiu carreira pelo interior do Brasil.",
    pista4: "Antes do clube atual, jogou no Goiás."
  },
  10: {
    pista2: "Jovem atacante explosivo, veloz e com faro de gol precoce.",
    pista3: "Nasceu em Timóteo, em Minas Gerais, e foi revelado pelo Cruzeiro ainda adolescente.",
    pista4: "Retornou ao Brasil após empréstimo no Barcelona, na La Liga."
  },
  11: {
    pista2: "Centroavante habilidoso, com pé esquerdo preciso e móvel.",
    pista3: "Natural de Buenos Aires, na Argentina, cresceu no Argentinos Juniors.",
    pista4: "Chegou ao clube atual vindo do Argentinos Juniors, na Liga Profesional."
  },
  12: {
    pista2: "Meia completo, com poder de chute e criatividade europeia.",
    pista3: "Nasceu na Bélgica mas tem raízes brasileiras — cresceu entre o Brasil e a Europa.",
    pista4: "Antes do clube atual, jogou no Fulham, na Premier League."
  },
  13: {
    pista2: "Atacante veloz da Colômbia, driblador e imprevisível.",
    pista3: "Natural de Pereira, na Colômbia, é um dos talentos mais promissores da América do Sul.",
    pista4: "Chegou ao clube atual vindo do Deportivo Pereira, na Categoría Primera A."
  },
  14: {
    pista2: "Ponta português habilidoso, com velocidade e criatividade.",
    pista3: "Nasceu em Portugal e cresceu no Vitória de Guimarães antes de se destacar.",
    pista4: "Chegou ao clube atual vindo do Vitória de Guimarães, na Liga Portugal."
  },
  15: {
    pista2: "Goleiro de bons reflexos e posicionamento seguro.",
    pista3: "Natural de Campina Grande, na Paraíba, construiu sua carreira pelos clubes brasileiros.",
    pista4: "Antes do clube atual, jogou no Coritiba."
  },
  16: {
    pista2: "Meia box-to-box de volume, qualidade técnica e força.",
    pista3: "Nasceu no Rio de Janeiro e cresceu no Flamengo, clube da sua cidade natal.",
    pista4: "Antes do clube atual, jogou no Flamengo."
  },
  17: {
    pista2: "Meia camisa 10 criativo, arma o jogo com passes precisos.",
    pista3: "Natural do Rio de Janeiro, irmão do também jogador Andreas Pereira — futebol no sangue.",
    pista4: "Antes do clube atual, jogou no Al-Hilal, na Saudi Pro League."
  },
  18: {
    pista2: "Atacante habilidoso com bom drible e finalização fina.",
    pista3: "Nasceu em Aracaju, em Sergipe, e foi revelado pelo Santos ainda como adolescente.",
    pista4: "Antes do clube atual, jogou na Juventus, na Serie A."
  },
  19: {
    pista2: "Meia criador de jogadas, inteligente e com passe preciso.",
    pista3: "Natural de Pelotas, no Rio Grande do Sul, construiu trajetória sólida no futebol brasileiro.",
    pista4: "Antes do clube atual, jogou no Shakhtar Donetsk, na Ucrânia."
  },
  20: {
    pista2: "Atacante colombiano rápido, com garra e gols decisivos.",
    pista3: "Natural de Barranquilla, na Colômbia, é um dos atacantes mais respeitados da América do Sul.",
    pista4: "Antes do clube atual, jogou no Eintracht Frankfurt, na Bundesliga."
  },
  21: {
    pista2: "Meia-atacante veloz, habilidoso e com gol nos pés.",
    pista3: "Nasceu em São Paulo e teve boa formação antes de se destacar no futebol europeu.",
    pista4: "Antes do clube atual, jogou no Sporting CP, na Liga Portugal."
  },
  22: {
    pista2: "Centroavante colombiano físico, de área, bom no jogo aéreo.",
    pista3: "Natural da Colômbia, cresceu na base do Atlético Nacional antes de ir ao Brasil.",
    pista4: "Chegou ao clube atual vindo do Atlético Nacional, na Categoría Primera A."
  },
  23: {
    pista2: "Meia criativo com pé esquerdo preciso e faltas especiais.",
    pista3: "Nasceu em São Paulo e cresceu pelo futebol paulista antes do Palmeiras.",
    pista4: "Antes do clube atual, jogou no Palmeiras."
  },
  24: {
    pista2: "Ponta driblador e veloz, especialista no um-a-um.",
    pista3: "Natural de São Paulo, cresceu nas categorias de base do Palmeiras, onde virou ídolo.",
    pista4: "Antes do clube atual, jogou no Al-Qadsiah, na Saudi Pro League."
  },
  25: {
    pista2: "Centroavante alto e técnico, com passagem pela Europa.",
    pista3: "Nasceu em Ibirité, em Minas Gerais, e foi revelado pelo futebol mineiro.",
    pista4: "Antes do clube atual, jogou no Fulham, na Premier League."
  },
  26: {
    pista2: "Meia de toque curto e posse — saído da escola de Guardiola.",
    pista3: "Natural de Goiânia, em Goiás, foi revelado pelo Grêmio e logo chamou atenção da Europa.",
    pista4: "Antes do clube atual, jogou na Juventus, na Serie A."
  },
  27: {
    pista2: "Meia argentino de faltas e pênaltis — pé esquerdo letal.",
    pista3: "Natural de Buenos Aires, na Argentina, cresceu no Independiente antes de vir ao Brasil.",
    pista4: "Chegou ao clube atual vindo do Independiente, na Liga Profesional."
  },
  28: {
    pista2: "O maior driblador do Brasil — perigoso, criativo e letal.",
    pista3: "Nasceu em Mogi das Cruzes, em São Paulo, e foi revelado pelo Santos, clube que o fez estrela.",
    pista4: "Antes do clube atual, jogou no Al-Hilal, na Saudi Pro League."
  },
  29: {
    pista2: "Atacante clínico de área, especialista em gols decisivos.",
    pista3: "Natural de Santos, no litoral de São Paulo — terra natal e berço de muitos craques.",
    pista4: "Antes do clube atual, jogou no Flamengo."
  },
  30: {
    pista2: "Volante seguro e disciplinado, equilíbrio do meio-campo.",
    pista3: "Natural do Rio de Janeiro, construiu sua história no futebol carioca antes de chegar ao Santos.",
    pista4: "Antes do clube atual, jogou no Flamengo."
  },
  31: {
    pista2: "Goleiro lendário com mais de 40 anos ao mais alto nível.",
    pista3: "Natural de Juiz de Fora, em Minas Gerais, cresceu na base do Cruzeiro onde virou ídolo.",
    pista4: "Antes do clube atual, jogou no Cruzeiro."
  },
  32: {
    pista2: "Atacante potente, bom de chute forte e gols espetaculares.",
    pista3: "Nasceu em Campina Grande, na Paraíba — nordestino que fez história no Brasil e no mundo.",
    pista4: "Antes do clube atual, jogou no Atlético-MG."
  },
  33: {
    pista2: "Atacante de profundidade, com gol certeiro e sangue-frio.",
    pista3: "Nasceu no Rio de Janeiro e cresceu nas categorias de base do próprio Fluminense.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  34: {
    pista2: "Centroavante técnico e de área, letal de cabeça e pé.",
    pista3: "Natural de Patos, na Paraíba, foi revelado pelo Ceará antes de se destacar na Europa.",
    pista4: "Antes do clube atual, jogou no Benfica, na Liga Portugal."
  },
  35: {
    pista2: "Lateral ofensivo com cruzamento preciso e gols de falta.",
    pista3: "Natural de Caxias do Sul, no Rio Grande do Sul, cresceu no futebol gaúcho.",
    pista4: "Antes do clube atual, jogou no Sevilla, na La Liga."
  },
  36: {
    pista2: "Meia argentino técnico e de movimentação, forte no drible.",
    pista3: "Natural de Buenos Aires, na Argentina, formou-se nas categorias do Racing Club.",
    pista4: "Chegou ao clube atual vindo do Racing Club, na Liga Profesional."
  },
  37: {
    pista2: "Atacante elétrico, dribla, envolve e decide com classe.",
    pista3: "Nasceu em São Gonçalo, no Rio de Janeiro, e foi revelado pelo Flamengo aos 11 anos.",
    pista4: "Antes do clube atual, jogou no Flamengo."
  },
  38: {
    pista2: "Atacante versátil, inteligente e decisivo nos grandes jogos.",
    pista3: "Natural de Osasco, em São Paulo, foi revelado pelo Santos e chamou atenção do mundo.",
    pista4: "Antes do clube atual, jogou no Santos."
  },
  39: {
    pista2: "Meia-atacante bravo, raçudo e participativo dos dois lados.",
    pista3: "Natural de Porto Alegre, no Rio Grande do Sul, cresceu no futebol gaúcho antes da Europa.",
    pista4: "Antes do clube atual, jogou no Leeds United, na Premier League."
  },
  40: {
    pista2: "Atacante brasileiro raçudo, veloz e com gol nos dois pés.",
    pista3: "Natural de Guarulhos, em São Paulo, foi revelado pelo Ituano com apenas 17 anos.",
    pista4: "Antes do clube atual, jogou no Ituano."
  },
  41: {
    pista2: "Goleiro de classe mundial — reflexos e saída de bola.",
    pista3: "Natural de Novo Hamburgo, no Rio Grande do Sul, cresceu na base do Internacional.",
    pista4: "Antes do clube atual, jogou na Roma, na Serie A."
  },
  42: {
    pista2: "Volante completo — corta, cria e lidera o meio-campo.",
    pista3: "Natural de Duque de Caxias, no Rio de Janeiro, cresceu no Audax antes do Athletico-PR.",
    pista4: "Antes do clube atual, jogou no Lyon, na Ligue 1."
  },
  43: {
    pista2: "Atacante poderoso, letal de cabeça e com pressão intensa.",
    pista3: "Natural de Feira de Santana, na Bahia, foi revelado pelo futebol baiano antes do Botafogo.",
    pista4: "Antes do clube atual, jogou no Botafogo."
  },
  44: {
    pista2: "Centroavante artilheiro e eficiente, forte dentro da área.",
    pista3: "Natural de Recife, em Pernambuco, foi revelado pelo futebol pernambucano antes da Europa.",
    pista4: "Antes do clube atual, jogou no Club Brugge, na Pro League."
  },
  45: {
    pista2: "Jovem craque driblador, com velocidade e gol no sangue.",
    pista3: "Natural de Sorocaba, em São Paulo, cresceu no Palmeiras desde muito jovem.",
    pista4: "Antes do clube atual, jogou no Palmeiras."
  },
  46: {
    pista2: "Jovem atacante explosivo, com faro de gol e frieza.",
    pista3: "Natural de Brasília, no Distrito Federal, foi revelado pelo Palmeiras ainda adolescente.",
    pista4: "Antes do clube atual, jogou no Palmeiras."
  },
  47: {
    pista2: "O maior de todos — driblador, assistente e campeão mundial.",
    pista3: "Natural de Rosário, na Argentina, foi levado ao Barcelona aos 13 anos com problemas de crescimento.",
    pista4: "Antes do clube atual, jogou no PSG, na Ligue 1."
  },
  48: {
    pista2: "Atleta incomparável — potência, gol e liderança de campeão.",
    pista3: "Nasceu na Ilha da Madeira, em Portugal, e foi revelado pelo Sporting CP com 16 anos.",
    pista4: "Antes do clube atual, jogou no Manchester United, na Premier League."
  },
  49: {
    pista2: "Atacante veloz e explosivo, com drible e gol instintivo.",
    pista3: "Natural de Bondy, na França, de família de origem camaronesa e argelina.",
    pista4: "Antes do clube atual, jogou no PSG, na Ligue 1."
  },
  50: {
    pista2: "Máquina de gols — velocidade e chute certeiro como poucos.",
    pista3: "Natural de Leeds, na Inglaterra, filho do ex-jogador Alfie Haaland, cresceu na Noruega.",
    pista4: "Antes do clube atual, jogou no Borussia Dortmund, na Bundesliga."
  },
  51: {
    pista2: "O Rei — poder, gol, drible e elegância em uma só pessoa.",
    pista3: "Nasceu em Três Corações, em Minas Gerais, mas cresceu em Bauru, em São Paulo, onde se revelou.",
    pista4: "Foi revelado nas categorias de base do próprio Santos, onde jogou a carreira inteira no Brasil."
  },
  52: {
    pista2: "O Fenômeno — velocidade, drible e gol únicos na história.",
    pista3: "Nasceu no Rio de Janeiro e foi revelado pelo Cruzeiro, em Minas Gerais, como talento precoce.",
    pista4: "Antes do Real Madrid, jogou na Inter de Milão, na Serie A."
  },
  53: {
    pista2: "O mago do futebol — driblava, encantava e vencia tudo.",
    pista3: "Natural de Porto Alegre, no Rio Grande do Sul — gaúcho raíz que levou a alegria do sul ao mundo.",
    pista4: "Antes do Barcelona, jogou no PSG, na Ligue 1."
  },
  54: {
    pista2: "Artilheiro compulsivo com faro de gol inigualável.",
    pista3: "Natural do Rio de Janeiro, cresceu nas ruas do subúrbio carioca antes de virar rei dos gols.",
    pista4: "Antes do Barcelona, jogou no PSV Eindhoven, na Eredivisie."
  },
  55: {
    pista2: "O D10S — dribla impossível, visão única e gols históricos.",
    pista3: "Natural de Lanús, em Buenos Aires, na Argentina — cresceu na pobreza antes de se tornar o maior.",
    pista4: "Chegou ao Napoli vindo do Barcelona, na La Liga."
  },
  56: {
    pista2: "Meia elegante, de toque fino e passes que cortavam defesas.",
    pista3: "Nasceu em Marselha, na França, filho de imigrantes argelinos — futebol como redenção.",
    pista4: "Antes do Real Madrid, jogou na Juventus, na Serie A."
  },
  57: {
    pista2: "Ponta esquerdista veloz, com drible e participação em gols.",
    pista3: "Natural de Paulista, em Pernambuco — nordestino que virou herói da Copa América 2019.",
    pista4: "Antes do clube atual, jogou no Benfica, na Liga Portugal."
  },
  58: {
    pista2: "Meia uruguaio de velocidade, drible e passes precisos.",
    pista3: "Natural de Montevidéu, no Uruguai, cresceu no futebol platino antes de vir ao Brasil.",
    pista4: "Antes do clube atual, jogou no River Plate, na Liga Profesional."
  },
  59: {
    pista2: "Goleiro argentino seguro — bom posicionamento e reflexos.",
    pista3: "Natural de Buenos Aires, na Argentina, cresceu na base do Boca Juniors.",
    pista4: "Chegou ao Flamengo vindo do Boca Juniors, na Liga Profesional."
  },
  60: {
    pista2: "Atacante holandês habilidoso, veloz e com chute potente.",
    pista3: "Natural de Moordrecht, na Holanda, filho de pai ganês — construiu carreira pelo futebol europeu.",
    pista4: "Antes do clube atual, jogou no Atlético de Madrid, na La Liga."
  },
  61: {
    pista2: "Zagueiro equatoriano forte, aéreo e de liderança.",
    pista3: "Natural de Santo Domingo, no Equador, é o capitão da Seleção Equatoriana em crescimento.",
    pista4: "Antes do clube atual, jogou no CF Montréal, na MLS."
  },
  62: {
    pista2: "Goleiro jovem de reflexos rápidos e saída de bola segura.",
    pista3: "Natural do Rio de Janeiro, foi revelado nas categorias de base do Flamengo ainda jovem.",
    pista4: "Antes do clube atual, jogou no Flamengo."
  },
  63: {
    pista2: "Meia técnico e inteligente — viveu anos no futebol europeu.",
    pista3: "Natural de Americana, em São Paulo, foi revelado pelo Internacional antes de ir ao Chelsea.",
    pista4: "Antes do clube atual, jogou no Shanghai Port, na Super Liga Chinesa."
  },
  64: {
    pista2: "Zagueiro venezuelano sólido, de bom passe e liderança clara.",
    pista3: "Natural da Venezuela, é capitão da Seleção Venezuelana em crescimento no cenário sul-americano.",
    pista4: "Antes do clube atual, jogou no Manchester City, na Premier League."
  },
  65: {
    pista2: "Lateral-esquerdo ofensivo, veloz e participativo nos gols.",
    pista3: "Natural de São Paulo, cresceu no próprio Tricolor do Morumbi desde as categorias de base.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  66: {
    pista2: "Volante colombiano completo — corta, passa e chega ao gol.",
    pista3: "Natural de Aguachica, na Colômbia, foi revelado pelos Millonarios em Bogotá.",
    pista4: "Antes do clube atual, jogou no Millonarios, na Categoría Primera A."
  },
  67: {
    pista2: "Lateral-esquerdo uruguaio ofensivo, parece mais um ponta.",
    pista3: "Natural de Montevidéu, no Uruguai, cresceu no Junior de Barranquilla antes de vir ao Brasil.",
    pista4: "Chegou ao clube atual vindo do Junior, na Categoría Primera A."
  },
  68: {
    pista2: "Zagueiro paraguaio capitão — líder, aéreo e de bola no chão.",
    pista3: "Natural de Luque, no Paraguai, é capitão da Seleção Paraguaia e símbolo do Palmeiras.",
    pista4: "Antes do clube atual, jogou no AC Milan, na Serie A."
  },
  69: {
    pista2: "Centroavante argentino forte, bom no ar e artilheiro.",
    pista3: "Natural de Buenos Aires, na Argentina — chegou ao Brasil e se tornou ídolo imediato da torcida.",
    pista4: "Chegou ao clube atual vindo do Independiente, na Liga Profesional."
  },
  70: {
    pista2: "Lateral uruguaio raçudo, de bom cruzamento e muita entrega.",
    pista3: "Natural de Montevidéu, no Uruguai, cresceu no Nacional antes de vir ao Brasil.",
    pista4: "Chegou ao clube atual vindo do Nacional, na Primera División."
  },
  71: {
    pista2: "Meia de classe europeia — dribla, chuta e encanta.",
    pista3: "Nasceu no Rio de Janeiro e foi revelado pelo próprio Vasco, clube ao qual retornou ao fim da carreira.",
    pista4: "Antes do clube atual, jogou no Barcelona, na La Liga."
  },
  72: {
    pista2: "Goleiro lendário do Brasileirão, ídolo com grandes defesas.",
    pista3: "Natural de Santarém, no Pará, cresceu nas categorias de base do Corinthians onde virou lenda.",
    pista4: "Antes do clube atual, jogou no Corinthians."
  },
  73: {
    pista2: "Ponta português veloz, habilidoso e participativo.",
    pista3: "Natural de Penafiel, em Portugal, é campeão europeu pela Seleção Portuguesa em 2016.",
    pista4: "Antes do clube atual, jogou no Benfica, na Liga Portugal."
  },
  74: {
    pista2: "Meia gaúcho experiente, de volume e liderança no meio-campo.",
    pista3: "Natural do Rio Grande do Sul, passou por Grêmio, Corinthians e até Boca Juniors na carreira.",
    pista4: "Antes do clube atual, jogou no Boca Juniors, na Liga Profesional."
  },
  75: {
    pista2: "Zagueiro sólido, bom na marcação e no passe longo.",
    pista3: "Natural de Porto Alegre, no Rio Grande do Sul, foi revelado nas categorias do Internacional.",
    pista4: "Antes do clube atual, jogou no Sporting CP, na Liga Portugal."
  },
  76: {
    pista2: "Atacante equatoriano veloz, garra e artilheiro pela Seleção.",
    pista3: "Natural de Esmeraldas, no Equador, é o maior artilheiro da história da Seleção Equatoriana.",
    pista4: "Antes do clube atual, jogou no Tigres UANL, na Liga MX."
  },
  77: {
    pista2: "Lateral-esquerdo raçudo e experiente, de muita entrega.",
    pista3: "Natural do Rio de Janeiro, construiu sua carreira no Flamengo antes de ir à Europa.",
    pista4: "Antes do clube atual, jogou no Rennes, na Ligue 1."
  },
  78: {
    pista2: "Lateral-esquerdo ofensivo, veloz e de bom cruzamento.",
    pista3: "Natural de São Paulo, cresceu nas categorias de base do Corinthians antes de ir ao exterior.",
    pista4: "Antes do clube atual, jogou no Sevilla, na La Liga."
  },
  79: {
    pista2: "Atacante explosivo, veloz e com gol nos dois pés.",
    pista3: "Natural de Belo Horizonte, em Minas Gerais, cresceu nas categorias de base do próprio Atlético-MG.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  80: {
    pista2: "Meia português técnico — passe, drible e liderança.",
    pista3: "Natural de Lisboa, em Portugal, cresceu nas categorias de base do Benfica.",
    pista4: "Antes do clube atual, jogou no FC Porto, na Liga Portugal."
  },
  81: {
    pista2: "Ponta veloz e driblador — vai e volta sem parar.",
    pista3: "Natural de Vitória, no Espírito Santo, foi revelado pelo Grêmio ainda jovem.",
    pista4: "Antes do clube atual, jogou no FC Porto, na Liga Portugal."
  },
  82: {
    pista2: "Lateral-esquerdo experiente, com bom cruzamento e raça.",
    pista3: "Natural de Palmeira dos Índios, em Alagoas, cresceu no futebol alagoano antes de se firmar.",
    pista4: "Antes do clube atual, jogou no São Paulo."
  },
  83: {
    pista2: "Zagueiro argentino capitão, liderança e solidez defensiva.",
    pista3: "Natural de Buenos Aires, na Argentina, cresceu no San Lorenzo antes de vir ao Brasil.",
    pista4: "Chegou ao Grêmio vindo do San Lorenzo, na Liga Profesional."
  },
  84: {
    pista2: "Meia venezuelano criativo, técnico e difícil de marcar.",
    pista3: "Natural da Venezuela, é um dos jogadores mais técnicos que o futebol venezuelano exportou.",
    pista4: "Antes do clube atual, jogou no Atlético-MG."
  },
  85: {
    pista2: "Zagueiro veterano campeão de tudo no Brasil — sólido.",
    pista3: "Natural de Rondonópolis, no Mato Grosso, foi revelado pelo Corinthians onde virou lenda.",
    pista4: "Antes do clube atual, jogou no Corinthians."
  },
  86: {
    pista2: "Lateral-direito jovem, veloz e ofensivo — joia do Santos.",
    pista3: "Natural de Santos, no litoral de São Paulo, cresceu na base do clube que revelou Pelé e Neymar.",
    pista4: "Foi revelado nas categorias de base do próprio Santos."
  },
  87: {
    pista2: "Centroavante artilheiro com os dois pés e de cabeça.",
    pista3: "Natural de Mendoza, na Argentina, passou por vários clubes antes de virar herói do Fluminense.",
    pista4: "Antes do clube atual, jogou no Vasco."
  },
  88: {
    pista2: "Zagueiro elegante e líder — lê o jogo como poucos no mundo.",
    pista3: "Nasceu em Juiz de Fora, em Minas Gerais, mas cresceu no Rio de Janeiro e foi revelado pelo Fluminense.",
    pista4: "Antes do clube atual, jogou no Chelsea, na Premier League."
  },
  89: {
    pista2: "Meia criativo com visão de jogo e gol de fora da área.",
    pista3: "Natural de Florianópolis, em Santa Catarina, cresceu no futebol catarinense antes do Avaí.",
    pista4: "Antes do clube atual, jogou no Avaí."
  },
  90: {
    pista2: "Ponta veloz e decisivo, eleito o melhor da América em 2024.",
    pista3: "Natural da Venezuela, é um dos maiores talentos exportados pelo país no futebol sul-americano.",
    pista4: "Antes do clube atual, jogou no River Plate, na Liga Profesional."
  },
  91: {
    pista2: "Volante de alta intensidade — marca, corre e distribui.",
    pista3: "Natural de Campo Grande, no Mato Grosso do Sul, cresceu no futebol sul-mato-grossense.",
    pista4: "Antes do clube atual, jogou no Atlético-GO."
  },
  92: {
    pista2: "Ponta veloz e driblador, com drible curto e boa finalização.",
    pista3: "Natural de São Paulo, foi revelado pelo Fluminense e depois brilhou na Europa.",
    pista4: "Antes do clube atual, jogou no Real Betis, na La Liga."
  },
  93: {
    pista2: "Atacante veloz, raçudo e de gols decisivos no momento certo.",
    pista3: "Natural de Feira de Santana, na Bahia, cresceu no futebol nordestino antes de brilhar no Sul.",
    pista4: "Antes do clube atual, jogou no Palmeiras."
  },
  94: {
    pista2: "Meia criativo do Nordeste, com drible e visão de jogo.",
    pista3: "Natural de Fortaleza, no Ceará, cresceu nas categorias de base do próprio Fortaleza.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  95: {
    pista2: "Centroavante argentino de área, artilheiro e ídolo leonino.",
    pista3: "Natural de Buenos Aires, na Argentina, é um dos maiores artilheiros da história do Fortaleza.",
    pista4: "Chegou ao clube atual vindo do Independiente, na Liga Profesional."
  },
  96: {
    pista2: "Meia artilheiro e assistente — melhor do Nordeste.",
    pista3: "Natural do interior da Bahia, cresceu no futebol baiano antes de se destacar em Portugal.",
    pista4: "Antes do clube atual, jogou no Estoril Praia, na Liga Portugal."
  },
  97: {
    pista2: "Meia experiente, de técnica apurada e liderança de campeão.",
    pista3: "Natural de Itajaí, em Santa Catarina — baiano de coração, voltou ao estado natal para encerrar a carreira.",
    pista4: "Antes do clube atual, jogou no Flamengo."
  },
  98: {
    pista2: "Meia-atacante baiano de raiz, decisivo e ídolo do Tricolor.",
    pista3: "Natural de Salvador, na Bahia, cresceu no futebol baiano e é referência para a torcida.",
    pista4: "Antes do clube atual, jogou no Vitória."
  },
  99: {
    pista2: "Ponta uruguaio veloz, de drible e participação em gols.",
    pista3: "Natural de Montevidéu, no Uruguai, cresceu no Nacional antes de se destacar no Brasil.",
    pista4: "Chegou ao clube atual vindo do Nacional, na Primera División."
  },
  100: {
    pista2: "Volante campeão na Europa — liderança e inteligência raros.",
    pista3: "Natural de Londrina, no Paraná, foi revelado pelo próprio Athletico-PR antes de ir ao City.",
    pista4: "Antes do clube atual, jogou no Manchester City, na Premier League."
  },
  101: {
    pista2: "Meia raçudo e técnico, talento do futebol paranaense.",
    pista3: "Natural do Paraná, cresceu nas categorias de base do próprio Athletico-PR desde jovem.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  102: {
    pista2: "Centroavante artilheiro e eficiente no Brasileirão.",
    pista3: "Natural do interior do Brasil, foi revelado pelo futebol do Centro-Oeste antes do Bragantino.",
    pista4: "Antes do clube atual, jogou no Cuiabá."
  },
  103: {
    pista2: "Volante de visão ampla e regularidade — peça do Bragantino.",
    pista3: "Natural do interior de São Paulo, cresceu nas categorias de base do próprio Bragantino.",
    pista4: "Foi revelado nas categorias de base do próprio clube onde joga hoje."
  },
  104: {
    pista2: "Lateral-esquerdo técnico, com boa participação ofensiva.",
    pista3: "Natural do interior de São Paulo, teve passagem pela Europa antes de retornar ao Brasil.",
    pista4: "Antes do clube atual, jogou no RB Leipzig, na Bundesliga."
  },
  105: {
    pista2: "Meia completo de alto impacto — gol, drible e liderança.",
    pista3: "Natural de Stourbridge, na Inglaterra, cresceu nas categorias do Birmingham City.",
    pista4: "Antes do clube atual, jogou no Borussia Dortmund, na Bundesliga."
  },
  106: {
    pista2: "Meia box-to-box — motor do Real Madrid e da Seleção.",
    pista3: "Natural de Montevidéu, no Uruguai, cresceu no Peñarol antes de ir ao Real Madrid.",
    pista4: "Chegou ao clube atual vindo do Peñarol, na Primera División."
  },
  107: {
    pista2: "Lateral-meia revolucionário — passe, visão e gol raros.",
    pista3: "Natural de Liverpool, na Inglaterra — criado no clube que o projetou ao mundo.",
    pista4: "Antes do clube atual, jogou no Liverpool, na Premier League."
  },
  108: {
    pista2: "Jovem prodígio driblador, veloz e já decisivo no Barcelona.",
    pista3: "Nasceu em Esplugues de Llobregat, na Espanha, filho de pais marroquinos e guineenses.",
    pista4: "Foi revelado nas categorias de base do próprio Barcelona desde criança."
  },
  109: {
    pista2: "Meia técnico de posse e drible, herdeiro de Xavi no Barça.",
    pista3: "Natural de Santa Cruz de Tenerife, nas Ilhas Canárias, na Espanha.",
    pista4: "Antes do clube atual, jogou no Las Palmas, na La Liga."
  },
  110: {
    pista2: "Centroavante polaco completo — gol nos dois pés e de cabeça.",
    pista3: "Natural de Varsóvia, na Polônia, cresceu no Legia Varsóvia antes de ir ao Borussia Dortmund.",
    pista4: "Antes do clube atual, jogou no Bayern Munich, na Bundesliga."
  },
  111: {
    pista2: "Meia de visão cirúrgica — passe, chute e criação únicos.",
    pista3: "Natural de Drongen, na Bélgica, foi revelado pelo Gent antes de brilhar no Chelsea e Wolfsburg.",
    pista4: "Antes do clube atual, jogou no Wolfsburg, na Bundesliga."
  },
  112: {
    pista2: "Meia-atacante inglês criativo e com gol de alta qualidade.",
    pista3: "Natural de Stockport, na Inglaterra, cresceu nas categorias do Manchester City desde criança.",
    pista4: "Foi revelado nas categorias de base do próprio Manchester City."
  },
  113: {
    pista2: "Meia português inteligente, versátil e incansável em campo.",
    pista3: "Natural de Lisboa, em Portugal, cresceu nas categorias de base do Benfica.",
    pista4: "Antes do clube atual, jogou no Monaco, na Ligue 1."
  },
  114: {
    pista2: "Ponta egípcio veloz, artilheiro e decisivo no Liverpool.",
    pista3: "Natural de Nagrig, no Egito, cresceu jogando futebol de rua antes de ser revelado.",
    pista4: "Antes do clube atual, jogou na Roma, na Serie A."
  },
  115: {
    pista2: "Zagueiro holandês imponente, aéreo e tranquilo com a bola.",
    pista3: "Natural de Breda, na Holanda, cresceu no Groningen antes de se tornar o melhor zagueiro do mundo.",
    pista4: "Antes do clube atual, jogou no Southampton, na Premier League."
  },
  116: {
    pista2: "Atacante uruguaio explosivo e veloz — imprevisível.",
    pista3: "Natural de Artigas, no Uruguai, cresceu em condições humildes antes de se tornar estrela.",
    pista4: "Antes do clube atual, jogou no Benfica, na Liga Portugal."
  },
  117: {
    pista2: "Ponta técnico, assistente e goleador — coração do Arsenal.",
    pista3: "Natural de Ealing, em Londres, de pais nigerianos — escolheu jogar pela Inglaterra.",
    pista4: "Foi revelado nas categorias de base do próprio Arsenal."
  },
  118: {
    pista2: "Volante inglês de alto nível — cobre, cria e lidera.",
    pista3: "Natural de Kingston upon Thames, em Londres — cresceu nas categorias do West Ham.",
    pista4: "Antes do clube atual, jogou no West Ham United, na Premier League."
  },
  119: {
    pista2: "Meia norueguês técnico e capitão — criativo e decisivo.",
    pista3: "Natural de Drammen, na Noruega, foi revelado pelo Real Madrid como maior talento europeu.",
    pista4: "Antes do clube atual, jogou na Real Sociedad, na La Liga."
  },
  120: {
    pista2: "Centroavante artilheiro — técnico, inteligente e decisivo.",
    pista3: "Natural de Walthamstow, em Londres, cresceu nas categorias do Tottenham Hotspur.",
    pista4: "Antes do clube atual, jogou no Tottenham, na Premier League."
  },
  121: {
    pista2: "Meia-atacante alemão genial — dribla, cria e decide sozinho.",
    pista3: "Nasceu em Stuttgart, na Alemanha, mas se criou em Bath, na Inglaterra — escolheu a Alemanha.",
    pista4: "Foi revelado nas categorias de base do próprio Bayern Munich."
  },
  122: {
    pista2: "Ponta explosivo e técnico, com drible e chute potente.",
    pista3: "Nasceu em Manchester, na Inglaterra, de família francesa e nigeriana — escolheu defender a França.",
    pista4: "Antes do clube atual, jogou no Crystal Palace, na Premier League."
  },
  123: {
    pista2: "Ponta veloz, imprevisível e técnico — dribla o mundo.",
    pista3: "Natural de Vernon, na França, filho de pai senegalês e mãe guineense.",
    pista4: "Antes do clube atual, jogou no Barcelona, na La Liga."
  },
  124: {
    pista2: "Meia de posse e passe — domina o jogo pelo chão no PSG.",
    pista3: "Natural do Porto, em Portugal, cresceu nas categorias de base do próprio FC Porto.",
    pista4: "Antes do clube atual, jogou no FC Porto, na Liga Portugal."
  },
  125: {
    pista2: "Zagueiro brasileiro líder e capitão — técnico e elegante.",
    pista3: "Nasceu em São Paulo e foi revelado nas categorias de base do Corinthians ainda adolescente.",
    pista4: "Antes do clube atual, jogou na Roma, na Serie A."
  },
  126: {
    pista2: "Centroavante argentino técnico — gol nos dois pés.",
    pista3: "Natural de Bahía Blanca, na Argentina, cresceu no Racing Club antes de ir à Itália.",
    pista4: "Antes do clube atual, jogou no Racing Club, na Liga Profesional."
  },
  127: {
    pista2: "Volante italiano completo — cobre, cria e decide.",
    pista3: "Natural de Cagliari, na Sardenha, na Itália, cresceu no clube da cidade antes de ir à Inter.",
    pista4: "Antes da Inter de Milão, jogou no Cagliari, na Serie A."
  },
  128: {
    pista2: "Centroavante francês físico e veloz — técnico também.",
    pista3: "Natural de Parma, na Itália, filho do ex-jogador Lilian Thuram — futebol no DNA.",
    pista4: "Antes do clube atual, jogou no Borussia Mönchengladbach, na Bundesliga."
  },
  129: {
    pista2: "Meia-atacante inglês clínico — dribla e decide friamente.",
    pista3: "Natural de Wythenshawe, em Manchester, cresceu nas categorias do Manchester City.",
    pista4: "Antes do clube atual, jogou no Manchester City, na Premier League."
  },
  130: {
    pista2: "Volante argentino campeão do mundo — físico e decisivo.",
    pista3: "Natural de San Martín, em Buenos Aires, na Argentina, foi revelado no River Plate.",
    pista4: "Antes do clube atual, jogou no Benfica, na Liga Portugal."
  },
  131: {
    pista2: "Centroavante senegalês artilheiro — veloz e eficiente.",
    pista3: "Natural de Ziguinchor, no Senegal, cresceu no futebol espanhol antes de ir ao Chelsea.",
    pista4: "Antes do clube atual, jogou no Villarreal, na La Liga."
  },
  132: {
    pista2: "Ponta argentino explosivo, veloz e com drible de alto nível.",
    pista3: "Nasceu em Madri, na Espanha, de pai argentino — escolheu defender a Argentina.",
    pista4: "Foi revelado nas categorias de base do próprio Manchester United."
  },
  133: {
    pista2: "Meia decisivo — passe, gol e liderança nas grandes partidas.",
    pista3: "Natural de Maia, em Portugal, cresceu nas categorias de base do Sporting CP.",
    pista4: "Antes do clube atual, jogou no Sporting CP, na Liga Portugal."
  },
  134: {
    pista2: "Centroavante dinamarquês jovem, veloz e com faro de gol.",
    pista3: "Natural de Copenhague, na Dinamarca, cresceu nas categorias do Copenhague antes de ir à Europa.",
    pista4: "Antes do clube atual, jogou na Atalanta, na Serie A."
  },
  135: {
    pista2: "Centroavante sérvio potente — chute forte, gol nos dois pés.",
    pista3: "Natural de Belgrado, na Sérvia, foi revelado pelo Partizan antes de se destacar na Fiorentina.",
    pista4: "Antes da Juventus, jogou na Fiorentina, na Serie A."
  },
  136: {
    pista2: "Jovem turco técnico — herdeiro da camisa 10 da Juventus.",
    pista3: "Natural de Regensburg, na Alemanha, de família turca — escolheu defender a Turquia.",
    pista4: "Foi revelado nas categorias de base da própria Juventus."
  },
  137: {
    pista2: "Ponta português veloz e técnico — filho de campeão.",
    pista3: "Nasceu no Porto, em Portugal, filho do técnico Sérgio Conceição — futebol no sangue.",
    pista4: "Antes da Juventus, jogou no FC Porto, na Liga Portugal."
  },
  138: {
    pista2: "Atacante francês completo — gol, drible e criação em um só.",
    pista3: "Natural de Mâcon, na França, foi revelado pelo Real Sociedad ainda jovem antes de virar estrela.",
    pista4: "Antes do clube atual, jogou no Barcelona, na La Liga."
  },
  139: {
    pista2: "Atacante argentino campeão do mundo — velocidade e gol.",
    pista3: "Natural de Calchín, na Argentina, cresceu no River Plate antes de ser campeão do mundo.",
    pista4: "Antes do clube atual, jogou no Manchester City, na Premier League."
  },
  140: {
    pista2: "Goleiro esloveno — eleito o melhor do mundo por cinco anos.",
    pista3: "Natural de Škofja Loka, na Eslovênia, cresceu no Koper antes de ir ao Benfica e depois ao Atlético.",
    pista4: "Antes do clube atual, jogou no Sporting CP, na Liga Portugal."
  },
  141: {
    pista2: "Jovem meia-atacante alemão genial — dribla, cria e decide.",
    pista3: "Natural de Pulheim, na Alemanha, cresceu nas categorias de base do Bayer Leverkusen.",
    pista4: "Foi revelado nas categorias de base do próprio Bayer Leverkusen."
  },
  142: {
    pista2: "Volante suíço de liderança — cobre e distribui com classe.",
    pista3: "Natural de Basileia, na Suíça, de família albanesa — cresceu no Basel antes de ir à Europa.",
    pista4: "Antes do clube atual, jogou no Arsenal, na Premier League."
  },
  143: {
    pista2: "Centroavante nigeriano potente e veloz — artilheiro.",
    pista3: "Natural de Lagos, na Nigéria, cresceu no futebol nigeriano antes de ir à Bélgica.",
    pista4: "Antes do Leverkusen, jogou no Union Saint-Gilloise, na Pro League."
  },
  144: {
    pista2: "Ponta português ágil, veloz e imprevisível no drible.",
    pista3: "Natural de Almada, em Portugal, cresceu no Sporting CP antes de ir ao Lille na França.",
    pista4: "Antes do clube atual, jogou no Lille, na Ligue 1."
  },
  145: {
    pista2: "Lateral-esquerdo muito ofensivo — parece um atacante.",
    pista3: "Natural de Marseille, na França, irmão de Lucas Hernández — futebol no DNA familiar.",
    pista4: "Antes do clube atual, jogou na Real Sociedad, na La Liga."
  },
  146: {
    pista2: "Goleiro francês reflexivo — o 'Magic Mike' do Milan.",
    pista3: "Natural de Cayena, na Guiana Francesa, cresceu em Paris antes de se revelar no Lille.",
    pista4: "Antes do clube atual, jogou no Lille, na Ligue 1."
  },
  147: {
    pista2: "Ponta sul-coreano veloz e artilheiro — gols dos dois lados.",
    pista3: "Natural de Chuncheon, na Coreia do Sul, cresceu jogando futebol desde jovem com o pai.",
    pista4: "Antes do clube atual, jogou no Bayer Leverkusen, na Bundesliga."
  },
  148: {
    pista2: "Atacante raçudo, de pressão alta e gols espetaculares.",
    pista3: "Natural de Nova Venécia, no Espírito Santo, cresceu no América-MG antes de brilhar na Europa.",
    pista4: "Antes do clube atual, jogou no Everton, na Premier League."
  },
  149: {
    pista2: "Meia criativo — passe, falta e criação de jogadas.",
    pista3: "Natural de Coventry, na Inglaterra, cresceu no Coventry City antes de se revelar.",
    pista4: "Antes do clube atual, jogou no Leicester City, na Premier League."
  },
  150: {
    pista2: "Centroavante artilheiro — 28 gols em uma única temporada.",
    pista3: "Natural de Arles, na França, de origem guineense, cresceu no futebol francês antes da Alemanha.",
    pista4: "Antes do clube atual, jogou no Stuttgart, na Bundesliga."
  },
  151: {
    pista2: "Ponta inglês explosivo, veloz e imprevisível no drible.",
    pista3: "Natural de Bristol, na Inglaterra, cresceu nas categorias do Manchester City antes do Dortmund.",
    pista4: "Foi revelado nas categorias de base do próprio Borussia Dortmund."
  },
  152: {
    pista2: "Ponta alemão rapidíssimo — um dos mais velozes da Europa.",
    pista3: "Natural de Munique, na Alemanha, de origem nigeriana, cresceu no Red Bull Salzburg.",
    pista4: "Antes do clube atual, jogou no Red Bull Salzburg, na Bundesliga Austríaca."
  },
  153: {
    pista2: "Ponta georgiano imprevisível — dribla e decide sozinho.",
    pista3: "Natural de Tbilisi, na Geórgia, cresceu no Dinamo Tbilisi antes de se revelar no Nápoles.",
    pista4: "Antes do clube atual, jogou no Napoli, na Serie A."
  },
  154: {
    pista2: "Lateral-direito italiano capitão — consistente e líder.",
    pista3: "Natural de Viareggio, na Toscana, na Itália, cresceu no futebol italiano antes do Napoli.",
    pista4: "Antes do clube atual, jogou no Empoli, na Serie A."
  },
  155: {
    pista2: "O Galinho de Quintino — técnica, gol e coração flamenguista.",
    pista3: "Nasceu no bairro de Quintino, no Rio de Janeiro, e dedicou sua vida ao Flamengo desde criança.",
    pista4: "Foi revelado nas categorias de base do próprio Flamengo, onde jogou a maior parte da carreira."
  },
  156: {
    pista2: "Lateral-esquerdo com chute de canhão e velocidade de ponta.",
    pista3: "Natural de Garça, em São Paulo, foi revelado pelo União São João antes de brilhar no Brasil.",
    pista4: "Antes do Real Madrid, jogou na Inter de Milão, na Serie A."
  },
  157: {
    pista2: "Lateral com motor infatigável — corria o jogo inteiro.",
    pista3: "Natural de Itaquera, em São Paulo, foi revelado pelo São Paulo FC antes de virar lenda.",
    pista4: "Foi revelado nas categorias de base do próprio São Paulo."
  },
  158: {
    pista2: "Atacante técnico e artilheiro — parceiro eterno de Romário.",
    pista3: "Natural de Vitória da Conquista, na Bahia, cresceu no futebol baiano antes de virar estrela.",
    pista4: "Antes do Flamengo, jogou no Deportivo La Coruña, na La Liga."
  },
  159: {
    pista2: "Meia-atacante de dois pés perfeitos e Bola de Ouro.",
    pista3: "Natural de Paulista, em Pernambuco — nordestino que virou estrela mundial no futebol.",
    pista4: "Antes do Barcelona, jogou no Deportivo La Coruña, na La Liga."
  },
  160: {
    pista2: "O Anjo das Pernas Tortas — dribla impossível.",
    pista3: "Natural de Pau Grande, no Rio de Janeiro, cresceu jogando bola descalço nas ruas antes de ser descoberto.",
    pista4: "Foi revelado nas categorias de base do próprio Botafogo."
  },
  161: {
    pista2: "Atacante veloz, técnico e artilheiro eterno do Arsenal.",
    pista3: "Natural de Les Ulis, na França, de família de origem antilhana — futebol como saída e destino.",
    pista4: "Antes do Arsenal, jogou na Juventus, na Serie A."
  },
  162: {
    pista2: "Zagueiro elegante e eterno — 25 anos com apenas um clube.",
    pista3: "Natural de Milão, na Itália, filho do ex-goleiro César Maldini — futebol no sangue.",
    pista4: "Foi revelado nas categorias de base do próprio AC Milan."
  },
  163: {
    pista2: "Meia-atacante elegante com rabo de cavalo e Bola de Ouro.",
    pista3: "Natural de Caldogno, em Vicenza, na Itália, foi revelado no Lanerossi Vicenza ainda jovem.",
    pista4: "Antes da Juventus, jogou na Fiorentina, na Serie A."
  },
  164: {
    pista2: "Atacante africano veloz, artilheiro em dois países.",
    pista3: "Natural de Nkon, nos Camarões, cresceu com o sonho de jogar na Europa desde criança.",
    pista4: "Antes do Barcelona, jogou no Real Mallorca, na La Liga."
  },
  165: {
    pista2: "O Kaiser — zagueiro que atacava e defendia sozinho.",
    pista3: "Natural de Munique, na Alemanha, cresceu nas categorias de base do próprio Bayern Munich.",
    pista4: "Foi revelado nas categorias de base do próprio Bayern Munich."
  },
  166: {
    pista2: "Centroavante físico e de gols decisivos nos momentos certos.",
    pista3: "Natural de Abidjan, na Costa do Marfim, cresceu em parte na França antes de se revelar.",
    pista4: "Antes do Chelsea, jogou no Olympique de Marseille, na Ligue 1."
  },
  167: {
    pista2: "Zagueiro brasileiro forte e veloz, guerreiro do Real Madrid.",
    pista3: "Natural de São Carlos, em São Paulo, foi revelado pelo São Paulo FC antes de ir à Europa.",
    pista4: "Antes do clube atual, jogou no FC Porto, na Liga Portugal."
  },
  168: {
    pista2: "Volante de corte e liderança, tricampeão da Champions.",
    pista3: "Natural de São José dos Campos, em São Paulo, foi revelado pelo São Paulo FC ainda jovem.",
    pista4: "Antes do clube atual, jogou no Real Madrid, na La Liga."
  }
}

// ── Validação de comprimento de pista2 ──────────────────────────
let erros = 0
for (const [id, p] of Object.entries(PISTAS)) {
  if (p.pista2 && p.pista2.length > 60) {
    console.error(`❌ ID ${id} pista2 com ${p.pista2.length} chars (máx 60): "${p.pista2}"`)
    erros++
  }
}
if (erros > 0) {
  console.error(`\n${erros} pistas2 excedem 60 chars. Corrija antes de continuar.`)
  process.exit(1)
}

// ── Leitura do JSON ──────────────────────────────────────────────
const jogadores = JSON.parse(fs.readFileSync(JOGADORES_PATH, 'utf8'))

let adicionados = 0
let ignorados = 0

for (const jogador of jogadores) {
  const p = PISTAS[jogador.id]
  if (!p) continue

  let mudou = false

  if (p.pista2 && jogador.pista2 === undefined) {
    jogador.pista2 = p.pista2
    mudou = true
  }
  if (p.pista3 && jogador.pista3 === undefined) {
    jogador.pista3 = p.pista3
    mudou = true
  }
  if (p.pista4 && jogador.pista4 === undefined) {
    jogador.pista4 = p.pista4
    mudou = true
  }

  if (mudou) adicionados++
  else ignorados++
}

// ── Gravação ─────────────────────────────────────────────────────
fs.writeFileSync(JOGADORES_PATH, JSON.stringify(jogadores, null, 2), 'utf8')

// ── Relatório ────────────────────────────────────────────────────
const comPista2 = jogadores.filter(j => j.pista2).length
const comPista3 = jogadores.filter(j => j.pista3).length
const comPista4 = jogadores.filter(j => j.pista4).length

console.log(`\n✅ Pistas adicionadas com sucesso!`)
console.log(`   Jogadores atualizados : ${adicionados}`)
console.log(`   Já tinham pistas       : ${ignorados}`)
console.log(`\n   Total : ${jogadores.length}`)
console.log(`   com pista2 : ${comPista2}`)
console.log(`   com pista3 : ${comPista3}`)
console.log(`   com pista4 : ${comPista4}`)

// Verifica se algum pista2 ficou > 60 chars no JSON final
const violacoes = jogadores.filter(j => j.pista2 && j.pista2.length > 60)
if (violacoes.length > 0) {
  console.error(`\n⚠️  ${violacoes.length} jogador(es) com pista2 > 60 chars:`)
  violacoes.forEach(j => console.error(`   ID ${j.id} (${j.nome}): ${j.pista2.length} chars`))
} else {
  console.log(`\n✅ Todas as pista2 ≤ 60 chars — regra respeitada.`)
}
