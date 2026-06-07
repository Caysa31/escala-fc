// Lógica central do jogo COBRA da Copa — Quem é o Craque?

import jogadoresData from '@/data/jogadores.json'
import { Jogador, PONTOS_BASE, TIPO_PISTAS, TipoPista } from './types'

const jogadores = jogadoresData as Jogador[]

// ── Pools por dificuldade — Copa do Mundo 2026 ────────────────────────────
// 5 desafios por dia:
//   Slot 0 — Fácil    (craque mundialmente famoso)
//   Slot 1 — Fácil    (outro craque muito conhecido)
//   Slot 2 — Médio    (jogador bem conhecido do futebol europeu)
//   Slot 3 — Médio    (jogador de seleção forte, menos famoso)
//   Slot 4 — Difícil  (jogador menos midiático)
// Cada pool tem rotação independente → todos aparecem ao longo das semanas.

const NUM_DESAFIOS = 5

const poolFacil  = jogadores.filter(j => j.dificuldade === 'facil')
const poolMedio  = jogadores.filter(j => j.dificuldade === 'medio')
const poolDificil = jogadores.filter(j => j.dificuldade === 'dificil')

/**
 * Retorna o jogador correto para um rodadaId específico.
 * Usa a mesma lógica de pools por dificuldade de getJogadoresDoDia().
 * Retorna null se rodadaId for inválido.
 */
export function getJogadorPorRodadaId(rodadaId: number): Jogador | null {
  if (!Number.isFinite(rodadaId) || rodadaId < 1) return null

  const diffDias  = Math.floor((rodadaId - 1) / NUM_DESAFIOS)
  const slotIndex = (rodadaId - 1) % NUM_DESAFIOS

  const iF0 = diffDias % poolFacil.length
  const iF1 = (diffDias + Math.floor(poolFacil.length / 2)) % poolFacil.length
  const iM0 = diffDias % poolMedio.length
  const iM1 = (diffDias + Math.floor(poolMedio.length / 2)) % poolMedio.length
  const iD  = diffDias % poolDificil.length

  const slots = [
    poolFacil[iF0],
    poolFacil[iF1],
    poolMedio[iM0],
    poolMedio[iM1],
    poolDificil[iD],
  ]

  return slots[slotIndex] ?? null
}

/** 5 jogadores do dia — Copa 2026, mesmo para todos os usuários.
 *  Passa diaOverride (ex: via ?preview=N) para testar dias diferentes. */
export function getJogadoresDoDia(diaOverride?: number): Array<{ jogador: Jogador; rodadaId: number }> {
  const hoje = new Date()
  const inicio = new Date('2026-06-01')
  const diffDias = diaOverride ?? Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))

  const iF0 = diffDias % poolFacil.length
  const iF1 = (diffDias + Math.floor(poolFacil.length / 2)) % poolFacil.length
  const iM0 = diffDias % poolMedio.length
  const iM1 = (diffDias + Math.floor(poolMedio.length / 2)) % poolMedio.length
  const iD  = diffDias % poolDificil.length

  const slots = [
    poolFacil[iF0],   // Slot 0 — Fácil
    poolFacil[iF1],   // Slot 1 — Fácil
    poolMedio[iM0],   // Slot 2 — Médio
    poolMedio[iM1],   // Slot 3 — Médio
    poolDificil[iD],  // Slot 4 — Difícil
  ]

  return slots.map((jogador, i) => ({
    jogador,
    rodadaId: diffDias * NUM_DESAFIOS + i + 1,
  }))
}

/**
 * Gera o parágrafo de introdução narrativa do jogador — versão Copa 2026.
 * Inclui bandeira, seleção e nível do jogador. Curto e direto.
 */
export function getIntroNarrativa(jogador: Jogador): string {
  const bandeira = jogador.bandeira ?? ''
  const nac = jogador.nacionalidade ?? ''
  const clube = jogador.clube ?? ''
  // Intro usa o clube como gancho específico do jogador — curto e único
  return `${bandeira} ${nac} na Copa 2026. Joga pelo ${clube}. Você sabe quem é?`
}

/**
 * Retorna as 6 pistas de texto de um jogador — escritas como frases narrativas.
 * Progressão: pista 1 é a mais difícil, pista 6 é a mais fácil.
 */
