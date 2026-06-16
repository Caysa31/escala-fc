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
  return null
}
