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

    setCriando(true)
    setErro('')

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
    const texto = `🏆 ${nomeSalvo ?? 'Liga Privada'} — Topa me vencer no ESCALA FC?\nEntre e adivinhe o mesmo jogador!\n${url}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: texto }); return } catch { return }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function irParaSala() {
    if (salaId) router.push(`/sala/${salaId}`)
  }

  // ── Loading ───────────────────────────────────────────────────
  if (!carregado) return null

  // ── Sem perfil — cria apelido primeiro ───────────────────────
  if (!perfil) {
    return <TelaPerfil onCriar={p => setPerfil(p)} />
  }

  // ── Tela pós-criação ─────────────────────────────────────────
  if (salaId) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'escala-fc.vercel.app'}/sala/${salaId}`
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSalaId(null)} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all">
              <ArrowLeft size={18} className="text-zinc-400" />
            </button>
            <div>
              <h1 className="text-xl font-black">🏆 Liga Criada!</h1>
              {nomeSalvo && <p className="text-purple-400 text-sm font-semibold">{nomeSalvo}</p>}
            </div>
          </div>

          {/* Código da sala */}
          <div className="bg-purple-950 border border-purple-700 rounded-2xl p-6 text-center space-y-2">
            <p className="text-purple-300 text-sm">Código de entrada</p>
            <p className="text-white font-black text-5xl tracking-[0.3em]">{salaId}</p>
            <p className="text-zinc-500 text-xs">Válida por 6 horas</p>
          </div>

          {/* Link para copiar */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <p className="flex-1 text-zinc-400 text-xs truncate font-mono">{url}</p>
            <button
              onClick={copiarLink}
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white transition-colors shrink-0"
            >
              {copiado ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={compartilharSala}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-base transition-all active:scale-95"
            >
              <Share2 size={18} />
              Compartilhar convite
            </button>
            <button
              onClick={irParaSala}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
            >
              Começar a jogar →
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Como funciona</p>
            <ul className="text-zinc-500 text-xs space-y-1">
              <li>• Compartilhe o link ou o código com seus amigos</li>
              <li>• Todo mundo joga <span className="text-white">o mesmo jogador</span></li>
              <li>• O placar atualiza ao vivo conforme cada um termina</li>
              <li>• Pontos da liga não afetam o ranking global</li>
            </ul>
          </div>
        </div>
      </main>
    )
  }

  // ── Tela inicial ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all">
            <ArrowLeft size={18} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-xl font-black">🏆 Liga Privada</h1>
            <p className="text-zinc-500 text-xs">Crie sua liga e desafie amigos</p>
          </div>
        </div>

        {/* Sem Supabase */}
        {!supabaseOk && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Liga offline</p>
            <p className="text-zinc-400 text-sm">
              Configure o Supabase para ativar ligas multiplayer.
            </p>
          </div>
        )}

        {/* Disponível */}
        {supabaseOk && (
          <div className="space-y-4">

            {/* Input do nome */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
              <p className="text-white font-bold text-sm">Dê um nome à sua liga</p>
              <div className="flex items-center gap-2 bg-zinc-800 border-2 border-zinc-600 focus-within:border-purple-500 rounded-xl px-4 py-3 transition-colors">
                <span className="text-purple-400 font-black text-base shrink-0">Liga</span>
                <input
                  type="text"
                  value={nomeLiga}
                  onChange={e => { setNomeLiga(e.target.value); setErro('') }}
                  placeholder="dos Brabos"
                  maxLength={24}
                  className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-base"
                  autoFocus
                />
              </div>
              {nomeLiga.trim() && (
                <p className="text-purple-400 text-xs font-semibold">
                  Ficará: <span className="text-white">Liga {nomeLiga.trim()}</span>
                </p>
              )}
            </div>

            {erro && (
              <div className="bg-red-950 border border-red-900 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{erro}</p>
              </div>
            )}

            <button
              onClick={handleCriarSala}
              disabled={criando || !nomeLiga.trim()}
              className="w-full bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black text-lg py-5 rounded-2xl transition-all active:scale-95"
            >
              {criando ? '⚙️ Criando liga...' : '🏆 Criar Liga'}
            </button>

            <div className="text-center">
              <p className="text-zinc-500 text-xs mb-2">Recebeu um código de liga?</p>
              <Link
                href="/sala/entrar"
                className="inline-block text-purple-400 text-sm font-semibold underline"
              >
                Entrar com código →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
