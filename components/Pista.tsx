'use client'

import { Lock } from 'lucide-react'

interface PistaProps {
  numero: number
  texto: string
  revelada: boolean
  atual: boolean
  errou?: boolean       // essa pista teve tentativa errada — card vermelho
  correto?: boolean     // essa pista foi onde acertou — mantém verde mesmo após ganhar
  subtitulo?: string    // label do capítulo (substitui o padrão quando fornecido — ex: "O Maestro")
  renderAs?: number     // força um renderer específico sem alterar o número exibido (ex: Copa pista4 usa renderer do 5)
  onRevelar?: () => void    // card travado vira clicável (pista 1 do primeiro desafio)
  onDestravar?: () => void  // botão "Ver próxima dica" na pista seguinte travada
  // Pontuação dinâmica
  pontosAtual?: number    // pontos que o jogador ganha SE acertar agora (mostrado na pista ativa)
  custoDestravar?: number // custo de revelar a próxima pista (mostrado no botão "Ver próxima dica")
}

// Pista 1 — blocos com letras do meio reveladas
// Ajusta tamanho dos blocos dinamicamente pela palavra mais longa
function BlocosNome({ codificado, atual, correto }: { codificado: string; atual: boolean; correto?: boolean }) {
  const ativa = atual || correto
  const palavras = codificado.split('|').map(p => p.split(''))
  const maxLen = Math.max(...palavras.map(p => p.length))

  // Largura disponível aprox: 360px tela - 32px padding card - 32px ícone - 12px gap ≈ 284px
  // bloco + gap por letra: calcula pra caber dentro de 280px
  const { bloco, texto, gap, mx } =
    maxLen <= 5  ? { bloco: 'w-8 h-8',  texto: 'text-sm', gap: 'gap-1.5', mx: 'mx-2' } :
    maxLen <= 7  ? { bloco: 'w-7 h-7',  texto: 'text-sm', gap: 'gap-1',   mx: 'mx-2' } :
    maxLen <= 9  ? { bloco: 'w-6 h-6',  texto: 'text-xs', gap: 'gap-1',   mx: 'mx-1.5' } :
    maxLen <= 11 ? { bloco: 'w-5 h-5',  texto: 'text-xs', gap: 'gap-1',   mx: 'mx-1.5' } :
                   { bloco: 'w-4 h-4',  texto: 'text-xs', gap: 'gap-0.5', mx: 'mx-1' }

  return (
    <div className="flex items-center flex-wrap mt-1 gap-y-2">
      {palavras.map((chars, wi) => (
        <div key={wi} className="flex items-center">
          {wi > 0 && (
            <div className={`flex items-center ${mx}`}>
              <div className="w-1 h-1 rounded-full bg-[#1A3A5C]" />
            </div>
          )}
          <div className={`flex ${gap}`}>
            {chars.map((char, ci) => {
              const rev = char !== '_'
              return (
                <div
                  key={ci}
                  className={`${bloco} rounded flex items-center justify-center ${texto} font-bold
                    ${rev
                      ? ativa
                        ? 'bg-[#071A0F] border-2 border-[#00C853] text-[#00C853]'
                        : 'bg-[#0F1D30] border-2 border-[#2A5275] text-white'
                      : ativa
                        ? 'bg-[#0F1D30] border border-[#00C853]/40'
                        : 'bg-[#1A3A5C] border border-[#2A5275]'
                    }`}
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

// Pista 5 — clube + letras parciais do nome
function LetrasNome({ codificado, atual, correto }: { codificado: string; atual: boolean; correto?: boolean }) {
  const ativa = atual || correto
  const sepIdx = codificado.indexOf('|')
  const clube   = sepIdx >= 0 ? codificado.slice(0, sepIdx) : codificado
  const letras  = sepIdx >= 0 ? codificado.slice(sepIdx + 1) : ''
  const palavras = letras ? letras.split('   ') : []

  return (
    <div className="space-y-2 mt-1">
      <p className={`font-bold text-base ${ativa ? 'text-[#4A9A6A]' : 'text-white'}`}>
        {clube}
      </p>
      {palavras.length > 0 && (
        <div className="flex gap-4 flex-wrap items-end">
          {palavras.map((palavra, wi) => (
            <div key={wi} className="flex gap-1 items-end">
              {palavra.split(' ').map((char, ci) => (
                <div key={ci} className="flex flex-col items-center" style={{ minWidth: '14px' }}>
                  <span
                    className={`text-base font-bold font-mono leading-none
                      ${char !== '_'
                        ? (ativa ? 'text-[#4A9A6A]' : 'text-white')
                        : 'text-[#5A8AAA]'
                      }`}
                  >
                    {char}
                  </span>
                  <div className={`mt-0.5 h-px w-full ${char !== '_' ? (ativa ? 'bg-[#00C853]' : 'bg-[#5A8AAA]') : 'bg-[#1A3A5C]'}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Label temático padrão de cada capítulo (pista 2 é sobrescrita por `subtitulo` via posição)
const LABELS_PISTAS = ['O Nome', 'O Dom', 'A Raiz', 'A Jornada', 'Time + Nome']

export default function Pista({ numero, texto, revelada, atual, errou, correto, subtitulo, renderAs, onRevelar, onDestravar, pontosAtual, custoDestravar }: PistaProps) {
  // renderAs permite forçar um renderer diferente (ex: Copa pista 4 usa renderer do 5)
  const renderer = renderAs ?? numero
  // Determina o estado visual da pista
  const isVerde = atual || correto
  const isVermelho = errou && !isVerde

  // Card
  const cardClass = revelada
    ? isVermelho
      ? 'border-red-800 bg-red-950/40'
      : isVerde
        ? 'border-[#00C853] bg-[#071A0F] shadow-lg shadow-[#00C853]/10'
        : 'border-[#2A5275] bg-[#0F1D30]'
    : 'border-[#2A5275] bg-[#0A1626]'

  // Bolinha do número
  const circuloClass = revelada
    ? isVermelho
      ? 'bg-red-700 text-white'
      : isVerde
        ? 'bg-[#00C853] text-[#0A1626]'
        : 'bg-[#1E3A5F] text-white'
    : 'bg-[#0F1D30] border border-[#2A5275] text-[#8AB4CC]'

  // Label da pista
  const labelClass = revelada
    ? isVermelho
      ? 'text-red-500'
      : 'text-[#8AB4CC]'
    : 'text-[#8AB4CC]'

  // Texto do conteúdo (pistas 2, 3, 4)
  const textoClass = isVerde ? 'text-[#4A9A6A]' : isVermelho ? 'text-red-200' : 'text-white'

  const clicavel = !revelada && !!onRevelar

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-300 ${cardClass} ${clicavel ? 'cursor-pointer active:scale-95 hover:border-[#00C853]/60' : ''}`}
      onClick={clicavel ? onRevelar : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Número */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${circuloClass}`}>
          {numero}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">

          {/* Rótulo secundário: "Cap X ·" mudo + nome da pista em destaque */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className={`text-xs font-medium tracking-wide ${labelClass}`}>
              Cap. {numero} ·
            </span>
            <span className={`text-sm font-bold ${
              isVerde ? 'text-[#00C853]'
              : isVermelho ? 'text-red-400'
              : 'text-[#C8E0F0]'
            }`}>
              {subtitulo ?? LABELS_PISTAS[numero - 1]}
            </span>
          </div>

          {revelada ? (
            <>
              {renderer === 1 && (
                <BlocosNome codificado={texto} atual={atual} correto={correto} />
              )}
              {renderer === 5 && (
                <LetrasNome codificado={texto} atual={atual} correto={correto} />
              )}
              {renderer !== 1 && renderer !== 5 && (
                <p className={`font-medium text-base leading-relaxed ${textoClass}`}>
                  {texto}
                </p>
              )}

              {/* Banner de pontos — aparece na pista recém-revelada (ativa) */}
              {atual && pontosAtual !== undefined && (
                <div className="mt-3 pt-2 border-t border-[#2A5275] text-right">
                  <span className="text-[#FFD23F] text-sm font-black">
                    Agora vale {pontosAtual} pts
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              {clicavel ? (
                <span className="text-[#00C853] text-sm font-semibold">Toque para revelar →</span>
              ) : onDestravar ? (
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onDestravar() }}
                    className="text-xs font-semibold text-[#00C853] border border-[#00C853]/30 rounded-lg px-3 py-1.5 hover:bg-[#00C853]/10 active:scale-95 transition-all"
                  >
                    Ver próxima dica →
                  </button>
                  {custoDestravar !== undefined && (
                    <span className="text-red-400 text-xs font-bold">−{custoDestravar} pts se revelar</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className="text-[#5A8AAA]" />
                  <span className="text-[#8AB4CC] text-xs">bloqueada</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
