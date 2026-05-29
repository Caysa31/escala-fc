'use client'

import { Lock } from 'lucide-react'

interface PistaProps {
  numero: number
  texto: string
  revelada: boolean
  atual: boolean
}

// Pista 2 — blocos com letras do meio reveladas
// `codificado` ex: "__d__" (Pedro) ou "___r_g_|__r__" (Rodrigo Garro)
// "_" = bloco fechado | letra = bloco com letra revelada no meio
function BlocosNome({ codificado, atual }: { codificado: string; atual: boolean }) {
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
                      ? atual
                        ? 'bg-green-900 border-2 border-green-400 text-green-200'
                        : 'bg-zinc-700 border-2 border-zinc-300 text-white'
                      : atual
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

// Pista 5 mostra clube + letras parciais do nome
// `codificado` ex: "Flamengo|P _ d _ _   G _ r _ _"
// letras reveladas em verde, "_" em zinc-500
function LetrasNome({ codificado, atual }: { codificado: string; atual: boolean }) {
  const sepIdx = codificado.indexOf('|')
  const clube   = sepIdx >= 0 ? codificado.slice(0, sepIdx) : codificado
  const letras  = sepIdx >= 0 ? codificado.slice(sepIdx + 1) : ''

  // Palavras separadas por "   " (3 espaços)
  const palavras = letras ? letras.split('   ') : []

  return (
    <div className="space-y-2 mt-1">
      {/* Nome do clube */}
      <p className={`font-bold text-base ${atual ? 'text-green-300' : 'text-white'}`}>
        {clube}
      </p>

      {/* Letras parciais */}
      {palavras.length > 0 && (
        <div className="flex gap-4 flex-wrap items-end">
          {palavras.map((palavra, wi) => (
            <div key={wi} className="flex gap-1 items-end">
              {palavra.split(' ').map((char, ci) => (
                <div key={ci} className="flex flex-col items-center" style={{ minWidth: '14px' }}>
                  <span
                    className={`text-base font-bold font-mono leading-none
                      ${char !== '_'
                        ? (atual ? 'text-green-300' : 'text-white')
                        : 'text-zinc-500'
                      }`}
                  >
                    {char}
                  </span>
                  <div className={`mt-0.5 h-px w-full ${char !== '_' ? (atual ? 'bg-green-400' : 'bg-zinc-500') : 'bg-zinc-600'}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const LABELS_PISTAS = ['Sopa de Letras', 'Posição', 'Nacionalidade', 'Trajetória', 'Nome']

export default function Pista({ numero, texto, revelada, atual }: PistaProps) {
  return (
    <div
      className={`
        rounded-xl border-2 p-4 transition-all duration-500
        ${revelada
          ? atual
            ? 'border-green-400 bg-green-950 shadow-lg shadow-green-900/30'
            : 'border-zinc-600 bg-zinc-800'
          : 'border-zinc-700 bg-zinc-900'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Número da pista */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${revelada
              ? atual
                ? 'bg-green-400 text-black'
                : 'bg-zinc-600 text-white'
              : 'bg-zinc-800 text-zinc-500'
            }
          `}
        >
          {numero}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-1 ${revelada ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {LABELS_PISTAS[numero - 1]}
          </p>

          {revelada ? (
            <>
              {/* Pista 1 — blocos de nome */}
              {numero === 1 && (
                <BlocosNome codificado={texto} atual={atual} />
              )}

              {/* Pista 5 — clube + letras parciais */}
              {numero === 5 && (
                <LetrasNome codificado={texto} atual={atual} />
              )}

              {/* Demais pistas — texto simples */}
              {numero !== 1 && numero !== 5 && (
                <p className={`font-semibold text-base leading-snug ${atual ? 'text-green-300' : 'text-white'}`}>
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
