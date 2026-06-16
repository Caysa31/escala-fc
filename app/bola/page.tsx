'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setModeAtual } from '@/lib/gameMode'

export default function BolaRedirect() {
  const router = useRouter()
  useEffect(() => {
    setModeAtual('bola')
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="text-4xl animate-bounce">🐍</div>
      <div className="text-[#00C853] font-black text-xl tracking-widest">COBRA DA BOLA</div>
      <div className="text-[#1A3A5C] text-xs animate-pulse">carregando...</div>
    </div>
  )
}
