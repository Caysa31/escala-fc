// Banco de perguntas — Só Cobra Sabe (história da Copa do Mundo)

export interface Pergunta {
  id: number
  pergunta: string
  opcoes: string[]          // sempre 4 opções
  correta: number           // índice (0-3) da opção correta
  explicacao: string        // fato extra revelado após a resposta
  categoria: 'artilheiros' | 'campeoes' | 'historia' | 'recordes' | 'lendas' | 'sedes'
  dificuldade: 'facil' | 'medio' | 'dificil'
}

export const PERGUNTAS: Pergunta[] = [
  // ── FÁCIL ──────────────────────────────────────────────────
  {
    id: 1,
    pergunta: 'Qual país é o maior campeão da história da Copa do Mundo?',
    opcoes: ['Argentina', 'Alemanha', 'Brasil', 'Itália'],
    correta: 2,
    explicacao: 'O Brasil tem 5 títulos: 1958, 1962, 1966 (não), 1970, 1994 e 2002 — único pentacampeão mundial.',
    categoria: 'campeoes',
    dificuldade: 'facil',
  },
  {
    id: 2,
    pergunta: 'Qual é o maior artilheiro da história das Copas do Mundo?',
    opcoes: ['Pelé', 'Ronaldo Fenômeno', 'Miroslav Klose', 'Gerd Müller'],
    correta: 2,
    explicacao: 'Miroslav Klose marcou 16 gols em 4 Copas (1998 a 2014), superando o recorde de Ronaldo R9 com 15.',
    categoria: 'artilheiros',
    dificuldade: 'facil',
  },
  {
    id: 3,
    pergunta: 'Em que país foi realizada a primeira Copa do Mundo da história?',
    opcoes: ['Brasil', 'Argentina', 'Uruguai', 'França'],
    correta: 2,
    explicacao: 'O Uruguai sediou e venceu a Copa de 1930. O país tinha acabado de ser campeão olímpico em 1928.',
    categoria: 'sedes',
    dificuldade: 'facil',
  },
  {
    id: 4,
    pergunta: 'Qual jogador ficou famoso pelo "gol de mão de Deus" na Copa de 1986?',
    opcoes: ['Pelé', 'Zico', 'Diego Maradona', 'Romário'],
    correta: 2,
    explicacao: 'Maradona marcou com a mão contra a Inglaterra nas quartas de 1986, depois chamou de "a mão de Deus". No mesmo jogo marcou o "Gol do Século".',
    categoria: 'lendas',
    dificuldade: 'facil',
  },
  {
    id: 5,
    pergunta: 'Quem ganhou a Copa do Mundo de 2022 no Catar?',
    opcoes: ['França', 'Brasil', 'Argentina', 'Marrocos'],
    correta: 2,
    explicacao: 'A Argentina venceu a França nos pênaltis (3x3, 4x2) numa das maiores finais da história. Messi finalmente levantou a taça.',
    categoria: 'campeoes',
    dificuldade: 'facil',
  },
  {
    id: 6,
    pergunta: 'Quantas Copas do Mundo o Brasil já ganhou?',
    opcoes: ['3', '4', '5', '6'],
    correta: 2,
    explicacao: 'Brasil: 1958 (Suécia), 1962 (Chile), 1970 (México), 1994 (EUA) e 2002 (Japão/Coreia). Único pentacampeão.',
    categoria: 'campeoes',
    dificuldade: 'facil',
  },
  {
    id: 7,
    pergunta: 'Em que Copa Pelé marcou seu primeiro gol como o jogador mais jovem a fazer isso?',
    opcoes: ['Copa de 1954', 'Copa de 1958', 'Copa de 1962', 'Copa de 1966'],
    correta: 1,
    explicacao: 'Pelé tinha apenas 17 anos e 239 dias quando marcou na Copa de 1958 na Suécia. O Brasil foi campeão pela primeira vez.',
    categoria: 'lendas',
    dificuldade: 'facil',
  },
  {
    id: 8,
    pergunta: 'Qual seleção venceu a Copa do Mundo de 2018 na Rússia?',
    opcoes: ['Croácia', 'França', 'Bélgica', 'Inglaterra'],
    correta: 1,
    explicacao: 'A França venceu a Croácia por 4x2 na final de Moscou. Kylian Mbappé, com 19 anos, foi eleito o melhor jovem do torneio.',
    categoria: 'campeoes',
    dificuldade: 'facil',
  },
  {
    id: 9,
    pergunta: 'Quem foi o artilheiro da Copa do Mundo de 2022 no Catar?',
    opcoes: ['Lionel Messi', 'Kylian Mbappé', 'Olivier Giroud', 'Julián Álvarez'],
    correta: 1,
    explicacao: 'Mbappé marcou 8 gols no Catar, incluindo um hat-trick na final contra a Argentina. Foi o artilheiro mesmo com a França sendo vice-campeã.',
    categoria: 'artilheiros',
    dificuldade: 'facil',
  },
  {
    id: 10,
    pergunta: 'Qual país sediou a Copa do Mundo de 2014?',
    opcoes: ['Argentina', 'Brasil', 'Portugal', 'Espanha'],
    correta: 1,
    explicacao: 'O Brasil sediou a Copa de 2014, a segunda no país (a primeira foi em 1950). A Alemanha foi campeã, batendo a Argentina na final.',
    categoria: 'sedes',
    dificuldade: 'facil',
  },

  // ── MÉDIO ──────────────────────────────────────────────────
  {
    id: 11,
    pergunta: 'Qual foi o placar da histórica goleada da Alemanha sobre o Brasil na Copa de 2014?',
    opcoes: ['6x0', '7x1', '5x0', '8x2'],
    correta: 1,
    explicacao: 'O "Mineirazo" aconteceu na semifinal em Belo Horizonte. A Alemanha foi campeã ao bater a Argentina 1x0 na final.',
    categoria: 'historia',
    dificuldade: 'medio',
  },
  {
    id: 12,
    pergunta: 'Em qual Copa do Mundo foi usado pela primeira vez o árbitro de vídeo (VAR)?',
    opcoes: ['Copa 2010 (África do Sul)', 'Copa 2014 (Brasil)', 'Copa 2018 (Rússia)', 'Copa 2022 (Catar)'],
    correta: 2,
    explicacao: 'O VAR estreou oficialmente na Copa de 2018 na Rússia. Antes disso, foi testado em campeonatos nacionais a partir de 2016.',
    categoria: 'historia',
    dificuldade: 'medio',
  },
  {
    id: 13,
    pergunta: 'Quantas Copas do Mundo Pelé disputou e ganhou?',
    opcoes: ['2 disputadas, 2 títulos', '3 disputadas, 2 títulos', '4 disputadas, 3 títulos', '3 disputadas, 3 títulos'],
    correta: 3,
    explicacao: 'Pelé disputou 1958, 1962 e 1970 — ganhando todas as três. Em 1966 foi eliminado precocemente, mas na lista oficial conta como 4 Copas (lesão).',
    categoria: 'lendas',
    dificuldade: 'medio',
  },
  {
    id: 14,
    pergunta: 'Qual país foi pioneiro em sediar uma Copa do Mundo fora da Europa ou Américas?',
    opcoes: ['Japão e Coreia do Sul', 'África do Sul', 'Catar', 'Austrália'],
    correta: 1,
    explicacao: 'A Copa de 2010 na África do Sul foi a primeira no continente africano. A Espanha foi campeã, vencendo a Holanda 1x0 na final.',
    categoria: 'sedes',
    dificuldade: 'medio',
  },
  {
    id: 15,
    pergunta: 'Qual é o recorde de gols marcados por um jogador em uma única Copa do Mundo?',
    opcoes: ['12 gols (Ronaldo, 2002)', '10 gols (Gerd Müller, 1970)', '13 gols (Just Fontaine, 1958)', '11 gols (Sándor Kocsis, 1954)'],
    correta: 2,
    explicacao: 'Just Fontaine marcou 13 gols em uma única Copa (1958, Suécia) — recorde que dura até hoje. O francês fez isso em apenas 6 partidas!',
    categoria: 'recordes',
    dificuldade: 'medio',
  },
  {
    id: 16,
    pergunta: 'O Brasil é o único país a participar de TODAS as edições da Copa do Mundo. Quantas foram?',
    opcoes: ['18 Copas', '20 Copas', '22 Copas', '24 Copas'],
    correta: 2,
    explicacao: 'O Brasil participou das 22 Copas realizadas até 2022, único país nessa façanha. Nenhuma outra seleção tem 100% de participação.',
    categoria: 'recordes',
    dificuldade: 'medio',
  },
  {
    id: 17,
    pergunta: 'Como ficou conhecido o episódio em que o Uruguai eliminou o Brasil na Copa de 1950?',
    opcoes: ['Tragédia do Maracanã', 'Maracanazo', 'Mineirazo', 'O dia que o futebol chorou'],
    correta: 1,
    explicacao: 'O "Maracanazo" ocorreu em 16 de julho de 1950. O Brasil precisava de empate, mas perdeu 2x1 para o Uruguai diante de 200 mil torcedores.',
    categoria: 'historia',
    dificuldade: 'medio',
  },
  {
    id: 18,
    pergunta: 'Qual foi a primeira Copa do Mundo transmitida em cores na televisão?',
    opcoes: ['Copa 1966 (Inglaterra)', 'Copa 1970 (México)', 'Copa 1974 (Alemanha)', 'Copa 1978 (Argentina)'],
    correta: 1,
    explicacao: 'A Copa de 1970 no México foi a primeira transmitida em cores. O Brasil de Pelé encantou o mundo com o futebol colorido.',
    categoria: 'historia',
    dificuldade: 'medio',
  },
  {
    id: 19,
    pergunta: 'Quantas seleções participam da Copa do Mundo de 2026?',
    opcoes: ['32', '36', '48', '40'],
    correta: 2,
    explicacao: 'A Copa 2026 marca a expansão para 48 seleções — a maior da história. É co-sediada por EUA, México e Canadá.',
    categoria: 'historia',
    dificuldade: 'medio',
  },
  {
    id: 20,
    pergunta: 'Ronaldo Fenômeno marcou quantos gols na Copa de 2002?',
    opcoes: ['6 gols', '7 gols', '8 gols', '9 gols'],
    correta: 2,
    explicacao: 'Ronaldo R9 marcou 8 gols no Japão/Coreia 2002, incluindo dois na final contra a Alemanha (2x0). Foi eleito o melhor jogador do torneio.',
    categoria: 'artilheiros',
    dificuldade: 'medio',
  },

  // ── DIFÍCIL ────────────────────────────────────────────────
  {
    id: 21,
    pergunta: 'Qual é a maior goleada da história de uma Copa do Mundo?',
    opcoes: ['Brasil 10x1 Bolívia (1950)', 'Hungria 10x1 El Salvador (1982)', 'Alemanha 8x0 Arábia Saudita (2002)', 'Jugoslávia 9x0 Zaire (1974)'],
    correta: 1,
    explicacao: 'Hungria 10x1 El Salvador em 1982 é a maior goleada. Sándor Kocsis marcou 4 gols. El Salvador voltou para casa com a cabeça erguida.',
    categoria: 'recordes',
    dificuldade: 'dificil',
  },
  {
    id: 22,
    pergunta: 'Quem foi o artilheiro da Copa de 1970, com 10 gols?',
    opcoes: ['Pelé', 'Gerd Müller', 'Jairzinho', 'Bobby Charlton'],
    correta: 1,
    explicacao: 'Gerd Müller, o "Bombardeiro da Nação", marcou 10 gols na Copa de 1970. A Alemanha foi terceira colocada. Müller também foi artilheiro em 1974.',
    categoria: 'artilheiros',
    dificuldade: 'dificil',
  },
  {
    id: 23,
    pergunta: 'Em qual Copa do Mundo a Holanda/Países Baixos perdeu sua terceira final?',
    opcoes: ['Copa 1974', 'Copa 1978', 'Copa 2010', 'Copa 2014'],
    correta: 2,
    explicacao: 'A Holanda perdeu três finais: 1974 (Alemanha), 1978 (Argentina) e 2010 (Espanha, 1x0 na prorrogação). A Copa mais difícil de ganhar que nunca ganharam.',
    categoria: 'historia',
    dificuldade: 'dificil',
  },
  {
    id: 24,
    pergunta: 'Qual foi o único jogador a vencer a Copa do Mundo como jogador E como técnico?',
    opcoes: ['Zidane', 'Didier Deschamps', 'Franz Beckenbauer', 'Mário Zagallo'],
    correta: 2,
    explicacao: 'Franz Beckenbauer ganhou a Copa de 1974 como jogador (Alemanha) e a de 1990 como técnico (também Alemanha). Zagallo fez o mesmo pelo Brasil.',
    categoria: 'lendas',
    dificuldade: 'dificil',
  },
  {
    id: 25,
    pergunta: 'A Copa de 2002 foi co-sediada por dois países. Quais?',
    opcoes: ['China e Japão', 'Japão e Coreia do Sul', 'Coreia do Sul e China', 'Coreia do Sul e Vietnã'],
    correta: 1,
    explicacao: 'A Copa de 2002 foi a primeira na Ásia, co-sediada por Japão e Coreia do Sul. O Brasil foi campeão com Ronaldo, Ronaldinho e Rivaldo.',
    categoria: 'sedes',
    dificuldade: 'dificil',
  },
  {
    id: 26,
    pergunta: 'Qual jogador ficou conhecido por marcar em todas as partidas do Brasil na Copa de 1970?',
    opcoes: ['Pelé', 'Tostão', 'Jairzinho', 'Rivellino'],
    correta: 2,
    explicacao: 'Jairzinho marcou em todos os 6 jogos do Brasil em 1970 — feito único na história das Copas. O "Furacão" fez parte do melhor Brasil de todos os tempos.',
    categoria: 'recordes',
    dificuldade: 'dificil',
  },
  {
    id: 27,
    pergunta: 'Quantas edições da Copa do Mundo a Itália venceu?',
    opcoes: ['3 títulos', '4 títulos', '5 títulos', '2 títulos'],
    correta: 1,
    explicacao: 'A Itália tem 4 títulos: 1934, 1938, 1982 e 2006. É a segunda seleção com mais títulos, ao lado da Alemanha (também com 4).',
    categoria: 'campeoes',
    dificuldade: 'dificil',
  },
  {
    id: 28,
    pergunta: 'O que é o "gol de ouro" e em qual Copa foi usado pela última vez?',
    opcoes: ['Primeiro gol da prorrogação, Copa 1998', 'Gol na prorrogação que encerra o jogo, Copa 2002', 'Gol marcado nos 90min que vale duplo, Copa 1994', 'Gol de pênalti na final, Copa 2006'],
    correta: 1,
    explicacao: 'O "golden goal" (morte súbita) encerrava o jogo assim que alguém marcava na prorrogação. Foi usado de 1998 a 2002 e depois abolido pela FIFA.',
    categoria: 'historia',
    dificuldade: 'dificil',
  },
  {
    id: 29,
    pergunta: 'Qual time foi campeão da Copa de 1994 nos EUA, vencendo nos pênaltis?',
    opcoes: ['Brasil', 'Itália', 'Brasil venceu a Itália', 'Itália venceu o Brasil'],
    correta: 2,
    explicacao: 'O Brasil venceu a Itália nos pênaltis (3x2) na final de 1994. Baggio chutou para fora na última cobrança. Roberto Carlos, Romário e Bebeto foram destaques.',
    categoria: 'campeoes',
    dificuldade: 'dificil',
  },
  {
    id: 30,
    pergunta: 'Qual país ganhou a Copa do Mundo de 2010 na África do Sul pela primeira vez na história?',
    opcoes: ['Portugal', 'Países Baixos', 'Espanha', 'Alemanha'],
    correta: 2,
    explicacao: 'A Espanha venceu a Holanda 1x0 na final com gol de Iniesta na prorrogação. Era o primeiro título espanhol, no auge do "tiki-taka" de Pep Guardiola e Vicente Del Bosque.',
    categoria: 'campeoes',
    dificuldade: 'dificil',
  },
]

/** Retorna N perguntas aleatórias sem repetição */
export function getPerguntasAleatorias(quantidade: number = 10): Pergunta[] {
  const shuffled = [...PERGUNTAS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(quantidade, PERGUNTAS.length))
}

/** Pontuação por dificuldade */
export const PONTOS_TRIVIA: Record<string, number> = {
  facil: 10,
  medio: 20,
  dificil: 35,
}
// deploy test Sat Jun  6 18:08:47 HEUA 2026
