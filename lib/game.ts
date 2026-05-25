// Lógica central do jogo ESCALA FC

import jogadoresData from '@/data/jogadores.json'
import { Jogador, PONTOS_BASE, TIPO_PISTAS, TipoPista } from './types'

const jogadores = jogadoresData as Jogador[]

/** @deprecated Use getJogadoresDoDia() — mantido para compatibilidade com /desafio/[rodadaId] */
export function getJogadorDoDia(): { jogador: Jogador; rodadaId: number } {
  const hoje = new Date()
  const inicio = new Date('2026-05-22')
  const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const rodadaId = diffDias * 3 + 1
  const indice = Math.abs(diffDias * 3) % jogadores.length
  return { jogador: jogadores[indice], rodadaId }
}

/** 3 jogadores do dia — um por desafio, mesmo para todos os usuários */
export function getJogadoresDoDia(): Array<{ jogador: Jogador; rodadaId: number }> {
  const hoje = new Date()
  const inicio = new Date('2026-05-22')
  const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))

  return [0, 1, 2].map(i => {
    const indice = Math.abs(diffDias * 3 + i) % jogadores.length
    const rodadaId = diffDias * 3 + i + 1
    return { jogador: jogadores[indice], rodadaId }
  })
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
export function getPistasTexto(jogador: Jogador): Record<number, string> {
  // Pista 1 — Posição em campo (com narrativa por liga)
  const ligaLabel = jogador.liga === 'Brasileirão' ? 'Brasileirão Série A'
    : jogador.liga === 'Premier League' ? 'Premier League'
    : jogador.liga === 'La Liga' ? 'La Liga'
    : jogador.liga === 'Bundesliga' ? 'Bundesliga'
    : jogador.liga === 'Serie A' ? 'Serie A italiana'
    : jogador.liga === 'Ligue 1' ? 'Ligue 1'
    : jogador.liga

  const posicaoFrase: Record<string, string> = {
    'Goleiro':          'Entre os postes, é quase intransponível',
    'Zagueiro':         'Na zaga, impõe respeito e barra os melhores ataques',
    'Lateral-direito':  'Pelo lado direito, atacar e defender são a mesma coisa',
    'Lateral-esquerdo': 'Pelo lado esquerdo, domina o corredor com velocidade',
    'Volante':          'No meio, destrói jogadas antes que elas existam',
    'Meia':             'No centro do campo, organiza, cria e decide quando a partida pede',
    'Meia-atacante':    'Entre a criação e o gol, habita um território que poucos dominam',
    'Ponta-direita':    'Pela direita, arranca e deixa o defensor no retrovisor',
    'Ponta-esquerda':   'Pela esquerda, é um pesadelo para qualquer lateral do mundo',
    'Atacante':         'No ataque, vive para uma coisa só: a rede balançar',
    'Centroavante':     'Na área, é a referência que toda torcida quer e todo defensor teme',
  }
  const posicaoTexto = posicaoFrase[jogador.posicao] ?? `Atua como ${jogador.posicao}`
  const pista1 = `${posicaoTexto} — e faz isso pela ${ligaLabel}.`

  // Pista 2 — Comprimento de cada palavra do nome (ex: "5" ou "7 5")
  // O componente Pista.tsx renderiza como blocos ■ por letra
  const pista2 = jogador.nome.trim().split(/\s+/).map(p => p.length).join(' ')

  // Pista 3 — Nacionalidade (país real)
  const paisNascimento: Record<string, string> = {
    'Alemão':       'Nasceu na Alemanha',
    'Argentino':    'Nasceu na Argentina',
    'Belga':        'Nasceu na Bélgica',
    'Brasileiro':   'Nasceu no Brasil',
    'Camaronês':    'Nasceu nos Camarões',
    'Chileno':      'Nasceu no Chile',
    'Colombiano':   'Nasceu na Colômbia',
    'Dinamarquês':  'Nasceu na Dinamarca',
    'Egípcio':      'Nasceu no Egito',
    'Equatoriano':  'Nasceu no Equador',
    'Esloveno':     'Nasceu na Eslovênia',
    'Espanhol':     'Nasceu na Espanha',
    'Francês':      'Nasceu na França',
    'Georgiano':    'Nasceu na Geórgia',
    'Guineense':    'Nasceu na Guiné',
    'Holandês':     'Nasceu na Holanda',
    'Inglês':       'Nasceu na Inglaterra',
    'Italiano':     'Nasceu na Itália',
    'Marfinense':   'Nasceu na Costa do Marfim',
    'Nigeriano':    'Nasceu na Nigéria',
    'Norueguês':    'Nasceu na Noruega',
    'Paraguaio':    'Nasceu no Paraguai',
    'Peruano':      'Nasceu no Peru',
    'Polonês':      'Nasceu na Polônia',
    'Português':    'Nasceu em Portugal',
    'Senegalês':    'Nasceu no Senegal',
    'Sul-Coreano':  'Nasceu na Coreia do Sul',
    'Suíço':        'Nasceu na Suíça',
    'Sérvio':       'Nasceu na Sérvia',
    'Turco':        'Nasceu na Turquia',
    'Uruguaio':     'Nasceu no Uruguai',
    'Venezuelano':  'Nasceu na Venezuela',
  }
  const pista3 = paisNascimento[jogador.nacionalidade] ?? `Nacionalidade: ${jogador.nacionalidade}`

  // Pista 4 — Faixa etária
  const pista4 = `Tem entre ${jogador.faixaEtaria} anos de idade.`

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

  return { 1: pista1, 2: pista2, 3: pista3, 4: pista4, 5: pista5 }
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
  return jogadores
    .filter(j => normalizarNome(j.nome).includes(t))
    .slice(0, 6)
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
  const resultado = pistaAcerto
    ? `Acertei em ${pistaAcerto} pista${pistaAcerto > 1 ? 's' : ''} 🎯`
    : 'Não acertei hoje 😬'

  return `ESCALA FC #${rodadaId}\n${resultado}\n\n${grade}\n\nescalafe.com.br`
}
