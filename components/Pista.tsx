'use client'

import { Lock } from 'lucide-react'

interface PistaProps {
  numero: number
  texto: string
  revelada: boolean
  atual: boolean
  errou?: boolean
  correto?: boolean
  subtitulo?: string
  renderAs?: number
  onRevelar?: () => void
  onDestravar?: () => void
  pontosAtual?: number
  custoDestravar?: number
  modeColor?: string   // cor do modo: '#00C853' (bola) ou '#FFD23F' (copa)
}

// Cor e metadados por número de pista
const PISTA_META: Record<number, { cor: string; corBg: string; chip: string; icone: string }> = {
  1: { cor: '#818cf8', corBg: 'rgba(129,140,248,0.12)', chip: 'CÓDIGO',     icone: '🔐' },
  2: { cor: '#60a5fa', corBg: 'rgba(96,165,250,0.12)',  chip: 'HABILIDADE', icone: '⚡' },
  3: { cor: '#34d399', corBg: 'rgba(52,211,153,0.12)',  chip: 'ORIGEM',     icone: '🌍' },
  4: { cor: '#fb923c', corBg: 'rgba(251,146,60,0.12)',  chip: 'JORNADA',    icone: '🗺️' },
  5: { cor: '#FFD23F', corBg: 'rgba(255,210,63,0.12)',  chip: 'FINAL',      icone: '👕' },
}
// Pista 4 em modo copa usa renderer 5 (LetrasNome) — mesma cor dourada
const PISTA_META_COPA4 = PISTA_META[5]

function getPistaMeta(numero: number, renderAs?: number) {
  if (renderAs === 5 && numero === 4) return PISTA_META_COPA4
  return PISTA_META[numero] ?? PISTA_META[5]
}

// Ícone específico por posição para pista 2
const ICONE_POSICAO: Record<string, string> = {
  'Goleiro': '🧤', 'Zagueiro': '🛡️', 'Lateral-direito': '🏃', 'Lateral-esquerdo': '🏃',
  'Lateral': '🏃', 'Volante': '⚙️', 'Meia': '🎯', 'Meia-atacante': '✨',
  'Ponta': '⚡', 'Ponta-direita': '⚡', 'Ponta-esquerda': '⚡',
  'Atacante': '🔥', 'Centroavante': '🔥',
}

