'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const router = useRouter()
  const [confirmado, setConfirmado] = useState(false)

  function handleConfirmar() {
    setConfirmado(true)
    localStorage.clear()
    setTimeout(() => router.replace('/'), 800)
  }

  if (confirmado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-3xl animate-pulse">🐍</p>
          <p className="text-[#8AB4CC] animate-pulse text-lg">Reiniciando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-6 space-y-5 text-center">
        <p className="text-4xl">⚠️</p>
        <div>
          <h1 className="text-white font-black text-xl">Resetar o jogo?</h1>
          <p className="text-[#8AB4CC] text-sm mt-2">
            Isso apaga <span className="text-red-400 font-semibold">todos os seus dados</span>:
            perfil, pontos, sequência e contratos.
          </p>
          <p className="text-[#5A8AAA] text-xs mt-1">Essa ação não pode ser desfeita.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.replace('/')}
            className="flex-1 bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white font-semibold rounded-xl py-3 text-sm transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl py-3 text-sm transition-colors"
          >
            Sim, resetar
          </button>
        </div>
      </div>
    </div>
  )
}
