'use client'

import { useState } from 'react'
import { Perfil } from '@/lib/types'
import { criarPerfil } from '@/lib/perfil'
import { Flame, Trophy, Target, Percent } from 'lucide-react'

interface TelaPerfilProps {
  onCriar: (perfil: Perfil) => void
}

export default function TelaPerfil({ onCriar }: TelaPerfilProps) {
  const [apelido, setApelido] = useState('')
  const [erro, setErro] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nome = apelido.trim()
    if (!nome) {
      setErro('Digite um apelido para continuar')
      return
    }
    if (nome.length < 2) {
      setErro('Apelido muito curto (mínimo 2 caracteres)')
      return
    }
    const perfil = criarPerfil(nome)
    onCriar(perfil)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tight">
            ⚽ ESCALA FC
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Adivinhe o jogador do dia com o mínimo de pistas
          </p>
        </div>

        {/* Como funciona */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
          <p className="text-white font-bold text-sm">Como funciona:</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>🔒 Pistas reveladas uma por vez</p>
            <p>⬇️ Quanto menos pistas, mais pontos</p>
            <p>🟩 Compartilhe sem spoiler</p>
            <p>🔥 Jogue todo dia para manter sua sequência</p>
          </div>
        </div>

        {/* Form de apelido */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Escolha seu apelido:
            </label>
            <input
              type="text"
              value={apelido}
              onChange={e => { setApelido(e.target.value); setErro('') }}
              placeholder="Ex: CraqueDaSala"
              maxLength={20}
              className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-green-400 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors text-base"
              autoFocus
            />
            {erro && <p className="text-red-400 text-xs mt-1">{erro}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-lg rounded-xl py-4 transition-colors"
          >
            ENTRAR NO JOGO
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs">
          Sem cadastro. Sem e-mail. Sem senha.
          <br />
          Seu progresso é salvo automaticamente.
        </p>
      </div>
    </div>
  )
}

// --- Componente de stats do perfil (usado no header do jogo) ---

interface StatsPerfilProps {
  perfil: Perfil
}

export function StatsPerfil({ perfil }: StatsPerfilProps) {
  const taxa = perfil.rodadasJogadas > 0
    ? Math.round((perfil.rodadasAcertadas / perfil.rodadasJogadas) * 100)
    : 0

  return (
    <div className="grid grid-cols-4 gap-2">
      <StatCard icon={<Flame size={16} className="text-orange-400" />} valor={perfil.streakAtual} label="Sequência" />
      <StatCard icon={<Trophy size={16} className="text-yellow-400" />} valor={perfil.pontosTotal} label="Pontos" />
      <StatCard icon={<Target size={16} className="text-blue-400" />} valor={perfil.rodadasJogadas} label="Jogos" />
      <StatCard icon={<Percent size={16} className="text-green-400" />} valor={`${taxa}%`} label="Acerto" />
    </div>
  )
}

function StatCard({ icon, valor, label }: { icon: React.ReactNode; valor: number | string; label: string }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white font-bold text-lg leading-none">{valor}</p>
      <p className="text-zinc-500 text-xs mt-1">{label}</p>
    </div>
  )
}
