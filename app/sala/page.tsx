'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check, Share2 } from 'lucide-react'
import { Perfil } from '@/lib/types'
import { carregarPerfil } from '@/lib/perfil'
import { getJogadoresDoDia } from '@/lib/game'
import { criarSala, isSupabaseConfigurado } from '@/lib/supabase'
import TelaPerfil from '@/components/TelaPerfil'

export default function SalaPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [nomeLiga, setNomeLiga] = useState('')
  const [criando, setCriando] = useState(false)
  const [salaId, setSalaId] = useState<string | null>(null)
  const [nomeSalvo, setNomeSalvo] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  const supabaseOk = isSupabaseConfigurado()

  useEffect(() => {
    setPerfil(carregarPerfil())
    setCarregado(true)
  }, [])

  async function handleCriarSala() {
    if (!perfil) return
    if (!nomeLiga.trim()) { setErro('Escolha um nome para a liga'); return }
    setCriando(true); setErro('')
    const nomeFormatado = `Liga ${nomeLiga.trim()}`
    const { jogador } = getJogadoresDoDia()[0]
    const id = await criarSala(jogador.id, perfil.apelido, nomeFormatado)
    setCriando(false)
    if (!id) { setErro('Erro ao criar sala. Tente novamente.'); return }
    setNomeSalvo(nomeFormatado)
    setSalaId(id)
  }

  function copiarLink() {
    const url = `${window.location.origin}/sala/${salaId}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function compartilharSala() {
    const url = `${window.location.origin}/sala/${salaId}`
    const texto = `🏆 ${nomeSalvo ?? 'Liga Privada'} — Topa me vencer no COBRA?\nEntre e adivinhe o mesmo jogador!\n${url}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: texto }); return } catch { return }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function irParaSala() {
    if (salaId) router.push(`/sala/${salaId}`)
  }

  if (!carregado) return null
  if (!perfil) return <TelaPerfil onCriar={p => setPerfil(p)} />

  // ── Tela pós-criação ─────────────────────────────────────────
  if (salaId) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/sala/${salaId}`
    return (
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 pt-5 pb-10 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSalaId(null)} className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all">
              <ArrowLeft size={18} className="text-[#8AB4CC]" />
            </button>
            <div>
              <h1 className="text-xl font-black">🏆 Liga Criada!</h1>
              {nomeSalvo && <p className="text-[#00C853] text-sm font-semibold">{nomeSalvo}</p>}
            </div>
          </div>

          {/* Código */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-6 text-center space-y-2">
            <p className="text-[#8AB4CC] text-xs font-semibold uppercase tracking-widest">Código de entrada</p>
            <p className="text-[#FFD23F] font-black text-5xl tracking-[0.3em]">{salaId}</p>
            <p className="text-[#5A8AAA] text-xs">Válida por 6 horas</p>
          </div>

          {/* Link */}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 flex items-center gap-3">
            <p className="flex-1 text-[#8AB4CC] text-xs truncate font-mono">{url}</p>
            <button onClick={copiarLink} className="flex items-center gap-1 text-xs text-[#8AB4CC] hover:text-white transition-colors shrink-0">
              {copiado ? <Check size={14} className="text-[#00C853]" /> : <Copy size={14} />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="space-y-2">
            <button onClick={compartilharSala}
              className="w-full flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold py-4 rounded-xl text-base transition-all active:scale-95">
              <Share2 size={18} /> Compartilhar convite
            </button>
            <button onClick={irParaSala}
              className="w-full bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95">
              Começar a jogar →
            </button>
          </div>

          <div className="bg-[#0A1020] border border-[#1A3A5C]/50 rounded-xl p-4 space-y-1">
            <p className="text-[#8AB4CC] text-xs font-bold uppercase tracking-wider">Como funciona</p>
            <ul className="text-[#5A8AAA] text-xs space-y-1">
              <li>• Compartilhe o link ou o código com seus amigos</li>
              <li>• Todo mundo joga <span className="text-white">o mesmo jogador</span></li>
              <li>• O placar atualiza ao vivo conforme cada um termina</li>
            </ul>
          </div>
        </div>
      </main>
    )
  }

  // ── Tela inicial ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-10 space-y-4">

        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black">⚔️ Liga Privada</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">Crie sua liga e desafie amigos</p>
          </div>
          <div className="w-9 shrink-0" />
        </div>

        {!supabaseOk && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Liga offline</p>
            <p className="text-[#8AB4CC] text-sm">Configure o Supabase para ativar ligas multiplayer.</p>
          </div>
        )}

        {supabaseOk && (
          <div className="space-y-4">
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-5 space-y-3">
              <p className="text-white font-bold text-sm">Dê um nome à sua liga</p>
              <div className="flex items-center gap-2 bg-[#0A1626] border-2 border-[#1A3A5C] focus-within:border-[#00C853] rounded-xl px-4 py-3 transition-colors">
                <span className="text-[#00C853] font-black text-base shrink-0">Liga</span>
                <input
                  type="text"
                  value={nomeLiga}
                  onChange={e => { setNomeLiga(e.target.value); setErro('') }}
                  placeholder="dos Brabos"
                  maxLength={24}
                  className="flex-1 bg-transparent text-white placeholder-[#2A4A6A] outline-none text-base"
                  autoFocus
                />
              </div>
              {nomeLiga.trim() && (
                <p className="text-[#8AB4CC] text-xs">
                  Ficará: <span className="text-white font-semibold">Liga {nomeLiga.trim()}</span>
                </p>
              )}
            </div>

            {erro && (
              <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{erro}</p>
              </div>
            )}

            <button
              onClick={handleCriarSala}
              disabled={criando || !nomeLiga.trim()}
              className="w-full bg-[#00C853] hover:bg-[#00E060] disabled:bg-[#1A3A5C] disabled:text-[#8AB4CC] text-[#0A1626] font-black text-lg py-5 rounded-2xl transition-all active:scale-95"
            >
              {criando ? '⚙️ Criando liga...' : '🏆 Criar Liga'}
            </button>

            <div className="text-center">
              <p className="text-[#8AB4CC] text-xs mb-2">Recebeu um código de liga?</p>
              <Link href="/sala/entrar" className="text-[#00C853] text-sm font-semibold underline">
                Entrar com código →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
