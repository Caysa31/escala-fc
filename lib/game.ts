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
 * Retorna as pistas de um jogador.
 * Pistas 1-3 são mídia (o componente PistaMedia cuida da exibição).
 * Pistas 4-6 são texto.
 */
export function getPistasTexto(jogador: Jogador): Record<number, string> {
  return {
    4: `${jogador.posicao.toUpperCase()}  ·  ${jogador.bandeira} ${jogador.nacionalidade}`,
    5: jogador.titulos.length > 0
      ? jogador.titulos.slice(0, 3).join('  ·  ')
      : 'Sem títulos expressivos ainda',
    6: jogador.curiosidade.replace(new RegExp(jogador.nome.split(' ')[0], 'gi'), '???'),
  }
}

/** Tipo de cada pista (video / imagem / escudo / texto) */
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
