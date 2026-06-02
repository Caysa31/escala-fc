'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Perfil } from '@/lib/types'
import { getJogadoresDoDia } from '@/lib/game'
import { carregarPerfil, getResultadoRodada, sincronizarPontosDeServidor } from '@/lib/perfil'
import { getContratosAtivos } from '@/lib/contrato'

import TelaPerfil, { StatsPerfil } from '@/components/TelaPerfil'
import JogoDesafio from '@/components/JogoDesafio'
import { TelaContratosAtivos } from '@/components/TelaContrato'
import TelaFinalDia from '@/components/TelaFinalDia'
import BotaoNotificacoes from '@/components/BotaoNotificacoes'
import { Flame, FileText, Globe, Users, Gamepad2, Swords } from 'lucide-react'
import Link from 'next/link'

const HOJE = new Date().toISOString().split('T')[0]

export default function Home() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [desafioIdx, setDesafioIdx] = useState(0)
  const [mostrarContratosAtivos, setMostrarContratosAtivos] = useState(false)
  const [mostrarFinalDia, setMostrarFinalDia] = useState(false)
  const [qtdContratosAtivos, setQtdContratosAtivos] = useState(0)

  // Flag para não mostrar a tela final mais de uma vez por sessão
  const finalDiaMostrado = useRef(false)
  // Flag para ignorar a primeira checagem ao carregar a página.
  // TelaFinalDia só deve aparecer quando o usuário ACABOU DE completar o último
  // desafio nesta sessão — não ao entrar na página com resultados já no localStorage.
  const isInitialLoad = useRef(true)

  const jogadoresDoDia = getJogadoresDoDia()

  useEffect(() => {
    const p = carregarPerfil()
    setPerfil(p)
    setQtdContratosAtivos(getContratosAtivos().length)
    setCarregado(true)

    // Sincroniza pontos com o servidor em background.
    // Detecta bônus de contratos resolvidos pelo cron enquanto o usuário estava offline.
    void sincronizarPontosDeServidor().then(() => {
      const pAtualizado = carregarPerfil()
      if (pAtualizado) setPerfil(pAtualizado)
    })
  }, [])

  // Detecta quando todos os 3 desafios estão completos e mostra a tela final
  // Usa perfil como trigger (muda após cada resultado registrado)
  useEffect(() => {
    if (!carregado || finalDiaMostrado.current) return

    // Ignora a primeira checagem ao carregar a página:
    // resultados no localStorage de sessões anteriores não devem abrir o modal.
    // Só mostra quando perfil mudar após completar um desafio nesta sessão.
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }

    const todosConcluidos = jogadoresDoDia.every(
      ({ rodadaId }) => getResultadoRodada(rodadaId) !== null
    )

    if (todosConcluidos) {
      finalDiaMostrado.current = true
      // Pequeno delay para o modal de resultado fechar antes da tela final
      const timer = setTimeout(() => setMostrarFinalDia(true), 600)
      return () => clearTimeout(timer)
    }
  }, [perfil, carregado]) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusDesafio = useCallback((rodadaId: number): 'jogando' | 'ganhou' | 'perdeu' => {
    const resultado = getResultadoRodada(rodadaId)
    if (!resultado) return 'jogando'
    return resultado.pistaAcerto !== null ? 'ganhou' : 'perdeu'
  }, [perfil])

  if (!carregado) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse text-lg">⚽ Carregando...</div>
      </div>
    )
  }

  if (!perfil) {
    return <TelaPerfil onCriar={p => setPerfil(p)} />
  }

  const { rodadaId: rodadaAtiva, jogador: jogadorAtivo } = jogadoresDoDia[desafioIdx]

  const temProximoDesafio = jogadoresDoDia.slice(desafioIdx + 1).some(
    ({ rodadaId }) => getStatusDesafio(rodadaId) === 'jogando'
  )

  // Mensagem motivacional quando o desafio anterior foi perdido
  const desafioAnterior = desafioIdx > 0 ? jogadoresDoDia[desafioIdx - 1] : null
  const mensagemMotivacional = desafioAnterior && getStatusDesafio(desafioAnterior.rodadaId) === 'perdeu'
    ? '💪 Essa não foi — mas o jogo não acabou! Ainda dá pra marcar pontos.'
    : undefined

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">⚽ ESCALA FC</h1>
            <p className="text-zinc-500 text-xs">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })} · 3 desafios hoje
            </p>
          </div>
          <div className="flex items-center gap-2">
            {qtdContratosAtivos > 0 && (
              <button
                onClick={() => setMostrarContratosAtivos(true)}
                className="relative flex items-center gap-1 bg-yellow-950 border border-yellow-800 rounded-xl px-3 py-2"
              >
                <FileText size={15} className="text-yellow-400" />
                <span className="text-yellow-300 font-bold text-sm">{qtdContratosAtivos}</span>
              </button>
            )}
            <div className="flex items-center gap-1 bg-zinc-800 rounded-xl px-3 py-2">
              <Flame size={16} className="text-orange-400" />
              <span className="font-bold text-sm">{perfil.streakAtual}</span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <StatsPerfil perfil={perfil} />

        {/* Seletor de desafio */}
        <div className="flex gap-2">
          {jogadoresDoDia.map(({ rodadaId }, i) => {
            const status = getStatusDesafio(rodadaId)
            const isAtivo = desafioIdx === i
            const emoji = status === 'ganhou' ? '✅' : status === 'perdeu' ? '❌' : '⚽'
            return (
              <button
                key={rodadaId}
                onClick={() => setDesafioIdx(i)}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all flex flex-col items-center gap-1
                  ${isAtivo
                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                    : status === 'ganhou'
                      ? 'bg-zinc-700 text-green-400 border border-green-800'
                      : status === 'perdeu'
                        ? 'bg-zinc-700 text-red-400 border border-red-900'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>Desafio {i + 1}</span>
              </button>
            )
          })}
        </div>

        {/* Banner de notificações — aparece de forma não intrusiva */}
        <BotaoNotificacoes apelido={perfil.apelido} />

        {/* Jogo do desafio ativo */}
        <JogoDesafio
          key={rodadaAtiva}
          jogador={jogadorAtivo}
          rodadaId={rodadaAtiva}
          perfil={perfil}
          indiceDesafio={desafioIdx}
          mensagemMotivacional={mensagemMotivacional}
          telaFinalAberta={mostrarFinalDia}
          onResultado={p => setPerfil(p)}
          onContratosChange={setQtdContratosAtivos}
          onProximoDesafio={
            temProximoDesafio
              ? () => {
                  const proximo = jogadoresDoDia.findIndex(
                    ({ rodadaId }, i) => i > desafioIdx && getStatusDesafio(rodadaId) === 'jogando'
                  )
                  if (proximo !== -1) setDesafioIdx(proximo)
                }
              : undefined
          }
        />

        {/* Código de recuperação */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center">
          <p className="text-zinc-500 text-xs">Código de recuperação:</p>
          <p className="text-zinc-300 font-mono font-bold text-sm mt-1">{perfil.codigo}</p>
          <p className="text-zinc-600 text-xs mt-1">Use em outro dispositivo para recuperar seu progresso</p>
        </div>

        {/* Navegação */}
        <nav className="grid grid-cols-2 gap-2">
          <Link
            href="/sala"
            className="flex flex-col items-center justify-center gap-1 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 hover:text-white text-xs font-semibold py-3 rounded-xl transition-all"
          >
            <Swords size={18} className="text-purple-400" />
            Sala Privada
          </Link>
          <Link
            href="/modos"
            className="flex flex-col items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold py-3 rounded-xl transition-all"
          >
            <Gamepad2 size={18} className="text-indigo-400" />
            Modos Extra
          </Link>
          <Link
            href="/ranking"
            className="flex flex-col items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold py-3 rounded-xl transition-all"
          >
            <Globe size={18} className="text-green-400" />
            Ranking Global
          </Link>
          <Link
            href="/grupos"
            className="flex flex-col items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold py-3 rounded-xl transition-all"
          >
            <Users size={18} className="text-green-400" />
            Grupos
          </Link>
        </nav>

      </div>

      {/* Contratos ativos (modal) */}
      {mostrarContratosAtivos && (
        <TelaContratosAtivos onFechar={() => setMostrarContratosAtivos(false)} />
      )}

      {/* Tela final do dia */}
      {mostrarFinalDia && perfil && (
        <TelaFinalDia
          jogadoresDoDia={jogadoresDoDia}
          perfil={perfil}
          onFechar={() => setMostrarFinalDia(false)}
        />
      )}
    </main>
  )
}
