// Lógica central do jogo ESCALA FC

import jogadoresData from '@/data/jogadores.json'
import { Jogador, PONTOS_BASE, TIPO_PISTAS, TipoPista } from './types'

const jogadores = jogadoresData as Jogador[]

/** Jogador do dia — mesmo para todos os usuários no mesmo dia */
export function getJogadorDoDia(): { jogador: Jogador; rodadaId: number } {
  const hoje = new Date()
  const inicio = new Date('2026-05-22')
  const diffDias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const rodadaId = diffDias + 1
  const indice = Math.abs(diffDias) % jogadores.length
  return { jogador: jogadores[indice], rodadaId }
}

/**
 * Retorna as 6 pistas de texto de um jogador.
 * Progressão: pista 1 é a mais difícil, pista 6 é a mais fácil.
 */
export function getPistasTexto(jogador: Jogador): Record<number, string> {
  // Remove o nome do jogador de qualquer pista que possa revelá-lo
  const primeiroNome = jogador.nome.split(' ')[0]
  const censurar = (texto: string) =>
    texto.replace(new RegExp(primeiroNome, 'gi'), '???')

  // Pista 1 — Liga e posição genérica (mais difícil)
  const ligaLabel = jogador.liga === 'Brasileirão' ? 'Brasileirão Série A'
    : jogador.liga === 'Premier League' ? 'Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿'
    : jogador.liga === 'La Liga' ? 'La Liga 🇪🇸'
    : jogador.liga === 'Bundesliga' ? 'Bundesliga 🇩🇪'
    : jogador.liga === 'Serie A' ? 'Serie A 🇮🇹'
    : jogador.liga === 'Ligue 1' ? 'Ligue 1 🇫🇷'
    : jogador.liga

  const pista1 = `Joga na ${ligaLabel} como ${jogador.posicao}`

  // Pista 2 — Faixa etária e continente/região de origem
  const continente = ['Brasileiro', 'Argentino', 'Uruguaio', 'Colombiano',
    'Chileno', 'Paraguaio', 'Venezuelano', 'Equatoriano', 'Peruano'].includes(jogador.nacionalidade)
    ? 'Sul-americano'
    : ['Espanhol', 'Francês', 'Alemão', 'Italiano', 'Português', 'Inglês',
       'Belga', 'Holandês', 'Croata', 'Sérvio'].includes(jogador.nacionalidade)
    ? 'Europeu'
    : 'da América'

  const pista2 = `${continente} · Faixa etária: ${jogador.faixaEtaria} anos`

  // Pista 3 — Títulos (sem revelar clube se aparecer na lista)
  const pista3 = jogador.titulos.length > 0
    ? `Títulos: ${jogador.titulos.slice(0, 3).join(' · ')}`
    : 'Ainda sem títulos expressivos na carreira'

  // Pista 4 — Nacionalidade completa + posição detalhada
  const pista4 = `${jogador.bandeira} ${jogador.nacionalidade} · ${jogador.posicao}`

  // Pista 5 — Curiosidade (com nome censurado)
  const pista5 = censurar(jogador.curiosidade)

  // Pista 6 — Clube (mais fácil)
  const pista6 = `Defende o ${jogador.clube} atualmente`

  return { 1: pista1, 2: pista2, 3: pista3, 4: pista4, 5: pista5, 6: pista6 }
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
