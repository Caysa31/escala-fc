// Lógica central do jogo — COBRA DA BOLA + COBRA DA COPA

import jogadoresBolaData from '@/data/jogadores.json'
import jogadoresCopaData from '@/data/jogadores-copa.json'
import { Jogador, PONTOS_BASE, TIPO_PISTAS, TipoPista } from './types'
import { GameMode } from './gameMode'

const jogadoresBola = jogadoresBolaData as Jogador[]
const jogadoresCopa = jogadoresCopaData as Jogador[]

const NUM_DESAFIOS = 5

// ── POOLS BOLA (por posição) ──────────────────────────────────
const POSICOES_ATAQUE = new Set([
  'Atacante', 'Centroavante', 'Ponta-direita', 'Ponta-esquerda', 'Ponta', 'Meia-atacante',
])
const POSICOES_MEIO   = new Set(['Meia', 'Volante'])
const POSICOES_DEFESA = new Set(['Zagueiro', 'Lateral-direito', 'Lateral-esquerdo', 'Lateral', 'Goleiro'])

const poolBolaAtaque = jogadoresBola.filter(j => POSICOES_ATAQUE.has(j.posicao))
const poolBolaMeio   = jogadoresBola.filter(j => POSICOES_MEIO.has(j.posicao))
const poolBolaDefesa = jogadoresBola.filter(j => POSICOES_DEFESA.has(j.posicao))

// ── POOLS COPA (por dificuldade — sem difícil no diário) ──────
const poolCopaFacil  = jogadoresCopa.filter(j => j.dificuldade === 'facil')
const poolCopaMedio  = jogadoresCopa.filter(j => j.dificuldade === 'medio')

/** Retorna o jogador correto para um rodadaId específico */
export function getJogadorPorRodadaId(rodadaId: number, mode: GameMode = 'bola'): Jogador | null {
  if (!Number.isFinite(rodadaId) || rodadaId < 1) return null
  const diffDias  = Math.floor((rodadaId - 1) / NUM_DESAFIOS)
  const slotIndex = (rodadaId - 1) % NUM_DESAFIOS
  return getSlots(diffDias, mode)[slotIndex] ?? null
}

function getSlots(diffDias: number, mode: GameMode): Jogador[] {
  if (mode === 'copa') {
    const iF0 = diffDias % poolCopaFacil.length
    const iF1 = (diffDias + Math.floor(poolCopaFacil.length / 2)) % poolCopaFacil.length
    const iM0 = diffDias % poolCopaMedio.length
    const iM1 = (diffDias + Math.floor(poolCopaMedio.length / 2)) % poolCopaMedio.length
    const iM2 = (diffDias + Math.floor(poolCopaMedio.length / 3)) % poolCopaMedio.length
    return [poolCopaFacil[iF0], poolCopaFacil[iF1], poolCopaMedio[iM0], poolCopaMedio[iM1], poolCopaMedio[iM2]]
  }
  // Bola: 2 ATQ + 2 MEI + 1 DEF
  const iAtq0  = diffDias % poolBolaAtaque.length
  const iAtq1  = (diffDias + Math.floor(poolBolaAtaque.length / 2)) % poolBolaAtaque.length
  const iMeio0 = diffDias % poolBolaMeio.length
  const iMeio1 = (diffDias + Math.floor(poolBolaMeio.length / 2)) % poolBolaMeio.length
  const iDef   = Math.floor(diffDias / 2) % poolBolaDefesa.length
  return [poolBolaAtaque[iAtq0], poolBolaAtaque[iAtq1], poolBolaMeio[iMeio0], poolBolaMeio[iMeio1], poolBolaDefesa[iDef]]
}

/** 5 jogadores do dia — modo determinado pelo GameMode */
export function getJogadoresDoDia(mode: GameMode = 'bola', diaOverride?: number): Array<{ jogador: Jogador; rodadaId: number }> {
  const startDate = mode === 'copa' ? '2026-06-01' : '2026-05-22'
  const hoje = new Date()
  const inicio = new Date(startDate)
  const diffDias = diaOverride ?? Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))

  return getSlots(diffDias, mode).map((jogador, i) => ({
    jogador,
    rodadaId: diffDias * NUM_DESAFIOS + i + 1,
  }))
}

/**
 * Gera o parágrafo de introdução narrativa do jogador do dia.
 * Aparece antes das pistas — serve de gancho dramático.
 */