// Pista 1 — blocos de letras
function BlocosNome({ codificado, isAtivo, modeColor }: { codificado: string; isAtivo: boolean; modeColor: string }) {
  const palavras = codificado.split('|').map(p => p.split(''))
  const maxLen = Math.max(...palavras.map(p => p.length))
  const { bloco, texto, gap, mx } =
    maxLen <= 5  ? { bloco: 'w-9 h-9',  texto: 'text-sm',  gap: 'gap-1.5', mx: 'mx-2' } :
    maxLen <= 7  ? { bloco: 'w-8 h-8',  texto: 'text-sm',  gap: 'gap-1',   mx: 'mx-2' } :
    maxLen <= 9  ? { bloco: 'w-7 h-7',  texto: 'text-xs',  gap: 'gap-1',   mx: 'mx-1.5' } :
    maxLen <= 11 ? { bloco: 'w-6 h-6',  texto: 'text-xs',  gap: 'gap-1',   mx: 'mx-1' } :
                   { bloco: 'w-5 h-5',  texto: 'text-[10px]', gap: 'gap-0.5', mx: 'mx-1' }

  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {palavras.map((chars, wi) => (
        <div key={wi} className="flex items-center">
          {wi > 0 && (
            <div className={`flex items-center ${mx}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2A3A5A]" />
            </div>
          )}
          <div className={`flex ${gap}`}>
            {chars.map((char, ci) => {
              const rev = char !== '_'
              return (
                <div
                  key={ci}
                  className={`${bloco} rounded-md flex items-center justify-center ${texto} font-black transition-all duration-200`}
                  style={rev
                    ? { background: isAtivo ? `${modeColor}18` : '#0D1829', border: `2px solid ${isAtivo ? modeColor : '#3A5070'}`, color: isAtivo ? modeColor : '#C0D8EE' }
                    : { background: '#0A1220', border: '2px solid #1E3050', color: 'transparent' }
                  }
                >
                  {rev ? char.toUpperCase() : ''}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Pista 5 / Copa pista 4 — clube + letras parciais do nome
function LetrasNome({ codificado, isAtivo, modeColor }: { codificado: string; isAtivo: boolean; modeColor: string }) {
  const sepIdx = codificado.indexOf('|')
  const clube   = sepIdx >= 0 ? codificado.slice(0, sepIdx) : codificado
  const letras  = sepIdx >= 0 ? codificado.slice(sepIdx + 1) : ''
  const palavras = letras ? letras.split('   ') : []

  return (
    <div className="space-y-2">
      <p className="font-black text-sm" style={{ color: isAtivo ? modeColor : '#A0BDD0' }}>{clube}</p>
      {palavras.length > 0 && (
        <div className="flex gap-4 flex-wrap items-end">
          {palavras.map((palavra, wi) => (
            <div key={wi} className="flex gap-1 items-end">
              {palavra.split(' ').map((char, ci) => (
                <div key={ci} className="flex flex-col items-center" style={{ minWidth: '16px' }}>
                  <span
                    className="text-base font-black font-mono leading-none"
                    style={{ color: char !== '_' ? (isAtivo ? modeColor : '#C0D8EE') : '#3A5570' }}
                  >
                    {char !== '_' ? char : '_'}
                  </span>
                  <div className="mt-0.5 h-[2px] w-full" style={{ background: char !== '_' ? (isAtivo ? modeColor : '#3A5570') : '#1E3050' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Corta o texto na última frase/cláusula completa antes de maxChars
// Evita corte no meio de palavras ou sentenças (o ". " e ", " são pontos de quebra naturais)
function truncarTexto(texto: string, maxChars = 200): string {
  if (texto.length <= maxChars) return texto
  const sub = texto.slice(0, maxChars)
  const pontos = [sub.lastIndexOf('. '), sub.lastIndexOf('! '), sub.lastIndexOf('? '), sub.lastIndexOf(' — '), sub.lastIndexOf(', ')]
  const melhor = Math.max(...pontos)
  if (melhor > maxChars * 0.4) return texto.slice(0, melhor + 1).trim()
  const ultimoEspaco = sub.lastIndexOf(' ')
  return texto.slice(0, ultimoEspaco > 0 ? ultimoEspaco : maxChars).trim() + '.'
}

const LABELS_PISTAS = ['O Nome', 'O Dom', 'A Raiz', 'A Jornada', 'Time + Nome']

export default function Pista({
  numero, texto, revelada, atual, errou, correto,
  subtitulo, renderAs, onRevelar, onDestravar,
  pontosAtual, custoDestravar,
  modeColor = '#00C853',
}: PistaProps) {
  const renderer = renderAs ?? numero
  const isVerde = atual || correto
  const isVermelho = errou && !isVerde
  const meta = getPistaMeta(numero, renderAs)

  // Estado visual do card — rgba para o fundo de campo aparecer
  const cardStyle = (() => {
    if (!revelada) return {
      background: 'rgba(8,13,24,0.78)',
      border: '1.5px solid rgba(26,42,64,0.9)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }
    if (isVermelho) return {
      background: 'rgba(127,29,29,0.55)',
      border: '1.5px solid rgba(239,68,68,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }
    if (isVerde) return {
      background: `${modeColor}12`,
      border: `1.5px solid ${modeColor}50`,
      boxShadow: `0 0 20px ${modeColor}15`,
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }
    return {
      background: 'rgba(10,18,32,0.75)',
      border: `1.5px solid ${meta.cor}30`,
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    }
  })()

  const barColor = isVermelho ? '#ef4444' : isVerde ? modeColor : revelada ? meta.cor : '#1E3050'
  const numColor = isVermelho ? '#ef4444' : isVerde ? modeColor : revelada ? meta.cor : '#3A5570'
  const labelColor = isVermelho ? '#ef4444' : isVerde ? `${modeColor}99` : revelada ? `${meta.cor}99` : '#3A5570'
  const titleColor = isVermelho ? '#fca5a5' : isVerde ? modeColor : revelada ? meta.cor : '#4A6A8A'
  const clicavel = !revelada && !!onRevelar

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${clicavel ? 'cursor-pointer active:scale-[0.98] hover:brightness-110' : ''} ${revelada ? 'animate-reveal' : ''}`}
      style={cardStyle}
      onClick={clicavel ? onRevelar : undefined}
    >
      {/* Barra colorida lateral */}
      <div className="flex">
        <div className="w-[3px] flex-shrink-0 rounded-l-2xl transition-colors duration-300" style={{ background: barColor }} />

        <div className="flex-1 min-w-0 p-3">

          {/* ── Topo: número + label + chip ── */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black tabular-nums w-5 text-center transition-colors" style={{ color: numColor }}>
              {numero}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: labelColor }}>
                {subtitulo ?? LABELS_PISTAS[numero - 1]}
              </span>
            </div>
            {/* Chip de categoria — só quando revelada */}
            {revelada && (
              <span
                className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: isVerde ? `${modeColor}18` : isVermelho ? 'rgba(239,68,68,0.12)' : meta.corBg, color: isVerde ? modeColor : isVermelho ? '#ef4444' : meta.cor, border: `1px solid ${isVerde ? modeColor + '30' : isVermelho ? 'rgba(239,68,68,0.25)' : meta.cor + '30'}` }}
              >
                {meta.icone} {meta.chip}
              </span>
            )}
          </div>

          {/* Separador */}
          <div className="h-px mb-3 -mx-1" style={{ background: isVerde ? `${modeColor}20` : isVermelho ? 'rgba(239,68,68,0.15)' : `${meta.cor}18` }} />

          {/* ── Conteúdo ── */}
          {revelada ? (
            <div>
              {/* Badge de pontos — canto direito, só na pista ativa */}
              {atual && pontosAtual !== undefined && (
                <div className="float-right ml-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ color: '#FFD23F', background: 'rgba(255,210,63,0.12)', border: '1px solid rgba(255,210,63,0.25)' }}>
                    {pontosAtual} pts
                  </span>
                </div>
              )}

              {renderer === 1 && (
                <BlocosNome codificado={texto} isAtivo={!!isVerde} modeColor={modeColor} />
              )}
              {renderer === 5 && (
                <LetrasNome codificado={texto} isAtivo={!!isVerde} modeColor={modeColor} />
              )}
              {renderer !== 1 && renderer !== 5 && (
                <p
                  className="text-sm leading-snug font-medium"
                  style={{
                    color: isVerde ? `${modeColor}CC` : isVermelho ? '#fca5a5' : '#A8C5D8',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {truncarTexto(texto)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-0.5">
              {clicavel ? (
                <span className="text-sm font-bold" style={{ color: modeColor }}>Toque para revelar →</span>
              ) : onDestravar ? (
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onDestravar() }}
                    className="text-xs font-bold rounded-lg px-3 py-1.5 transition-all active:scale-95"
                    style={{ color: modeColor, border: `1px solid ${modeColor}30`, background: `${modeColor}08` }}
                  >
                    Ver próxima dica →
                  </button>
                  {custoDestravar !== undefined && (
                    <span className="text-red-400 text-xs font-bold">−{custoDestravar} pts</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Lock size={11} className="text-[#3A5570]" />
                  <span className="text-xs text-[#3A5570]">bloqueada</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
