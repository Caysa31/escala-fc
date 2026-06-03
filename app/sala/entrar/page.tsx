'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getLiga, entrarLiga } from '@/lib/supabase'
import { carregarPerfil } from '@/lib/perfil'

export default function EntrarSalaPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleEntrar() {
    const cod = codigo.trim().toUpperCase()
    if (cod.length < 4) { setErro('Digite o código da liga'); return }
    setBuscando(true)
    setErro('')

    const liga = await getLiga(cod)
    setBuscando(false)
    if (!liga) { setErro('Liga não encontrada. Verifique o código.'); return }
    if (!liga.ativa) { setErro('Esta liga já foi encerrada.'); return }

    // Entra na liga registrando pontos atuais como base
    const perfil = carregarPerfil()
    const pontosBase = perfil?.pontosTotal ?? 0
    const apelido = perfil?.apelido ?? 'Visitante'
    await entrarLiga(cod, apelido, pontosBase)

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

        {/* Brasão da Liga */}
        <div className="flex flex-col items-center pt-6 pb-8 gap-3">
          <svg viewBox="0 0 240 290" xmlns="http://www.w3.org/2000/svg" className="w-52 h-auto drop-shadow-xl">

            {/* Sombra do escudo */}
            <path d="M12 14 L228 14 L228 196 L120 278 L12 196 Z"
              fill="#000" opacity="0.3" transform="translate(3,4)" />

            {/* Escudo — fundo principal */}
            <path d="M12 14 L228 14 L228 196 L120 278 L12 196 Z"
              fill="#0A1626" stroke="#FFD23F" strokeWidth="3" strokeLinejoin="round" />

            {/* Escudo — borda interna */}
            <path d="M22 24 L218 24 L218 190 L120 266 L22 190 Z"
              fill="none" stroke="#1A3A5C" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Faixa do topo */}
            <path d="M22 24 L218 24 L218 66 L22 66 Z" fill="#0F1D30" />
            <line x1="22" y1="66" x2="218" y2="66" stroke="#FFD23F" strokeWidth="1.5" />

            {/* Estrelas decorativas no topo */}
            <text x="50" y="52" textAnchor="middle" fill="#FFD23F" fontSize="12">★</text>
            <text x="80" y="52" textAnchor="middle" fill="#FFD23F" fontSize="12">★</text>
            <text x="120" y="52" textAnchor="middle" fill="#FFD23F" fontSize="14">★</text>
            <text x="160" y="52" textAnchor="middle" fill="#FFD23F" fontSize="12">★</text>
            <text x="190" y="52" textAnchor="middle" fill="#FFD23F" fontSize="12">★</text>

            {/* "LIGA PRIVADA" no topo */}
            <text x="120" y="43" textAnchor="middle" fill="#8AB4CC"
              fontSize="10.5" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="3">
              LIGA PRIVADA
            </text>

            {/* Cobra — símbolo principal */}
            <text x="120" y="170" textAnchor="middle" fontSize="88">🐍</text>

            {/* Faixa do rodapé */}
            <line x1="40" y1="186" x2="200" y2="186" stroke="#FFD23F" strokeWidth="1.5" />

            {/* Pontos decorativos */}
            <circle cx="56" cy="210" r="3" fill="#FFD23F" />
            <circle cx="184" cy="210" r="3" fill="#FFD23F" />

            {/* "COBRA" — nome principal */}
            <text x="120" y="218" textAnchor="middle" fill="#FFD23F"
              fontSize="26" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="7">
              COBRA
            </text>

          </svg>

          <p className="text-[#5A8AAA] text-[10px] tracking-widest uppercase">Entre com seu código para competir</p>
        </div>

      </div>
    </main>
  )
}
