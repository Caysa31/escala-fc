'use client'

import { useState, useEffect, use } from 'react'
import {
  Perfil, Tentativa, EstadoJogo,
  PONTOS_BASE, TOTAL_PISTAS,
} from '@/lib/types'
import {
  getPistasTexto,
  verificarPalpite, calcularPontos,
  gerarTextoCompartilhar,
} from '@/lib/game'
import { carregarPerfil } from '@/lib/perfil'
import jogadoresData from '@/data/jogadores.json'
import { Jogador } from '@/lib/types'

import Pista from '@/components/Pista'
import InputPalpite from '@/components/InputPalpite'
import ListaTentativas from '@/components/ListaTentativas'
import { Copy, Check, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const jogadores = jogadoresData as Jogador[]

// Pega o jogador da rodada com base no ID
function getJogadorDaRodada(rodadaId: number): Jogador {
  const inicio = new Date('2026-05-22')
  const diffDias = rodadaId - 1
  const indice = Math.abs(diffDias) % jogadores.length
  return jogadores[indice]
}

export default function DesafioPage({ params }: { params: Promise<{ rodadaId: string }> }) {
  const { rodadaId: rodadaIdStr } = use(params)
  const rodadaId = parseInt(rodadaIdStr, 10)
  const jogador = getJogadorDaRodada(rodadaId)
  const pistasTexto = getPistasTexto(jogador)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [estado, setEstado] = useState<EstadoJogo>({
    pistaAtual: 1,
    tentativas: [],
    status: 'jogando',
    pistaUsada: null,
  })

  useEffect(() => {
    setPerfil(carregarPerfil())
  }, [])

  function handlePalpite(nome: string) {
    if (estado.status !== 'jogando') return
    const acertou = verificarPalpite(nome, jogador)
    const novaTentativa: Tentativa = { nome, status: acertou ? 'acerto' : 'erro' }
    const novasTentativas = [...estado.tentativas, novaTentativa]

    if (acertou) {
      setEstado({ ...estado, tentativas: novasTentativas, status: 'ganhou', pistaUsada: estado.pistaAtual })
    } else {
      const novaPista = estado.pistaAtual + 1
      const acabou = novaPista > TOTAL_PISTAS
      setEstado({
        ...estado,
        tentativas: novasTentativas,
        pistaAtual: acabou ? TOTAL_PISTAS : novaPista,
        status: acabou ? 'perdeu' : 'jogando',
        pistaUsada: null,
      })
    }
  }

  async function copiarResultado() {
    const texto = gerarTextoCompartilhar(rodadaId, estado.pistaUsada, estado.tentativas)
    await navigator.clipboard.writeText(texto).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const pontosRodada = estado.pistaUsada ? calcularPontos(estado.pistaUsada) : 0
  const encerrado = estado.status !== 'jogando'

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <header className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black">⚽ ESCALA FC — Desafio</h1>
            <p className="text-zinc-500 text-xs">
              Rodada #{rodadaId} · {perfil ? `Desafio enviado para ${perfil.apelido}` : 'Você foi desafiado!'}
            </p>
          </div>
        </header>

        {/* Banner desafio */}
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3 text-center">
          <p className="text-yellow-300 text-sm font-semibold">
            🏆 Você foi desafiado! Jogue a rodada #{rodadaId} e compare com seu amigo.
          </p>
          <p className="text-yellow-600 text-xs mt-1">
            Essa rodada não conta para o ranking global.
          </p>
        </div>

        {/* Status */}
        {estado.status === 'jogando' && (
          <div className="bg-zinc-800 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-zinc-300">
              Pista <span className="text-green-400 font-bold">{estado.pistaAtual}</span> de {TOTAL_PISTAS} · Vale{' '}
              <span className="text-yellow-400 font-bold">{PONTOS_BASE[estado.pistaAtual]} pts</span>
            </p>
          </div>
        )}

        {estado.status === 'ganhou' && (
          <div className="bg-green-950 border border-green-700 rounded-xl px-4 py-3 text-center">
            <p className="text-green-300 font-bold">🎯 Acertou na pista {estado.pistaUsada}! +{pontosRodada} pts</p>
          </div>
        )}

        {estado.status === 'perdeu' && (
          <div className="bg-red-950 border border-red-900 rounded-xl px-4 py-3 text-center">
            <p className="text-red-300 font-bold">
              Era <span className="text-white">{jogador.nome}</span> {jogador.bandeira}
            </p>
          </div>
        )}

        {/* Pistas */}
        <div className="space-y-2">
          {Array.from({ length: TOTAL_PISTAS }, (_, i) => i + 1).map(num => (
            <Pista
              key={num}
              numero={num}
              texto={pistasTexto[num] ?? ''}
              revelada={num <= estado.pistaAtual}
              atual={num === estado.pistaAtual && estado.status === 'jogando'}
            />
          ))}
        </div>

        {/* Input */}
        {estado.status === 'jogando' && (
          <InputPalpite
            onPalpite={handlePalpite}
            desabilitado={false}
            tentativasAnteriores={estado.tentativas.map(t => t.nome)}
          />
        )}

        <ListaTentativas tentativas={estado.tentativas} />

        {/* Compartilhar resultado */}
        {encerrado && (
          <div className="space-y-2">
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-zinc-400 text-xs mb-2">ESCALA FC #{rodadaId}</p>
              <p className="text-2xl tracking-widest mb-1">
                {estado.tentativas.map(t => t.status === 'acerto' ? '🟩' : '⬛').join('')}
              </p>
              <p className="text-zinc-500 text-xs">escalafe.com.br</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copiarResultado}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all
                  ${copiado ? 'bg-green-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}
              >
                {copiado ? <Check size={16} /> : <Copy size={16} />}
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(gerarTextoCompartilhar(rodadaId, estado.pistaUsada, estado.tentativas))}`, '_blank')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm bg-green-600 hover:bg-green-500 text-white"
              >
                <Share2 size={16} />
                WhatsApp
              </button>
            </div>

            <Link
              href="/"
              className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              Jogar rodada de hoje →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
