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
  const [criando, setCriando] = useState(false)
  const [salaId, setSalaId] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  const supabaseOk = isSupabaseConfigurado()

  useEffect(() => {
    setPerfil(carregarPerfil())
  }, [])

  async function handleCriarSala() {
    if (!perfil) return
    setCriando(true)
    setErro('')

    // Usa o primeiro desafio do dia como player da sala
    const { jogador } = getJogadoresDoDia()[0]
    const id = await criarSala(jogador.id, perfil.apelido)
    setCriando(false)

    if (!id) { setErro('Erro ao criar sala. Tente novamente.'); return }
    setSalaId(id)
  }

  function copiarLink() {
    const url = `${window.location.origin}/sala/${salaId}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function compartilharWhatsApp() {
    const url = `${window.location.origin}/sala/${salaId}`
    const texto = `🏆 Topa me vencer no ESCALA FC? Entre na minha sala e adivinhe o mesmo jogador!\n${url}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: texto }); return } catch { return }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function irParaSala() {
    if (salaId) router.push(`/sala/${salaId}`)
  }

  // ── Sem perfil — mostra criação de apelido ───────────────────
  if (!perfil) {
    return <TelaPerfil onCriar={p => setPerfil(p)} />
  }

  // ── Tela pós-criação ─────────────────────────────────────────
  if (salaId) {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'escalafe.com.br'}/sala/${salaId}`
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSalaId(null)} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all">
              <ArrowLeft size={18} className="text-zinc-400" />
            </button>
            <h1 className="text-xl font-black">⚔️ Sala Criada!</h1>
          </div>

          {/* Código da sala */}
          <div className="bg-purple-950 border border-purple-700 rounded-2xl p-6 text-center space-y-2">
            <p className="text-purple-300 text-sm">Código da sala</p>
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
              onClick={compartilharWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-base transition-all"
            >
              <Share2 size={18} />
              Compartilhar no WhatsApp
            </button>
            <button
              onClick={irParaSala}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-sm transition-all"
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
              <li>• Pontos contam para o seu ranking geral</li>
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
            <h1 className="text-xl font-black">⚔️ Sala Privada</h1>
            <p className="text-zinc-500 text-xs">Desafie seus amigos no mesmo jogador</p>
          </div>
        </div>

        {/* Sem Supabase */}
        {!supabaseOk && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Sala offline</p>
            <p className="text-zinc-400 text-sm">
              Configure o Supabase para ativar salas multiplayer.
            </p>
          </div>
        )}

        {/* Disponível */}
        {supabaseOk && (
          <>
            <div className="bg-purple-950 border border-purple-800 rounded-2xl p-6 text-center space-y-3">
              <p className="text-5xl">⚔️</p>
              <div>
                <p className="text-white font-black text-lg">Crie uma sala e desafie amigos</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Todos jogam o <span className="text-purple-300 font-semibold">desafio do dia</span> — o placar é ao vivo!
                </p>
              </div>
            </div>

            {erro && (
              <div className="bg-red-950 border border-red-900 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{erro}</p>
              </div>
            )}

            <button
              onClick={handleCriarSala}
              disabled={criando}
              className="w-full bg-purple-700 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black text-lg py-5 rounded-2xl transition-all"
            >
              {criando ? '⚙️ Criando sala...' : '⚔️ Criar Sala'}
            </button>

            <div className="text-center">
              <p className="text-zinc-500 text-xs mb-2">Recebeu um código de sala?</p>
              <Link
                href="/sala/entrar"
                className="inline-block text-purple-400 text-sm font-semibold underline"
              >
                Entrar com código →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