export function getIntroNarrativa(jogador: Jogador): string {
  const ligaLabel = jogador.liga === 'Brasileirão' ? 'no Brasileirão'
    : jogador.liga === 'Premier League' ? 'na Premier League'
    : jogador.liga === 'La Liga' ? 'na La Liga'
    : jogador.liga === 'Bundesliga' ? 'na Bundesliga'
    : jogador.liga === 'Serie A' ? 'na Serie A'
    : jogador.liga === 'Ligue 1' ? 'na Ligue 1'
    : `na ${jogador.liga}`

  const temTitulos = jogador.titulos.length > 0
  const eLenda = jogador.lenda === true

  if (eLenda && temTitulos) {
    return `Uma lenda. Um nome gravado na história do futebol. ${jogador.titulos.slice(0, 2).join(' e ')} estão entre as conquistas de quem marcou uma geração. Você consegue adivinhar quem é?`
  }

  if (eLenda) {
    return `Um nome que dispensaria apresentações. Uma carreira que atravessou gerações e deixou marca onde passou. Você ainda se lembra de quem é?`
  }

  if (temTitulos && jogador.dificuldade === 'dificil') {
    return `Campeão. Vencedor. Um dos jogadores mais decisivos ${ligaLabel} nos últimos anos. Mas será que você sabe o nome por trás das taças?`
  }

  if (temTitulos) {
    return `Títulos no currículo e prestígio na chuteira. Este jogador já ergueu troféus e continua sendo peça-chave ${ligaLabel}. Você sabe quem é?`
  }

  if (jogador.dificuldade === 'dificil') {
    return `Nem todo herói tem holofotes. Este jogador é decisivo, temido pelos adversários e ainda assim pouco falado fora do seu país. Prove que você conhece o futebol de verdade.`
  }

  if (jogador.dificuldade === 'medio') {
    return `Um nome que está em alta ${ligaLabel}. Aparece nas manchetes, rouba a cena e agita a torcida. Você acompanhou o futebol essa temporada?`
  }

  return `Um jogador que está entre os mais conhecidos do futebol mundial. Mas nem todo mundo sabe tudo sobre ele. Quantas pistas você vai precisar?`
}

/**
 * Retorna as 6 pistas de texto de um jogador — escritas como frases narrativas.
 * Progressão: pista 1 é a mais difícil, pista 6 é a mais fácil.
 */
