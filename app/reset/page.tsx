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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse text-lg">⚽ Reiniciando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-5 text-center">
        <p className="text-4xl">⚠️</p>
        <div>
          <h1 className="text-white font-black text-xl">Resetar o jogo?</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Isso apaga <span className="text-red-400 font-semibold">todos os seus dados</span>:
            perfil, pontos, streak e contratos.
          </p>
          <p className="text-zinc-600 text-xs mt-1">Essa ação não pode ser desfeita.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.replace('/')}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
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
