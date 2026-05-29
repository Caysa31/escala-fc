'use client'

import { useState, useEffect } from 'react'
import {
  criarGrupo, entrarGrupo, getGruposDoUsuario, getRankingGrupo, isSupabaseConfigurado
} from '@/lib/supabase'
import { Flame, Trophy, ArrowLeft, Users, Plus, LogIn, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Grupo {
  id: string
  nome: string
  codigo: string
}

interface EntradaRankingGrupo {
  id: string
  apelido: string
  pontos_semana: number
  streak_atual: number
}

export default function GruposPage() {
  const [tela, setTela] = useState<'lista' | 'criar' | 'entrar' | 'ranking'>('lista')
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoAtivo, setGrupoAtivo] = useState<Grupo | null>(null)
  const [rankingGrupo, setRankingGrupo] = useState<EntradaRankingGrupo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  // Formulários
  const [nomeGrupo, setNomeGrupo] = useState('')
  const [codigoEntrar, setCodigoEntrar] = useState('')
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const supabaseOk = isSupabaseConfigurado()

  useEffect(() => {
    const id = localStorage.getItem('escalafc_supabase_id')
    setUsuarioId(id)
  }, [])

  useEffect(() => {
    if (!supabaseOk || !usuarioId) {
      setCarregando(false)
      return
    }
    async function carregar() {
      setCarregando(true)
      const lista = await getGruposDoUsuario(usuarioId!)
      setGrupos(lista as Grupo[])
      setCarregando(false)
    }
    carregar()
  }, [supabaseOk, usuarioId])

  async function handleCriar() {
    if (!nomeGrupo.trim()) { setErro('Digite um nome para o grupo'); return }
    if (!usuarioId) { setErro('Perfil não sincronizado. Jogue uma partida primeiro.'); return }
    setSalvando(true)
    setErro('')
    const grupo = await criarGrupo(nomeGrupo.trim(), usuarioId)
    setSalvando(false)
    if (!grupo) { setErro('Erro ao criar grupo. Tente novamente.'); return }
    setGrupos(prev => [...prev, grupo as Grupo])
    setNomeGrupo('')
    setTela('lista')
  }

  async function handleEntrar() {
    const cod = codigoEntrar.trim().toUpperCase()
    if (!cod) { setErro('Digite o código do grupo'); return }
    if (!usuarioId) { setErro('Perfil não sincronizado. Jogue uma partida primeiro.'); return }
    setSalvando(true)
    setErro('')
    const grupo = await entrarGrupo(cod, usuarioId)
    setSalvando(false)
    if (!grupo) { setErro('Código inválido. Verifique e tente novamente.'); return }
    // evitar duplicata na lista
    setGrupos(prev => prev.find(g => g.id === (grupo as Grupo).id) ? prev : [...prev, grupo as Grupo])
    setCodigoEntrar('')
    setTela('lista')
  }

  async function abrirRanking(grupo: Grupo) {
    setGrupoAtivo(grupo)
    setTela('ranking')
    const dados = await getRankingGrupo(grupo.id)
    setRankingGrupo(dados as EntradaRankingGrupo[])
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // ── Tela: ranking do grupo ──────────────────────────────────────
  if (tela === 'ranking' && grupoAtivo) {
    const meuId = usuarioId
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <header className="flex items-center gap-3">
            <button onClick={() => setTela('lista')} className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black">{grupoAtivo.nome}</h1>
              <p className="text-zinc-500 text-xs">Ranking da semana</p>
            </div>
          </header>

          {/* Código do grupo */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs">Código de convite</p>
              <p className="font-black text-green-400 tracking-widest">{grupoAtivo.codigo}</p>
            </div>
            <button
              onClick={() => copiarCodigo(grupoAtivo.codigo)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {copiado ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {rankingGrupo.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <p className="text-3xl mb-2">👥</p>
                <p>Ninguém jogou ainda essa semana</p>
                <p className="text-xs mt-1">Compartilhe o código e desafie os amigos!</p>
              </div>
            ) : (
              rankingGrupo.map((entrada, i) => {
                const pos = i + 1
                const sou = entrada.id === meuId
                return (
                  <div
                    key={entrada.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl
                      ${sou ? 'bg-green-950 border border-green-700' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-8 text-center font-black text-sm flex-shrink-0
                      ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-zinc-300' : pos === 3 ? 'text-orange-400' : 'text-zinc-500'}`}>
                      {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${sou ? 'text-green-300' : 'text-white'}`}>
                        {entrada.apelido} {sou && '(você)'}
                      </p>
                    </div>
                    {entrada.streak_atual > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame size={12} />
                        <span>{entrada.streak_atual}</span>
                      </div>
                    )}
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-white text-sm">{entrada.pontos_semana ?? 0}</p>
                      <p className="text-zinc-500 text-xs">pts</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    )
  }

  // ── Tela: criar grupo ───────────────────────────────────────────
  if (tela === 'criar') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <header className="flex items-center gap-3">
            <button onClick={() => { setTela('lista'); setErro('') }} className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black">Criar grupo</h1>
          </header>

          <div className="bg-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-zinc-400 text-xs block mb-2">Nome do grupo</label>
              <input
                type="text"
                value={nomeGrupo}
                onChange={e => setNomeGrupo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCriar()}
                placeholder="Ex: Trampolim FC, Familia Silva..."
                maxLength={30}
                className="w-full bg-zinc-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder:text-zinc-500"
              />
            </div>

            {erro && <p className="text-red-400 text-xs">{erro}</p>}

            <button
              onClick={handleCriar}
              disabled={salvando || !nomeGrupo.trim()}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {salvando ? 'Criando...' : 'Criar grupo'}
            </button>
          </div>

          <p className="text-zinc-500 text-xs text-center">
            Um código de convite será gerado automaticamente para você compartilhar com amigos.
          </p>
        </div>
      </main>
    )
  }

  // ── Tela: entrar em grupo ───────────────────────────────────────
  if (tela === 'entrar') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <header className="flex items-center gap-3">
            <button onClick={() => { setTela('lista'); setErro('') }} className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black">Entrar em grupo</h1>
          </header>

          <div className="bg-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-zinc-400 text-xs block mb-2">Código do grupo</label>
              <input
                type="text"
                value={codigoEntrar}
                onChange={e => setCodigoEntrar(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleEntrar()}
                placeholder="Ex: TRAM-2026"
                maxLength={12}
                className="w-full bg-zinc-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder:text-zinc-500 tracking-widest font-mono"
              />
            </div>

            {erro && <p className="text-red-400 text-xs">{erro}</p>}

            <button
              onClick={handleEntrar}
              disabled={salvando || !codigoEntrar.trim()}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {salvando ? 'Entrando...' : 'Entrar no grupo'}
            </button>
          </div>

          <p className="text-zinc-500 text-xs text-center">
            Peça o código para quem criou o grupo.
          </p>
        </div>
      </main>
    )
  }

  // ── Tela: lista de grupos ───────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Users size={20} className="text-green-400" />
              Grupos
            </h1>
            <p className="text-zinc-500 text-xs">Ranking privado com seus amigos</p>
          </div>
        </header>

        {/* Ações */}
        {supabaseOk && (
          <div className="flex gap-2">
            <button
              onClick={() => { setTela('criar'); setErro('') }}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm py-3 rounded-xl transition-all"
            >
              <Plus size={16} />
              Criar grupo
            </button>
            <button
              onClick={() => { setTela('entrar'); setErro('') }}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-sm py-3 rounded-xl transition-all"
            >
              <LogIn size={16} />
              Entrar com código
            </button>
          </div>
        )}

        {/* Sem Supabase */}
        {!supabaseOk && (
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Grupos offline</p>
            <p className="text-zinc-400 text-sm">
              Configure o Supabase no <code className="text-green-400">.env.local</code> para
              ativar grupos e rankings privados com amigos.
            </p>
            <p className="text-zinc-500 text-xs">
              Veja o arquivo <code>.env.local.example</code> na pasta do projeto.
            </p>
          </div>
        )}

        {/* Sem perfil sincronizado */}
        {supabaseOk && !usuarioId && !carregando && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 text-center space-y-2">
            <p className="text-2xl">👤</p>
            <p className="text-white font-bold text-sm">Perfil não sincronizado</p>
            <p className="text-zinc-400 text-xs">
              Jogue uma partida para criar seu perfil online e então acesse os grupos.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all"
            >
              Jogar agora
            </Link>
          </div>
        )}

        {/* Lista de grupos */}
        {supabaseOk && usuarioId && (
          <div className="space-y-2">
            {carregando ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-xl h-16 animate-pulse" />
              ))
            ) : grupos.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <p className="text-3xl mb-2">👥</p>
                <p>Você não está em nenhum grupo</p>
                <p className="text-xs mt-1">Crie um ou entre com o código de um amigo!</p>
              </div>
            ) : (
              grupos.map(grupo => (
                <button
                  key={grupo.id}
                  onClick={() => abrirRanking(grupo)}
                  className="w-full flex items-center gap-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-4 text-left transition-all"
                >
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{grupo.nome}</p>
                    <p className="text-zinc-500 text-xs font-mono tracking-wider">{grupo.codigo}</p>
                  </div>
                  <Trophy size={16} className="text-zinc-500 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Como funciona */}
        {supabaseOk && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Como funciona</p>
            <ul className="text-zinc-500 text-xs space-y-1">
              <li>• Crie um grupo e compartilhe o código com amigos</li>
              <li>• O ranking mostra os pontos de cada semana</li>
              <li>• Quem jogar todo dia acumula mais pontos e aumenta a sequência 🔥</li>
              <li>• O ranking reseta toda segunda-feira às 00h</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
