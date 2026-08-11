// Gerador dinâmico de questões para os Modos Extras (Quem Não Pertence / Elimine 1 dos 4)

import { Jogador } from './types'
import jogadoresData from '@/data/jogadores.json'

const todos = jogadoresData as Jogador[]
const ativos = todos.filter(j => !j.lenda)

export type TipoModo = 'quem-nao-pertence' | 'elimine-1'

export interface Questao {
  tipo: TipoModo
  jogadores: Jogador[]
  intrusoId: number
  categoriaId: string
  /** Texto exibido no header do Elimine ("Jogadores do Flamengo") */
  categoriaLabel: string
  /** Pergunta contextual — varia a cada geração */
  questaoTexto: string
  /** Revelado após resposta */
  explicacao: string
  /** 1=fácil, 2=médio, 3=difícil */
  dificuldade: number
  /** Se true, o nome do clube NÃO aparece no card (evita entregar a resposta) */
  esconderClube: boolean
}

// ── Utilitários ───────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

function one(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const item of arr) {
    const k = key(item)
    if (!m.has(k)) m.set(k, [])
    m.get(k)!.push(item)
  }
  return m
}

function nome(j: Jogador) { return j.nome }

function prefixoLiga(liga: string): string {
  const usarNo = ['Brasileirão', 'La Liga', 'Serie A', 'Bundesliga', 'Eredivisie', 'Liga Portugal', 'Ligue 1 Uber Eats']
  return usarNo.includes(liga) ? `no ${liga}` : `na ${liga}`
}

// ── Definição de categorias ───────────────────────────────────

// Países da América do Sul (para filtro de Libertadores)
const PAISES_SA = new Set([
  'Brasileiro', 'Argentino', 'Uruguaio', 'Colombiano', 'Chileno',
  'Paraguaio', 'Boliviano', 'Equatoriano', 'Peruano', 'Venezuelano',
])

// Ligas europeias (para filtro de Champions)
const LIGAS_EU = new Set([
  'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
  'Liga Portugal', 'Primeira Liga', 'Eredivisie', 'Super Lig', 'Lenda',
])

interface CatDef {
  id: string
  dificuldade: number  // 1=fácil, 2=médio, 3=difícil
  /** Se definido, a categoria só aparece nesses modos */
  modos?: TipoModo[]
  getGroups: () => Array<{ key: string; membros: Jogador[] }>
  label: (key: string) => string
  questaoTexto: (key: string) => string
  explicacao: (key: string, tres: Jogador[], intruso: Jogador) => string
  /** Se true, o intruso deve ter a mesma nacionalidade que os 3 do grupo quando possível */
  mesmaNacionalidade?: boolean
  /** Restringe quais jogadores podem ser o intruso (plausibilidade) */
  filtroIntruso?: (j: Jogador) => boolean
  /** Se true, o nome do clube não aparece no card (categoria revelaria a resposta) */
  esconderClube?: boolean
  peso: number
}

