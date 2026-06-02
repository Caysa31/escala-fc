'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getSala } from '@/lib/supabase'

export default function EntrarSalaPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleEntrar() {
    const cod = codigo.trim().toUpperCase()
    if (cod.length < 4) { setErro('Digite o código da sala'); return }
    setBuscando(true)
    setErro('')
    const sala = await getSala(cod)
    setBuscando(false)
    if (!sala) { setErro('Sala não encontrada. Verifique o código.'); return }

    const expirou = new Date(sala.expira_em) < new Date()
    if (expirou) { setErro('Esta sala já expirou. Peça ao criador que abra uma nova.'); return }

    router.push(`/sala/${cod}`)
  }

  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">

        <div className="flex items-center gap-3">
          <Link href="/sala" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black">⚔️ Entrar na Liga</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">Digite o código que você recebeu</p>
          </div>
          <div className="w-9 shrink-0" />
        </div>

        <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-[#8AB4CC] text-xs block mb-2">Código da liga</label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleEntrar()}
              placeholder="Ex: KRTA47"
              maxLength={8}
              className="w-full bg-[#0A1626] border-2 border-[#1A3A5C] focus:border-[#00C853] text-white rounded-xl px-4 py-4 text-xl font-mono font-black tracking-[0.3em] uppercase outline-none transition-colors placeholder:text-[#5A8AAA] placeholder:font-normal placeholder:text-base placeholder:tracking-normal text-center"
            />
          </div>

          {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}

          <button
            onClick={handleEntrar}
            disabled={buscando || codigo.trim().length < 4}
            className="w-full bg-[#00C853] hover:bg-[#00E060] disabled:bg-[#1A3A5C] disabled:text-[#8AB4CC] text-[#0A1626] font-black py-4 rounded-xl transition-all"
          >
            {buscando ? 'Buscando...' : 'Entrar na Liga →'}
          </button>
        </div>

        <p className="text-[#8AB4CC] text-xs text-center">
          Peça o código de 6 letras para quem criou a liga
        </p>
      </div>
    </main>
  )
}
