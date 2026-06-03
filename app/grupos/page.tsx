'use client'

import { useState, useEffect } from 'react'
import { criarGrupo, entrarGrupo, getGruposDoUsuario, getRankingGrupo, isSupabaseConfigurado } from '@/lib/supabase'
import { Flame, Trophy, ArrowLeft, Users, Plus, LogIn, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Grupo { id: string; nome: string; codigo: string }
interface EntradaRankingGrupo { id: string; apelido: string; pontos_semana: number; streak_atual: number }

export default function GruposPage() {
  const [tela, setTela] = useState<'lista' | 'criar' | 'entrar' | 'ranking'>('lista')
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoAtivo, setGrupoAtivo] = useState<Grupo | null>(null)
  const [rankingGrupo, setRankingGrupo] = useState<EntradaRankingGrupo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [nomeGrupo, setNomeGrupo] = useState('')
  const [codigoEntrar, setCodigoEntrar] = useState('')
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const supabaseOk = isSupabaseConfigurado()

  useEffect(() => { setUsuarioId(localStorage.getItem('escalafc_supabase_id')) }, [])

  useEffect(() => {
    if (!supabaseOk || !usuarioId) { setCarregando(false); return }
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
    setSalvando(true); setErro('')
    const grupo = await criarGrupo(nomeGrupo.trim(), usuarioId)
    setSalvando(false)
    if (!grupo) { setErro('Erro ao criar grupo. Tente novamente.'); return }
    setGrupos(prev => [...prev, grupo as Grupo])
    setNomeGrupo(''); setTela('lista')
  }

  async function handleEntrar() {
    const cod = codigoEntrar.trim().toUpperCase()
    if (!cod) { setErro('Digite o código do grupo'); return }
    if (!usuarioId) { setErro('Perfil não sincronizado. Jogue uma partida primeiro.'); return }
    setSalvando(true); setErro('')
    const grupo = await entrarGrupo(cod, usuarioId)
    setSalvando(false)
    if (!grupo) { setErro('Código inválido. Verifique e tente novamente.'); return }
    setGrupos(prev => prev.find(g => g.id === (grupo as Grupo).id) ? prev : [...prev, grupo as Grupo])
    setCodigoEntrar(''); setTela('lista')
  }

  async function abrirRanking(grupo: Grupo) {
    setGrupoAtivo(grupo); setTela('ranking')
    const dados = await getRankingGrupo(grupo.id)
    setRankingGrupo(dados as EntradaRankingGrupo[])
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo).catch(() => {})
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  const headerBack = (onClick: () => void, titulo: string, sub?: string) => (
    <header className="flex items-center gap-3">
      <button onClick={onClick} className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
        <ArrowLeft size={18} className="text-[#8AB4CC]" />
      </button>
      <div className="flex-1 text-center">
        <h1 className="text-2xl font-black">{titulo}</h1>
        {sub && <p className="text-[#8AB4CC] text-xs mt-0.5">{sub}</p>}
      </div>
      <div className="w-9 shrink-0" />
    </header>
  )

  // ── Ranking do grupo ──────────────────────────────────────────────
  if (tela === 'ranking' && grupoAtivo) {
    return (
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">
          {headerBack(() => setTela('lista'), grupoAtivo.nome, 'Ranking da semana')}

          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[#8AB4CC] text-xs">Código de convite</p>
              <p className="font-black text-[#00C853] tracking-widest">{grupoAtivo.codigo}</p>
            </div>
            <button onClick={() => copiarCodigo(grupoAtivo.codigo)} className="flex items-center gap-1 text-xs text-[#8AB4CC] hover:text-white transition-colors">
              {copiado ? <Check size={14} className="text-[#00C853]" /> : <Copy size={14} />}
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="space-y-2">
            {rankingGrupo.length === 0 ? (
              <div className="text-center py-10 text-[#8AB4CC]">
                <p className="text-3xl mb-2">👥</p>
                <p>Ninguém jogou ainda essa semana</p>
                <p className="text-xs mt-1">Compartilhe o código e desafie os amigos!</p>
              </div>
            ) : rankingGrupo.map((entrada, i) => {
              const pos = i + 1; const sou = entrada.id === usuarioId
              const medalha = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null
              return (
                <div key={entrada.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${sou ? 'bg-[#071A0F] border-[#00C853]/40' : 'bg-[#0F1D30] border-[#1A3A5C]'}`}>
                  <div className={`w-8 text-center font-black text-sm flex-shrink-0 ${pos === 1 ? 'text-[#FFD23F]' : pos === 2 ? 'text-[#C8C8C8]' : pos === 3 ? 'text-[#CD7F32]' : 'text-[#8AB4CC]'}`}>
                    {medalha ?? `#${pos}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${sou ? 'text-[#00C853]' : 'text-white'}`}>{entrada.apelido} {sou && '(você)'}</p>
                  </div>
                  {entrada.streak_atual > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[#FFD23F]><Flame size={12} /><span>{entrada.streak_atual}</span></div>
                  )}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-[#FFD23F] text-sm">{entrada.pontos_semana ?? 0}</p>
                    <p className="text-[#5A8AAA] text-xs">pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <BottomNav />
      </main>
    )
  }

  // ── Criar grupo ───────────────────────────────────────────────────
  if (tela === 'criar') {
    return (
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">
          {headerBack(() => { setTela('lista'); setErro('') }, 'Criar grupo')}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-5 space-y-4">
            <div>
              <label className="text-[#8AB4CC] text-xs block mb-2">Nome do grupo</label>
              <input type="text" value={nomeGrupo} onChange={e => setNomeGrupo(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCriar()}
                placeholder="Ex: Trampolim FC, Familia Silva..." maxLength={30}
                className="w-full bg-[#0A1626] border border-[#1A3A5C] focus:border-[#00C853] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#5A8AAA]" />
            </div>
            {erro && <p className="text-red-400 text-xs">{erro}</p>}
            <button onClick={handleCriar} disabled={salvando || !nomeGrupo.trim()}
              className="w-full bg-[#00C853] hover:bg-[#00E060] disabled:bg-[#1A3A5C] disabled:text-[#8AB4CC] text-[#0A1626] font-black py-3 rounded-xl transition-all">
              {salvando ? 'Criando...' : 'Criar grupo'}
            </button>
          </div>
          <p className="text-[#8AB4CC] text-xs text-center">Um código de convite será gerado automaticamente.</p>
        </div>
        <BottomNav />
      </main>
    )
  }

  // ── Entrar em grupo ───────────────────────────────────────────────
  if (tela === 'entrar') {
    return (
      <main className="min-h-screen bg-[#0A1626] text-white">
        <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">
          {headerBack(() => { setTela('lista'); setErro('') }, 'Entrar em grupo')}
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-5 space-y-4">
            <div>
              <label className="text-[#8AB4CC] text-xs block mb-2">Código do grupo</label>
              <input type="text" value={codigoEntrar} onChange={e => setCodigoEntrar(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleEntrar()}
                placeholder="Ex: TRAM-2026" maxLength={12}
                className="w-full bg-[#0A1626] border border-[#1A3A5C] focus:border-[#00C853] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#5A8AAA] tracking-widest font-mono" />
            </div>
            {erro && <p className="text-red-400 text-xs">{erro}</p>}
            <button onClick={handleEntrar} disabled={salvando || !codigoEntrar.trim()}
              className="w-full bg-[#00C853] hover:bg-[#00E060] disabled:bg-[#1A3A5C] disabled:text-[#8AB4CC] text-[#0A1626] font-black py-3 rounded-xl transition-all">
              {salvando ? 'Entrando...' : 'Entrar no grupo'}
            </button>
          </div>
          <p className="text-[#8AB4CC] text-xs text-center">Peça o código para quem criou o grupo.</p>
        </div>
        <BottomNav />
      </main>
    )
  }

  // ── Lista de grupos ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A1626] text-white">
      <div className="max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">

        <header className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 transition-all shrink-0">
            <ArrowLeft size={18} className="text-[#8AB4CC]" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-black">👥 Grupos</h1>
            <p className="text-[#8AB4CC] text-xs mt-0.5">Ranking privado com seus amigos</p>
          </div>
          <div className="w-9 shrink-0" />
        </header>

        {supabaseOk && (
          <div className="flex gap-2">
            <button onClick={() => { setTela('criar'); setErro('') }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold text-sm py-3 rounded-xl transition-all">
              <Plus size={16} /> Criar grupo
            </button>
            <button onClick={() => { setTela('entrar'); setErro('') }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 text-white font-semibold text-sm py-3 rounded-xl transition-all">
              <LogIn size={16} /> Entrar com código
            </button>
          </div>
        )}

        {!supabaseOk && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-6 text-center space-y-3">
            <p className="text-3xl">🔌</p>
            <p className="text-white font-bold">Grupos offline</p>
            <p className="text-[#8AB4CC] text-sm">Configure o Supabase para ativar grupos.</p>
          </div>
        )}

        {supabaseOk && !usuarioId && !carregando && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-5 text-center space-y-2">
            <p className="text-2xl">👤</p>
            <p className="text-white font-bold text-sm">Perfil não sincronizado</p>
            <p className="text-[#8AB4CC] text-xs">Jogue uma partida para criar seu perfil online.</p>
            <Link href="/" className="inline-block mt-2 bg-[#00C853] text-[#0A1626] font-semibold text-sm px-4 py-2 rounded-xl">
              Jogar agora
            </Link>
          </div>
        )}

        {supabaseOk && usuarioId && (
          <div className="space-y-2">
            {carregando ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#0F1D30] rounded-xl h-16 animate-pulse" />
              ))
            ) : grupos.length === 0 ? (
              <div className="text-center py-10 text-[#8AB4CC]">
                <p className="text-3xl mb-2">👥</p>
                <p>Você não está em nenhum grupo</p>
                <p className="text-xs mt-1">Crie um ou entre com o código de um amigo!</p>
              </div>
            ) : grupos.map(grupo => (
              <button key={grupo.id} onClick={() => abrirRanking(grupo)}
                className="w-full flex items-center gap-4 bg-[#0F1D30] border border-[#1A3A5C] hover:border-[#00C853]/30 rounded-xl px-4 py-4 text-left transition-all">
                <div className="w-10 h-10 bg-[#1A3A5C] rounded-full flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-[#8AB4CC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{grupo.nome}</p>
                  <p className="text-[#8AB4CC] text-xs font-mono tracking-wider">{grupo.codigo}</p>
                </div>
                <Trophy size={16} className="text-[#8AB4CC] flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {supabaseOk && (
          <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 space-y-2">
            <p className="text-[#8AB4CC] text-xs font-bold uppercase tracking-wider">Como funciona</p>
            <ul className="text-[#5A8AAA] text-xs space-y-1">
              <li>• Crie um grupo e compartilhe o código com amigos</li>
              <li>• O ranking mostra os pontos de cada semana</li>
              <li>• Quem jogar todo dia acumula mais pontos 🔥</li>
              <li>• O ranking reseta toda segunda-feira às 00h</li>
            </ul>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}
