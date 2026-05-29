'use client'

import { Lock } from 'lucide-react'

interface PistaProps {
  numero: number
  texto: string
  revelada: boolean
  atual: boolean
  errou?: boolean    // essa pista teve tentativa errada — card vermelho
  correto?: boolean  // essa pista foi onde acertou — mantém verde mesmo após ganhar
}

// Pista 1 — blocos com letras do meio reveladas
function BlocosNome({ codificado, atual, correto }: { codificado: string; atual: boolean; correto?: boolean }) {
  const ativa = atual || correto
  const palavras = codificado.split('|').map(p => p.split(''))
  return (
    <div className="flex items-center flex-wrap mt-1 gap-y-2">
      {palavras.map((chars, wi) => (
        <div key={wi} className="flex items-center">
          {wi > 0 && (
            <div className="flex items-center mx-3">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
            </div>
          )}
          <div className="flex gap-1.5">
            {chars.map((char, ci) => {
              const revelada = char !== '_'
              return (
                <div
                  key={ci}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold
                    ${revelada
                      ? ativa
                        ? 'bg-green-900 border-2 border-green-400 text-green-200'
                        : 'bg-zinc-700 border-2 border-zinc-300 text-white'
                      : ativa
                        ? 'bg-green-700 border border-green-600'
                        : 'bg-zinc-600 border border-zinc-500'
                    }`}
                >
                  {revelada ? char.toUpperCase() : ''}
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

const LABELS_PISTAS = ['Sopa de Letras', 'Posição', 'Nacionalidade', 'Trajetória', 'Nome + Clube']

export default function Pista({ numero, texto, revelada, atual, errou, correto }: PistaProps) {
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

  return (
    <div className={`rounded-xl border-2 p-4 transition-all duration-300 ${cardClass}`}>
      <div className="flex items-start gap-3">
        {/* Número */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${circuloClass}`}>
          {numero}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-1 ${labelClass}`}>
            {LABELS_PISTAS[numero - 1]}
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
            <div className="flex items-center gap-2 text-zinc-600">
              <Lock size={14} />
              <span className="text-sm">Bloqueada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
