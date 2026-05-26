'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const router = useRouter()

  useEffect(() => {
    localStorage.clear()
    router.replace('/')
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-500 animate-pulse text-lg">⚽ Preparando jogo...</p>
    </div>
  )
}
