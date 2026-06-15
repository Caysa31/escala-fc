'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Perfil, Jogador } from '@/lib/types'
import jogadoresCopaData from '@/data/jogadores-copa.json'
import { carregarPerfil, carregarResultados } from '@/lib/perfil'
import TelaPerfil from '@/components/TelaPerfil'
import JogoDesafio from '@/components/JogoDesafio'

const jogadoresCopa = jogadoresCopaData as Jogador[]

function limparResultadoTeste(rodadaId: number) {
  try {
    const todos = carregarResultados()
    const filtrados = todos.filter(r => r.rodadaId !== rodadaId)
    localStorage.setItem('escalafc_resultados', JSON.stringify(filtrados))
  } catch { /* silencioso */ }
}

export default function PreviewPage() {
  const params = useParams()
  const jogadorId = parseInt(params.jogadorId as string, 10)

  const jogador = jogadoresCopa.find(j => j.id === jogadorId) ?? null
  // ID negativo garantido único — nunca conflita com rodadas reais
  const rodadaId = -(jogadorId + 90000)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [jogoKey, setJogoKey] = useState(0)
  const iniciou = useRef(false)

  useEffect(() => {
    if (iniciou.current) return
    iniciou.current = true
    limparResultadoTeste(rodadaId)
    setPerfil(carregarPerfil())
    setCarregado(true)
  }, [rodadaId])

  if (!carregado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#FFD23F] font-black text-xl animate-pulse">⚽ COBRA DA COPA</p>
      </div>
    )
  }

  if (!jogador) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white px-4 text-center">
        <div>
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-bold">Jogador não encontrado (ID {jogadorId})</p>
        </div>
      </div>
    )
  }

  if (!perfil) return <TelaPerfil onCriar={p => setPerfil(p)} />

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-md mx-auto px-4 pt-4 pb-10 space-y-3">

        {/* Banner modo preview */}
        <div className="bg-[#1A0A30] border border-[#FFD23F]/40 rounded-xl px-4 py-2 flex items-center justify-between">
          <div>
            <p className="text-[#FFD23F] text-xs font-black">⚽ COBRA DA COPA — Preview</p>
            <p className="text-[#8AB4CC] text-[10px]">Modo gravação · pontos não contam</p>
          </div>
          <button
            onClick={() => {
              limparResultadoTeste(rodadaId)
              setJogoKey(k => k + 1)
            }}
            className="text-[#FFD23F] text-xs font-bold border border-[#FFD23F]/40 rounded-lg px-3 py-1.5 hover:bg-[#FFD23F]/10 transition-all"
          >
            ↺ Resetar
          </button>
        </div>

        {/* Jogo completo com o jogador específico */}
        <JogoDesafio
          key={jogoKey}
          jogador={jogador}
          rodadaId={rodadaId}
          perfil={perfil}
          mode="copa"
          indiceDesafio={0}
          temBottomNav={false}
          totalPistasMax={4}
          onResultado={p => setPerfil(p)}
          onContratosChange={() => {}}
        />

      </div>
    </main>
  )
}