export function getPistasTexto(jogador: Jogador): Record<number, string> {
  // Pista 1 — Posição em campo (com narrativa por liga)
  const ligaLabel = jogador.liga === 'Brasileirão' ? 'Brasileirão Série A'
    : jogador.liga === 'Premier League' ? 'Premier League'
    : jogador.liga === 'La Liga' ? 'La Liga'
    : jogador.liga === 'Bundesliga' ? 'Bundesliga'
    : jogador.liga === 'Serie A' ? 'Serie A italiana'
    : jogador.liga === 'Ligue 1' ? 'Ligue 1'
    : jogador.liga

  // Regra: máximo 60 caracteres por frase — o sufixo do clube/liga já adiciona ~70 chars
  const posicaoFrase: Record<string, string> = {
    'Goleiro':          'Entre os postes, é intransponível — não defende, comanda',
    'Zagueiro':         'Na zaga, cada duelo é uma batalha — e raramente perde',
    'Lateral-direito':  'Pelo lado direito, ataque e defesa são a mesma missão',
    'Lateral-esquerdo': 'Pelo lado esquerdo, velocidade e ginga no corredor',
    'Volante':          'O escudo do time. Intercepta antes da jogada existir',
    'Meia':             'No coração do jogo — cada passe parece escrito antes',
    'Meia-atacante':    'Entre a criação e o gol — um espaço que poucos dominam',
    'Ponta-direita':    'Pela direita, deixa defensores no retrovisor sempre',
    'Ponta-esquerda':   'Pela esquerda, é um pesadelo que se repete sempre',
    'Atacante':         'Vive para fazer a bola entrar. Cada chance, uma ameaça',
    'Centroavante':     'Na área, é a referência que toda zaga teme',
    'Ponta':            'Pelos flancos, carrega a bola como se fosse sua',
    'Lateral':          'No corredor, sobe como atacante e volta como defensor',
  }
  const posicaoTexto = posicaoFrase[jogador.posicao] ?? `Atua como ${jogador.posicao}`

  // Se tiver estado do clube, inclui na pista. Senão, só liga.
  const pista1 = jogador.estadoClube
    ? `${posicaoTexto} — atuando por um clube do ${jogador.estadoClube}, na ${ligaLabel}.`
    : `${posicaoTexto} — e faz isso pela ${ligaLabel}.`

  // Pista 2 — Blocos com letras reveladas por palavra (independentemente)
  // Opção B: 1-2 letras→0 reveals, 3-5→1, 6-8→2, 9+→3 (por palavra)
  // NUNCA posições 0 e 1 de nenhuma palavra
  // Formato: palavras separadas por "|", cada palavra = string de letras e "_"
  const _getNumReveals2 = (len: number) =>
    len <= 2 ? 0 : len <= 5 ? 1 : len <= 8 ? 2 : 3
  const _getPosicoes2 = (len: number): number[] => {
    const k = _getNumReveals2(len)
    if (k === 0) return []
    const posicoes: number[] = []
    for (let j = 1; j <= k; j++) {
      const pos = Math.max(2, Math.floor(len * j / (k + 1)))
      if (!posicoes.includes(pos)) posicoes.push(pos)
    }
    return posicoes
  }
  const _palavras2 = jogador.nome.trim().split(/\s+/)
  const pista2 = _palavras2.map(palavra => {
    const posicoes = _getPosicoes2(palavra.length)
    return palavra.split('').map((letra, ci) =>
      posicoes.includes(ci) ? letra : '_'
    ).join('')
  }).join('|')

  // Pista 3 — O Segredo: curiosidade única, com nome do jogador ocultado
  const curiosidade = jogador.curiosidade ?? ''
  const ocultarNome = (texto: string): string => {
    if (!texto) return texto
    // Substitui nome completo → "este craque"
    const partes = jogador.nome.trim().split(/\s+/)
    let resultado = texto
    resultado = resultado.replace(
      new RegExp(jogador.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      'este craque'
    )
    // Substitui partes isoladas com > 3 letras → remove (sem ???)
    partes.forEach(parte => {
      if (parte.length > 3) {
        resultado = resultado.replace(
          new RegExp('\\b' + parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'),
          ''
        )
      }
    })
    // Limpa espaços duplos e vírgulas órfãs após remoções
    resultado = resultado.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.').trim()
    return resultado
  }

  // Limitar texto: máx 2 frases OU 160 chars — o que vier primeiro
  const limitar3Frases = (texto: string): string => {
    const frases = texto.match(/[^.!?]+[.!?]+/g) ?? [texto]
    let resultado = ''
    for (let i = 0; i < Math.min(2, frases.length); i++) {
      const candidato = (resultado + ' ' + frases[i]).trim()
      if (candidato.length > 160) break
      resultado = candidato
    }
    return resultado.trim() || frases[0]?.slice(0, 160) || texto.slice(0, 160)
  }

  const curiosidadeOculta = limitar3Frases(ocultarNome(curiosidade))
  const pista3 = curiosidadeOculta
    ? (curiosidadeOculta.endsWith('.') || curiosidadeOculta.endsWith('!') ? curiosidadeOculta : `${curiosidadeOculta}.`)
    : `Representa ${jogador.nacionalidade} na Copa 2026.`

  // Pista 4 (Copa 2026) — ELIMINADA. Estrutura final: Nome → Estilo → Segredo → Clube+Nome
  // Pista 4 agora é Clube + Nome

  const letrasReveladas = jogador.nome.trim().split(/\s+/).map(palavra =>
    palavra.split('').map((letra, i) => {
      if (i === 0 || i === 2 || (i === 4 && palavra.length > 5)) return letra
      return '_'
    }).join(' ')
  ).join('   ')
  const pista4 = `${jogador.clube}|${letrasReveladas}`

  // Copa 2026: 4 pistas — Nome, Estilo, Segredo, Clube+Nome
  const estiloTexto = jogador.pista2 ?? pista1
  return {
    1: pista2,
    2: limitar3Frases(estiloTexto),
    3: pista3,
    4: pista4,
  }
}

/** Tipo de cada pista — todas texto */
export function getTipoPista(numero: number): TipoPista {
  return TIPO_PISTAS[numero] ?? 'texto'
}

/** Normaliza nome para comparação */
export function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Verifica se o palpite está correto (com apelidos) */
export function verificarPalpite(palpite: string, jogador: Jogador): boolean {
  const p = normalizarNome(palpite)
  const n = normalizarNome(jogador.nome)
  if (p === n) return true

  const apelidos: Record<string, string[]> = {
    'vinicius jr':        ['vini jr', 'vinicius junior', 'vini junior', 'vinicius'],
    'cristiano ronaldo':  ['cr7', 'ronaldo cr7'],
    'lionel messi':       ['messi', 'leo messi'],
    'ronaldo fenomeno':   ['fenomeno', 'o fenomeno', 'ronaldo r9', 'r9'],
    'ronaldinho gaucho':  ['ronaldinho', 'r10', 'gaucho'],
    'neymar':             ['neymar jr', 'ney'],
    'gabigol':            ['gabriel barbosa', 'gabriel'],
    'kylian mbappe':      ['mbappe'],
    'erling haaland':     ['haaland'],
    'arrascaeta':         ['giorgian de arrascaeta', 'giorgian'],
    'pedro':              ['pedro guilherme'],
    'calleri':            ['jonathan calleri'],
    'flaco lopez':        ['flaco', 'jose juanmi'],
    'pele':               ['edson arantes', 'rei pele', 'o rei'],
  }

  const key = Object.keys(apelidos).find(k => n.includes(k))
  if (key && apelidos[key].some(a => p === normalizarNome(a))) return true

  return false
}

/** Pontos base pela pista de acerto */
export function calcularPontos(pistaAcerto: number): number {
  return PONTOS_BASE[pistaAcerto] ?? 0
}

/** Busca jogadores para autocomplete */
export function buscarJogadores(termo: string): Jogador[] {
  if (!termo || termo.length < 2) return []
  const t = normalizarNome(termo)
  const resultados = jogadores.filter(j => normalizarNome(j.nome).includes(t))

  // Ordena por relevância: nomes que começam com o termo aparecem antes dos que só contêm
  resultados.sort((a, b) => {
    const nA = normalizarNome(a.nome)
    const nB = normalizarNome(b.nome)
    const aStart = nA.startsWith(t)
    const bStart = nB.startsWith(t)
    if (aStart && !bStart) return -1
    if (!aStart && bStart) return 1
    return 0
  })

  return resultados.slice(0, 8)
}

/** Gera grade de emojis para compartilhar */
export function gerarGradeEmojis(tentativas: { status: string }[]): string {
  return tentativas.map(t => t.status === 'acerto' ? '🟩' : '⬛').join('')
}

/** Texto completo para compartilhar */
export function gerarTextoCompartilhar(
  rodadaId: number,
  pistaAcerto: number | null,
  tentativas: { status: string }[]
): string {
  const grade = gerarGradeEmojis(tentativas)
  // IMPORTANTE: pistaAcerto pode ser 0 (histórico) — usar !== null, nunca truthy check
  const resultado = pistaAcerto !== null
    ? (pistaAcerto === 0 ? 'Acertei pelo histórico! 🎯' : `Acertei em ${pistaAcerto} pista${pistaAcerto > 1 ? 's' : ''} 🎯`)
    : 'Não acertei hoje 😬'

  return `⚽ COBRA da Copa — Quem é o Craque? #${rodadaId}\n${resultado}\n\n${grade}\n\ncobra-copa.vercel.app`
}
