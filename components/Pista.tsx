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
  onRevelar?: () => void    // card travado vira clicável (pista 1 do primeiro desafio)
  onDestravar?: () => void  // botão "Ver próxima dica" na pista seguinte travada
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
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
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
                        ? 'bg-green-900 border-2 border-green-400 text-green-200'
                        : 'bg-zinc-700 border-2 border-zinc-300 text-white'
                      : ativa
                        ? 'bg-green-700 border border-green-600'
                        : 'bg-zinc-600 border border-zinc-500'
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
      <p className={`font-bold text-base ${ativa ? 'text-green-300' : 'text-white'}`}>
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
                        ? (ativa ? 'text-green-300' : 'text-white')
                        : 'text-zinc-500'
                      }`}
                  >
                    {char}
                  </span>
                  <div className={`mt-0.5 h-px w-full ${char !== '_' ? (ativa ? 'bg-green-400' : 'bg-zinc-500') : 'bg-zinc-600'}`} />
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
const LABELS_PISTAS = ['O Nome', 'O Dom', 'A Raiz', 'A Jornada', 'O Lar']

export default function Pista({ numero, texto, revelada, atual, errou, correto, subtitulo, onRevelar, onDestravar }: PistaProps) {
  // Determina o estado visual da pista
  const isVerde = atual || correto
  const isVermelho = errou && !isVerde

  // Card
  const cardClass = revelada
    ? isVermelho
      ? 'border-red-800 bg-red-950/60'
      : isVerde
        ? 'border-green-400 bg-green-950 shadow-lg shadow-green-900/30'
        : 'border-zinc-600 bg-zinc-800'
    : 'border-zinc-700 bg-zinc-900'

  // Bolinha do número
  const circuloClass = revelada
    ? isVermelho
      ? 'bg-red-700 text-white'
      : isVerde
        ? 'bg-green-400 text-black'
        : 'bg-zinc-600 text-white'
    : 'bg-blue-950 border border-blue-600 text-blue-400'  // azul quando travada

  // Label da pista
  const labelClass = revelada
    ? isVermelho
      ? 'text-red-500'
      : 'text-zinc-400'
    : 'text-zinc-600'

  // Texto do conteúdo (pistas 2, 3, 4)
  const textoClass = isVerde ? 'text-green-300' : isVermelho ? 'text-red-200' : 'text-white'

  const clicavel = !revelada && !!onRevelar

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all duration-300 ${cardClass} ${clicavel ? 'cursor-pointer active:scale-95 hover:border-blue-500 hover:bg-blue-950/30' : ''}`}
      onClick={clicavel ? onRevelar : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Número */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${circuloClass}`}>
          {numero}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-1 ${labelClass}`}>
            {`Capítulo ${numero} · ${subtitulo ?? LABELS_PISTAS[numero - 1]}`}
          </p>

          {revelada ? (
            <>
              {numero === 1 && (
                <BlocosNome codificado={texto} atual={atual} correto={correto} />
              )}
              {numero === 5 && (
                <LetrasNome codificado={texto} atual={atual} correto={correto} />
              )}
              {numero !== 1 && numero !== 5 && (
                <p className={`font-semibold text-base leading-snug ${textoClass}`}>
                  {texto}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              {clicavel ? (
                <span className="text-blue-400 text-sm font-semibold">Toque para revelar →</span>
              ) : onDestravar ? (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onDestravar() }}
                  className="text-xs font-semibold text-blue-400 border border-blue-800/60 rounded-lg px-3 py-1.5 hover:bg-blue-950/50 active:scale-95 transition-all"
                >
                  Ver próxima dica →
                </button>
              ) : (
                <>
                  <Lock size={14} className="text-zinc-600" />
                  <span className="text-zinc-600 text-sm">Bloqueada</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