export function getPistasTexto(jogador: Jogador, mode: GameMode = 'bola'): Record<number, string> {
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

  // Pista 3 — Nacionalidade (país real)
  const paisNascimento: Record<string, string> = {
    'Alemão':       'Nasceu na Alemanha — terra de disciplina, organização e um futebol admirado no mundo inteiro.',
    'Argentino':    'Nasceu na Argentina, onde o futebol não é esporte — é religião.',
    'Belga':        'Nasceu na Bélgica, da geração dourada que dominou rankings e encantou a Europa por anos.',
    'Brasileiro':   'Nasceu no Brasil, o país que mais ama o futebol no mundo.',
    'Camaronês':    'Nasceu nos Camarões — terra do Leão Indomável e de atletas que encantam multidões.',
    'Chileno':      'Nasceu no Chile, nação que revelou uma das gerações mais guerreiras da América do Sul.',
    'Colombiano':   'Nasceu na Colômbia, país que nos últimos anos não para de revelar talentos ao futebol.',
    'Dinamarquês':  'Nasceu na Dinamarca — pequeno país com força de gigante dentro de campo.',
    'Egípcio':      'Nasceu no Egito, terra de faraós — e de um dos ídolos mais admirados do futebol atual.',
    'Equatoriano':  'Nasceu no Equador, país que vem ganhando cada vez mais respeito no cenário sul-americano.',
    'Esloveno':     'Nasceu na Eslovênia, nação pequena que revelou ao mundo um dos mais temidos artilheiros da Europa.',
    'Espanhol':     'Nasceu na Espanha, berço do tiki-taka e de gerações que dominaram o futebol mundial.',
    'Francês':      'Nasceu na França — nação que revelou uma nova geração de gênios do futebol.',
    'Georgiano':    'Nasceu na Geórgia, um país que surpreende o mundo com talentos que ninguém esperava.',
    'Guineense':    'Nasceu na Guiné, um dos países africanos que mais exporta talentos para o futebol europeu.',
    'Holandês':     'Nasceu na Holanda, país do futebol total e de uma escola técnica admirada em todo o mundo.',
    'Inglês':       'Nasceu na Inglaterra — onde o futebol nasceu, e onde esta história também começou.',
    'Italiano':     'Nasceu na Itália, terra de grandes defensores, táticos geniais e campeões do mundo.',
    'Marfinense':   'Nasceu na Costa do Marfim, que revelou ao mundo uma geração extraordinária de jogadores.',
    'Nigeriano':    'Nasceu na Nigéria, um dos países africanos com maior tradição em revelar atletas de elite.',
    'Norueguês':    'Nasceu na Noruega — terra fria com um goleador que aquece qualquer estádio do mundo.',
    'Paraguaio':    'Nasceu no Paraguai, país pequeno com coração grande e garra que não conhece derrota fácil.',
    'Peruano':      'Nasceu no Peru, nação com amor ao futebol que atravessa gerações.',
    'Polonês':      'Nasceu na Polônia, que revelou ao mundo um dos centroavantes mais letais da atualidade.',
    'Português':    'Nasceu em Portugal — pequeno país com história enorme dentro do futebol europeu.',
    'Senegalês':    'Nasceu no Senegal, a nação dos Leões de Teranga que rugem cada vez mais alto.',
    'Sul-Coreano':  'Nasceu na Coreia do Sul, país que assombrou o mundo na Copa de 2002 e nunca mais parou.',
    'Suíço':        'Nasceu na Suíça, terra neutra que produz jogadores de alto nível para as melhores ligas do mundo.',
    'Sérvio':       'Nasceu na Sérvia, país dos Bálcãs com uma escola de futebol cada vez mais respeitada.',
    'Turco':        'Nasceu na Turquia, que vive um momento de crescimento real no futebol internacional.',
    'Uruguaio':     'Nasceu no Uruguai — pequeno país com alma enorme e história gigante dentro do futebol.',
    'Venezuelano':  'Nasceu na Venezuela, nação que vem crescendo a passos largos no cenário do futebol sul-americano.',
  }
  const pista3 = paisNascimento[jogador.nacionalidade] ?? `Nasceu em ${jogador.nacionalidade} — um país que tem sua própria história dentro do futebol.`

  // Pista 4 — Clube anterior (trajetória)
  let pista4: string
  if (!jogador.clubeAnterior || jogador.origemAnterior === 'base') {
    // Revelado nas categorias de base do próprio clube
    pista4 = 'Cresceu ali, aprendeu ali, se formou ali. Foi revelado nas categorias de base do próprio clube onde joga hoje — e nunca precisou ir longe para encontrar seu caminho.'
  } else if (jogador.origemAnterior === 'brasil') {
    pista4 = `Antes de chegar ao clube atual, construiu seu nome no ${jogador.clubeAnterior}. Foi de lá que veio o convite que mudou tudo.`
  } else {
    // exterior — distingue se o clube atual é no Brasil ou fora
    if (jogador.liga === 'Brasileirão') {
      pista4 = `Rodou o mundo antes de voltar para casa. Retornou ao Brasil vindo do ${jogador.clubeAnterior}, na ${jogador.ligaAnterior}.`
    } else {
      pista4 = `Cruzou fronteiras em busca de um desafio maior. Chegou ao clube atual vindo do ${jogador.clubeAnterior}, na ${jogador.ligaAnterior}.`
    }
  }

  // Pista 5 — Clube + letras parciais do nome
  // Formato: "NomeClube|L _ t _ a _ _   P _ r _ i _ _"
  // Posições reveladas: 0, 2, e 4 (se palavra > 5 chars). Resto = "_"
  // Palavras separadas por "   " (3 espaços), letras por " " (1 espaço)
  const letrasReveladas = jogador.nome.trim().split(/\s+/).map(palavra =>
    palavra.split('').map((letra, i) => {
      if (i === 0 || i === 2 || (i === 4 && palavra.length > 5)) return letra
      return '_'
    }).join(' ')
  ).join('   ')
  const pista5 = `${jogador.clube}|${letrasReveladas}`

  // Pista 1 = Nome (blocos), Pista 2 = Posição — ordem invertida intencionalmente
  // Campos personalizados por jogador têm prioridade sobre o template automático

  // Copa: 4 pistas — elimina Trajetória (pista4), mantém Time+Nome como última dica
  if (mode === 'copa') {
    return {
      1: pista2,
      2: jogador.pista2 ?? pista1,
      3: jogador.pista3 ?? pista3,
      4: pista5,  // Time + Nome com letras parciais (era pista 5, vira pista 4 na Copa)
    }
  }

  // Bola: 5 pistas completas
  return {
    1: pista2,
    2: jogador.pista2 ?? pista1,
    3: jogador.pista3 ?? pista3,
    4: jogador.pista4 ?? pista4,
    5: pista5,
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
export function buscarJogadores(termo: string, mode: GameMode = 'bola'): Jogador[] {
  if (!termo || termo.length < 2) return []
  const t = normalizarNome(termo)
  const pool = mode === 'copa' ? jogadoresCopa : jogadoresBola
  const resultados = pool.filter(j => normalizarNome(j.nome).includes(t))

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

  return `🐍 COBRA — Quem é o Craque? #${rodadaId}\n${resultado}\n\n${grade}\n\ncobra-craque.vercel.app`
}
