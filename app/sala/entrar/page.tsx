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
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3">
          <Link href="/sala" className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all">
            <ArrowLeft size={18} className="text-zinc-400" />
          </Link>
          <h1 className="text-xl font-black">Entrar na Sala</h1>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-zinc-400 text-xs block mb-2">Código da sala</label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleEntrar()}
              placeholder="Ex: KRTA47"
              maxLength={8}
              className="w-full bg-zinc-700 text-white rounded-xl px-4 py-4 text-xl font-mono font-black tracking-[0.3em] uppercase outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600 placeholder:font-normal placeholder:text-base placeholder:tracking-normal text-center"
            />
          </div>

          {erro && <p className="text-red-400 text-sm text-center">{erro}</p>}

          <button
            onClick={handleEntrar}
            disabled={buscando || codigo.trim().length < 4}
            className="w-full bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-4 rounded-xl transition-all"
          >
            {buscando ? 'Buscando...' : 'Entrar na Sala →'}
          </button>
        </div>

        <p className="text-zinc-500 text-xs text-center">
          Peça o código de 6 letras para quem criou a sala
        </p>
      </div>
    </main>
  )
}