const CATEGORIAS: CatDef[] = [

  // ── Clube atual (fácil) ──────────────────────────────────────
  {
    id: 'clube', dificuldade: 1, peso: 3, esconderClube: true,
    getGroups: () => {
      const g = groupBy(ativos, j => j.clube)
      return Array.from(g.entries()).filter(([, m]) => m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Jogadores do ${k}`,
    questaoTexto: k => one([
      `Três jogam no ${k}. Qual é o intruso?`,
      `Três vestem a camisa do ${k}. Quem não pertence?`,
      `Três deles estão no ${k}. Qual é diferente?`,
    ]),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} jogam no ${k}. ${nome(intruso)} não.`,
    mesmaNacionalidade: true,
  },

  // ── Liga (médio) ──────────────────────────────────────────────
  {
    id: 'liga', dificuldade: 2, peso: 2, esconderClube: true,
    getGroups: () => {
      const excluir = new Set(['Lenda', 'Lendas', 'Serie B', 'Liga MX'])
      const g = groupBy(ativos, j => j.liga)
      return Array.from(g.entries()).filter(([k, m]) => !excluir.has(k) && m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Jogam ${prefixoLiga(k)}`,
    questaoTexto: k => one([
      `Três jogam ${prefixoLiga(k)}. Qual está em outra liga?`,
      `Três militam ${prefixoLiga(k)}. Qual joga em campeonato diferente?`,
      `Três atuam ${prefixoLiga(k)}. Qual não é da mesma liga?`,
    ]),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} jogam ${prefixoLiga(k)}. ${nome(intruso)} não.`,
    mesmaNacionalidade: true,
  },

  // ── Nacionalidade (fácil) — só no Elimine (bandeira entrega no Quem Não Pertence)
  {
    id: 'nacionalidade', dificuldade: 1, peso: 2, modos: ['elimine-1'],
    getGroups: () => {
      const g = groupBy(todos, j => j.nacionalidade)
      return Array.from(g.entries()).filter(([, m]) => m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Seleção ${k}`,
    questaoTexto: k => one([
      `Três jogam pela Seleção ${k}. Qual representa outro país?`,
      `Três deles são ${k}s. Qual tem outra nacionalidade?`,
      `Três vestem a camisa da Seleção ${k}. Qual não é?`,
    ]),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} são da Seleção ${k}. ${nome(intruso)} não.`,
  },

  // ── Posição (médio) ───────────────────────────────────────────
  {
    id: 'posicao', dificuldade: 2, peso: 2,
    getGroups: () => {
      const norm = (p: string) => p.includes('Lateral') ? 'Lateral' : p.includes('Ponta') ? 'Ponta' : p
      const g = groupBy(todos, j => norm(j.posicao))
      return Array.from(g.entries()).filter(([, m]) => m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Posição: ${k}`,
    questaoTexto: k => {
      const mapa: Record<string, string[]> = {
        Goleiro:         ['Três deles são goleiros. Qual defende outra posição?', 'Três são camisas 1. Qual não pega no gol?', 'Três se postam entre as traves. Qual é diferente?'],
        Zagueiro:        ['Três são zagueiros de ofício. Qual tem posição diferente?', 'Três jogam na zaga. Qual não é defensor central?', 'Três marcam no miolo da defesa. Qual é o intruso?'],
        Lateral:         ['Três são laterais. Qual não cobre as beiradas do campo?', 'Três sobem e descem pela lateral. Qual tem função diferente?', 'Três jogam pelos lados da defesa. Qual é o intruso?'],
        Volante:         ['Três são volantes. Qual não faz a proteção do meio-campo?', 'Três jogam como camisa 5. Qual tem posição diferente?', 'Três são os "pitbulls" do meio. Qual é o intruso?'],
        Meia:            ['Três são meias armadores. Qual joga em outra posição?', 'Três criam jogadas pelo meio. Qual não é meia?', 'Três ditam o ritmo do jogo como meia. Qual é diferente?'],
        'Meia Atacante': ['Três são meias-atacantes. Qual joga em outra função?', 'Três jogam na meia-atacante, entre a criação e o gol. Qual é o intruso?', 'Três atuam como camisa 10. Qual não é meia-atacante?'],
        Ponta:           ['Três são pontas. Qual não joga pelas beiradas?', 'Três "rasgas" o jogo pelas laterais. Qual é diferente?', 'Três encarnam pelos flancos. Qual joga em outra posição?'],
        Atacante:        ['Três são atacantes. Qual não joga no setor de ataque?', 'Três têm missão de marcar gols. Qual é o intruso?', 'Três vivem dentro da área. Qual joga em posição diferente?'],
        'Centro Avante': ['Três são centroavantes. Qual não é o camisa 9?', 'Três fixam a zaga adversária como centroavante. Qual é diferente?', 'Três são o pivô do ataque. Qual não joga como 9?'],
      }
      const variações = mapa[k]
      return variações ? one(variações) : one([
        `Três jogam como ${k}. Qual tem posição diferente?`,
        `Três atuam como ${k}. Qual é o intruso?`,
        `Três são ${k}s. Qual não pertence ao grupo?`,
      ])
    },
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} atuam como ${k}. ${nome(intruso)} não.`,
    mesmaNacionalidade: true,
  },

  // ── Estado natal (difícil) ───────────────────────────────────
  {
    id: 'estadoNatal', dificuldade: 3, peso: 2,
    mesmaNacionalidade: true,  // intruso também deve ser brasileiro
    getGroups: () => {
      const g = groupBy(todos.filter(j => j.estadoNatal), j => j.estadoNatal!)
      return Array.from(g.entries()).filter(([, m]) => m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Nascidos em ${k}`,
    questaoTexto: k => one([
      `Três nasceram em ${k}. Qual nasceu em outro estado?`,
      `Três deles têm raízes em ${k}. Qual veio de outro lugar?`,
      `Três cruzeiros/paulistas/cariocas… nasceram em ${k}. Qual não?`,
    ]).replace('cruzeiros/paulistas/cariocas…', ''),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} nasceram em ${k}. ${nome(intruso)} não.`,
  },

  // ── Clube formador (difícil) ─────────────────────────────────
  {
    id: 'clubeBase', dificuldade: 3, peso: 2,
    getGroups: () => {
      const g = groupBy(todos.filter(j => j.clubeBase), j => j.clubeBase!)
      return Array.from(g.entries()).filter(([, m]) => m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Revelados pelo ${k}`,
    questaoTexto: k => one([
      `Três foram revelados pelo ${k}. Qual saiu de outro clube base?`,
      `Três começaram a carreira no ${k}. Qual tem outra origem?`,
      `Três saíram das categorias de base do ${k}. Qual não?`,
    ]),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} foram revelados pelo ${k}. ${nome(intruso)} veio de outro clube.`,
    mesmaNacionalidade: true,
  },

  // ── Passou pelo clube (difícil) ──────────────────────────────
  {
    id: 'clubeCarreira', dificuldade: 3, peso: 2,
    getGroups: () => {
      const m = new Map<string, Jogador[]>()
      for (const j of todos) {
        for (const c of (j.clubesCarreira ?? [])) {
          if (!m.has(c)) m.set(c, [])
          m.get(c)!.push(j)
        }
      }
      return Array.from(m.entries()).filter(([, v]) => v.length >= 4).map(([k, v]) => ({ key: k, membros: v }))
    },
    label: k => `Passaram pelo ${k}`,
    questaoTexto: k => one([
      `Três já jogaram no ${k}. Qual nunca vestiu essa camisa?`,
      `Três têm o ${k} no currículo. Qual nunca foi para lá?`,
      `Três passaram pelo ${k} na carreira. Qual nunca jogou lá?`,
    ]),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} já jogaram no ${k}. ${nome(intruso)} nunca foi.`,
    mesmaNacionalidade: true,
  },

  // ── Campeão da Champions (médio) ─────────────────────────────
  {
    id: 'champions', dificuldade: 2, peso: 1, esconderClube: true,
    // Intruso deve ser jogador de liga europeia — evita colocar brasileiro do Brasileirão
    filtroIntruso: (j: Jogador) => LIGAS_EU.has(j.liga),
    getGroups: () => {
      const c = todos.filter(j => j.titulos.some(t => {
        const lower = t.toLowerCase()
        return lower.includes('champions') && !lower.includes('vice') && !lower.includes('runner')
      }))
      return c.length >= 4 ? [{ key: 'Champions', membros: c }] : []
    },
    label: () => 'Campeões da Champions League',
    questaoTexto: () => one([
      'Três já venceram a Champions League. Qual nunca conquistou?',
      'Três são campeões da Champions. Qual ainda não levantou a taça?',
      'Três têm a Champions no currículo. Qual ainda não ganhou?',
    ]),
    explicacao: (_, tres, intruso) =>
      `${tres.map(nome).join(', ')} já ganharam a Champions. ${nome(intruso)} ainda não.`,
  },

  // ── Campeão do Mundo (médio) ──────────────────────────────────
  {
    id: 'copa_mundo_campeao', dificuldade: 2, peso: 1,
    // Intruso deve ter disputado ao menos 1 Copa — evita colocar jogador de país sem histórico
    filtroIntruso: (j: Jogador) => (j.copasDoMundo ?? 0) > 0,
    getGroups: () => {
      // Exclui vice-campeões e Sub-XX: apenas títulos reais de Copa do Mundo
      const c = todos.filter(j => j.titulos.some(t => {
        const lower = t.toLowerCase()
        return lower.includes('copa do mundo') && !t.includes('Sub') && !lower.includes('vice') && !lower.includes('runner')
      }))
      return c.length >= 4 ? [{ key: 'Copa', membros: c }] : []
    },
    label: () => 'Campeões do Mundo',
    questaoTexto: () => one([
      'Três são campeões do Mundo. Qual nunca ganhou a Copa?',
      'Três já levantaram a taça da Copa do Mundo. Qual não foi campeão?',
      'Três têm a Copa do Mundo no currículo. Qual ainda não foi campeão mundial?',
    ]),
    explicacao: (_, tres, intruso) =>
      `${tres.map(nome).join(', ')} são campeões do mundo. ${nome(intruso)} ainda não.`,
  },

  // ── Campeão da Libertadores (médio) ──────────────────────────
  {
    id: 'libertadores', dificuldade: 2, peso: 1, esconderClube: true,
    // Intruso deve ser sul-americano — evita colocar Haaland/Mbappe em pergunta de Libertadores
    filtroIntruso: (j: Jogador) => PAISES_SA.has(j.nacionalidade),
    getGroups: () => {
      const c = todos.filter(j => j.titulos.some(t => {
        const lower = t.toLowerCase()
        return lower.includes('libertadores') && !lower.includes('vice') && !lower.includes('runner')
      }))
      return c.length >= 4 ? [{ key: 'Libertadores', membros: c }] : []
    },
    label: () => 'Campeões da Libertadores',
    questaoTexto: () => one([
      'Três já levantaram a Libertadores. Qual nunca conquistou?',
      'Três são campeões da Libertadores. Qual nunca foi campeão?',
      'Três têm a Libertadores no currículo. Qual ainda não ganhou?',
    ]),
    explicacao: (_, tres, intruso) =>
      `${tres.map(nome).join(', ')} já ganharam a Libertadores. ${nome(intruso)} nunca foi campeão.`,
  },

  // ── Disputou 2+ Copas (difícil) ───────────────────────────────
  {
    id: 'copas_2mais', dificuldade: 3, peso: 1,
    getGroups: () => {
      const c = todos.filter(j => (j.copasDoMundo ?? 0) >= 2)
      return c.length >= 4 ? [{ key: '2+', membros: c }] : []
    },
    label: () => 'Jogaram 2+ Copas do Mundo',
    questaoTexto: () => one([
      'Três jogaram em 2 ou mais Copas do Mundo. Qual foi a menos?',
      'Três têm pelo menos 2 Copas no currículo. Qual participou de menos?',
      'Três disputaram múltiplas Copas do Mundo. Qual tem menos edições?',
    ]),
    explicacao: (_, tres, intruso) =>
      `${tres.map(nome).join(', ')} jogaram em 2+ Copas. ${nome(intruso)} participou de menos edições.`,
  },

  // ── Nunca foi à Copa (médio) ──────────────────────────────────
  {
    id: 'nunca_copa', dificuldade: 2, peso: 1,
    getGroups: () => {
      const c = todos.filter(j => (j.copasDoMundo ?? -1) === 0)
      return c.length >= 4 ? [{ key: 'nuncaCopa', membros: c }] : []
    },
    label: () => 'Nunca foram à Copa do Mundo',
    questaoTexto: () => one([
      'Três nunca disputaram uma Copa do Mundo. Qual dos quatro já foi?',
      'Três deles não têm Copa no currículo. Qual é diferente?',
      'Três ainda não foram a uma Copa do Mundo. Qual já disputou?',
    ]),
    explicacao: (_, tres, intruso) =>
      `${tres.map(nome).join(', ')} nunca foram a uma Copa do Mundo. ${nome(intruso)} já disputou.`,
  },

  // ── Voltou do exterior ao Brasil (difícil) ────────────────────
  {
    id: 'retorno_brasil', dificuldade: 3, peso: 1, esconderClube: true,
    getGroups: () => {
      const c = ativos.filter(j => j.liga === 'Brasileirão' && j.origemAnterior === 'exterior')
      return c.length >= 4 ? [{ key: 'retorno', membros: c }] : []
    },
    label: () => 'Voltaram ao Brasileirão',
    questaoTexto: () => one([
      'Três voltaram da Europa para jogar no Brasil. Qual nunca fez esse caminho?',
      'Três trocaram o futebol europeu pelo Brasileirão. Qual nunca retornou?',
      'Três vieram do exterior pro Brasileirão. Qual nunca foi para a Europa?',
    ]),
    explicacao: (_, tres, intruso) =>
      `${tres.map(nome).join(', ')} voltaram do futebol europeu. ${nome(intruso)} não fez esse caminho.`,
  },

  // ── Faixa etária (médio) ──────────────────────────────────────
  {
    id: 'faixa_etaria', dificuldade: 2, peso: 1,
    getGroups: () => {
      const excluir = new Set(['Lenda', ''])
      const g = groupBy(todos.filter(j => !j.lenda), j => j.faixaEtaria ?? '')
      return Array.from(g.entries()).filter(([k, m]) => !excluir.has(k) && m.length >= 4).map(([k, m]) => ({ key: k, membros: m }))
    },
    label: k => `Geração ${k}`,
    questaoTexto: k => one([
      `Três são da mesma geração — ${k} anos. Qual é de outra faixa?`,
      `Três têm entre ${k} anos. Qual é de geração diferente?`,
      `Três jogadores têm idades entre ${k}. Qual não pertence a esse grupo?`,
    ]),
    explicacao: (k, tres, intruso) =>
      `${tres.map(nome).join(', ')} têm entre ${k} anos. ${nome(intruso)} é de outra geração.`,
    mesmaNacionalidade: true,
  },
]

// ── Gerador de questão ────────────────────────────────────────

function gerarUmaQuestao(tipo: TipoModo, intrusosUsados: Set<number>): Questao | null {
  // Filtra categorias permitidas para este modo
  const pool: CatDef[] = []
  for (const cat of CATEGORIAS) {
    if (cat.modos && !cat.modos.includes(tipo)) continue
    for (let i = 0; i < cat.peso; i++) pool.push(cat)
  }
  const cat = pick(pool, 1)[0]

  const grupos = cat.getGroups()
  if (grupos.length === 0) return null

  const grupo = pick(grupos, 1)[0]
  if (grupo.membros.length < 3) return null

  const tres = pick(grupo.membros, 3)
  const idsDentro = new Set(grupo.membros.map(j => j.id))

  // Aplica filtro de plausibilidade (ex: só sul-americanos na Libertadores)
  let candidatos = todos.filter(j => !idsDentro.has(j.id))
  if (cat.filtroIntruso) {
    const plausivel = candidatos.filter(cat.filtroIntruso)
    if (plausivel.length >= 1) candidatos = plausivel
  }

  // Prefere intruso da mesma nacionalidade (menos óbvio visualmente)
  if (cat.mesmaNacionalidade) {
    const nacs = new Set(tres.map(j => j.nacionalidade))
    const mesmaNac = candidatos.filter(j => nacs.has(j.nacionalidade))
    if (mesmaNac.length >= 1) candidatos = mesmaNac
  }

  // Evita repetir o mesmo intruso de questões anteriores
  const semRepetir = candidatos.filter(j => !intrusosUsados.has(j.id))
  if (semRepetir.length >= 1) candidatos = semRepetir

  if (candidatos.length === 0) return null

  const intruso = pick(candidatos, 1)[0]
  const todos4 = shuffle([...tres, intruso])

  return {
    tipo,
    jogadores: todos4,
    intrusoId: intruso.id,
    categoriaId: cat.id,
    categoriaLabel: cat.label(grupo.key),
    questaoTexto: cat.questaoTexto(grupo.key),
    explicacao: cat.explicacao(grupo.key, tres, intruso),
    dificuldade: cat.dificuldade,
    esconderClube: cat.esconderClube ?? false,
  }
}

// ── Gera sessão com progressão de dificuldade ────────────────

export function gerarSessao(tipo: TipoModo, n = 10): Questao[] {
  const questoes: Questao[] = []
  const combinacoesUsadas = new Set<string>()
  const intrusosUsados = new Set<number>()   // evita mesmo intruso duas vezes
  let tentativas = 0

  while (questoes.length < n && tentativas < n * 30) {
    tentativas++
    const q = gerarUmaQuestao(tipo, intrusosUsados)
    if (!q) continue
    const chave = q.jogadores.map(j => j.id).sort().join('-')
    if (combinacoesUsadas.has(chave)) continue
    combinacoesUsadas.add(chave)
    intrusosUsados.add(q.intrusoId)
    questoes.push(q)
  }

  // Ordena da mais fácil para a mais difícil
  return questoes.sort((a, b) => a.dificuldade - b.dificuldade)
}
