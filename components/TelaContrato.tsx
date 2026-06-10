'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Contrato,
  Jogador,
  MULTIPLICADORES_CONTRATO,
  BONUS_DESEMPENHO,
} from '@/lib/types'
import {
  assinarContrato,
  resolverTrivia,
  calcularBonusMaximo,
  getContratosAtivos,
} from '@/lib/contrato'
import { FileText, Clock, CheckCircle, Trophy, Zap, X } from 'lucide-react'

// ── Modal de assinatura do Contrato ──────────────────────────

interface ModalContratoProps {
  jogador: Jogador
  rodadaId: number
  pistaAcerto: number
  onFechar: (contrato: Contrato) => void
  onProximoDesafio?: () => void
  onBonusResolvido?: (bonusTotal: number) => void
}

export function ModalContrato({ jogador, rodadaId, pistaAcerto, onFechar, onProximoDesafio, onBonusResolvido }: ModalContratoProps) {
  const [triviaResposta, setTriviaResposta] = useState<number | null>(null)
  const [triviaResolvida, setTriviaResolvida] = useState(false)
  const [bonusTrivia, setBonusTrivia] = useState(0)
  const contratoRef = useRef<Contrato | null>(null)

  const multiplicador = MULTIPLICADORES_CONTRATO[pistaAcerto]
  const bonusMax = calcularBonusMaximo(multiplicador)

  // Assina o contrato uma única vez ao montar o modal (evita chamada dupla no StrictMode)
  useEffect(() => {
    contratoRef.current = assinarContrato(rodadaId, jogador, pistaAcerto)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Lê o contrato atual (fallback síncrono para o primeiro render)
  const contrato = contratoRef.current ?? assinarContrato(rodadaId, jogador, pistaAcerto)

  function handleTrivia(indice: number) {
    if (triviaResolvida) return
    const acertou = indice === jogador.triviaContrato?.respostaCorreta
    const resolvido = resolverTrivia(rodadaId, acertou)
    const bonus = resolvido?.bonusTotal ?? 0
    setTriviaResposta(indice)
    setTriviaResolvida(true)
    setBonusTrivia(bonus)
    // Notifica o pai para atualizar pontosTotal no perfil
    if (bonus > 0) onBonusResolvido?.(bonus)
  }

  function handleFechar() {
    onFechar(contrato)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0A1626] border border-[#1A3A5C] rounded-2xl w-full max-w-sm p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#FFD23F]" />
            <h2 className="text-lg font-bold text-white">
              {jogador.lenda ? 'Contrato Histórico' : 'Contrato Assinado'}
            </h2>
          </div>
          {(jogador.lenda ? triviaResolvida : true) && (
            <button onClick={handleFechar} className="text-[#8AB4CC] hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Jogador */}
        <div className="flex items-center gap-3 bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3">
          <span className="text-3xl">{jogador.bandeira}</span>
          <div>
            <p className="font-bold text-white">{jogador.apelido ?? jogador.nome}</p>
            <p className="text-[#8AB4CC] text-xs">{jogador.clube}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[#FFD23F] font-black text-xl">{multiplicador}×</p>
            <p className="text-[#8AB4CC] text-xs">multiplicador</p>
          </div>
        </div>

        {/* Conteúdo por tipo */}
        {jogador.lenda ? (
          <TriviaContrato
            jogador={jogador}
            multiplicador={multiplicador}
            triviaResposta={triviaResposta}
            triviaResolvida={triviaResolvida}
            bonusTrivia={bonusTrivia}
            onResponder={handleTrivia}
          />
        ) : (
          <ContratoNormal multiplicador={multiplicador} bonusMax={bonusMax} nomeJogador={jogador.apelido ?? jogador.nome} />
        )}

        {/* Botão principal */}
        {(!jogador.lenda || triviaResolvida) && (
          <div className="space-y-2">
            {onProximoDesafio ? (
              <>
                <button
                  onClick={onProximoDesafio}
                  className="w-full bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold rounded-xl py-4 text-base transition-colors"
                >
                  Próximo desafio →
                </button>
                <button
                  onClick={handleFechar}
                  className="w-full text-[#8AB4CC] hover:text-[#8AB4CC] text-sm py-1 transition-colors"
                >
                  Ver resultado
                </button>
              </>
            ) : (
              <button
                onClick={handleFechar}
                className="w-full bg-[#00C853] hover:bg-[#00E060] text-[#0A1626] font-bold rounded-xl py-3 transition-colors"
              >
                {jogador.lenda ? `Recebi +${bonusTrivia} pts` : 'Ver resultado'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Contrato normal (jogador ativo) ───────────────────────────

function ContratoNormal({ multiplicador, bonusMax, nomeJogador }: { multiplicador: number; bonusMax: number; nomeJogador: string }) {
  // Pega só o primeiro nome para ficar mais natural
  const primeiroNome = nomeJogador.split(' ')[0]
  return (
    <div className="space-y-3">
      {/* Frase de expectativa */}
      <p className="text-white text-sm leading-snug">
        Agora depende do que <span className="font-bold text-[#00C853]">{primeiroNome}</span> vai fazer em campo na próxima rodada 👀
      </p>

      <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4 space-y-2">
        <p className="text-[#8AB4CC] text-xs font-semibold mb-2 uppercase tracking-wider">Bônus pelo desempenho dele:</p>
        <BonusRow emoji="🏃" label="Entrou em campo" pts={BONUS_DESEMPENHO.entrou} mult={multiplicador} />
        <BonusRow emoji="⏱️" label="Jogou 70%+ do tempo" pts={BONUS_DESEMPENHO.jogou70} mult={multiplicador} />
        <BonusRow emoji="🎯" label="Criou chance de gol" pts={BONUS_DESEMPENHO.criouChance} mult={multiplicador} />
        <BonusRow emoji="⚽" label="Gol ou assistência" pts={BONUS_DESEMPENHO.golOuAssistencia} mult={multiplicador} />
        <BonusRow emoji="🔥" label="Gol E assistência" pts={BONUS_DESEMPENHO.golEAssistencia} mult={multiplicador} />
        <BonusRow emoji="⭐" label="Man of the Match" pts={BONUS_DESEMPENHO.motm} mult={multiplicador} />
      </div>

      <div className="flex items-center gap-2 bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3">
        <Zap size={16} className="text-[#FFD23F]" />
        <p className="text-[#FFD23F] text-sm">
          Potencial máximo: <span className="font-black">+{bonusMax} pts</span>
        </p>
      </div>

      <div className="flex items-center gap-2 text-[#8AB4CC] text-xs">
        <Clock size={12} />
        <span>Bônus calculado automaticamente após a partida dele</span>
      </div>
    </div>
  )
}

function BonusRow({ emoji, label, pts, mult }: { emoji: string; label: string; pts: number; mult: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#8AB4CC]">{emoji} {label}</span>
      <span className="text-[#00C853] font-semibold">+{Math.round(pts * mult)}</span>
    </div>
  )
}

// ── Trivia para lendas ────────────────────────────────────────

function TriviaContrato({
  jogador,
  multiplicador,
  triviaResposta,
  triviaResolvida,
  bonusTrivia,
  onResponder,
}: {
  jogador: Jogador
  multiplicador: number
  triviaResposta: number | null
  triviaResolvida: boolean
  bonusTrivia: number
  onResponder: (i: number) => void
}) {
  const trivia = jogador.triviaContrato
  if (!trivia) return null

  const bonusSeAcertar = Math.round(80 * multiplicador)

  return (
    <div className="space-y-3">
      <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4">
        <p className="text-[#8AB4CC] text-sm font-semibold mb-3">Questão bônus:</p>
        <p className="text-white text-base font-medium leading-snug mb-4">{trivia.pergunta}</p>

        <div className="grid grid-cols-2 gap-2">
          {trivia.opcoes.map((opcao, i) => {
            let estilo = 'bg-[#0F1D30] border border-[#1A3A5C] text-white hover:border-[#00C853]/30'
            if (triviaResolvida) {
              if (i === trivia.respostaCorreta) estilo = 'bg-[#071A0F] border border-[#00C853] text-white'
              else if (i === triviaResposta && triviaResposta !== trivia.respostaCorreta)
                estilo = 'bg-red-950 border border-red-800 text-white'
              else estilo = 'bg-[#0A1626] border border-[#1A3A5C] text-[#5A8AAA]'
            }
            return (
              <button
                key={i}
                onClick={() => onResponder(i)}
                disabled={triviaResolvida}
                className={`rounded-xl py-3 px-2 font-semibold text-sm transition-all ${estilo}`}
              >
                {opcao}
              </button>
            )
          })}
        </div>
      </div>

      {!triviaResolvida && (
        <div className="flex items-center gap-2 bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-3">
          <Zap size={16} className="text-[#FFD23F]" />
          <p className="text-[#FFD23F] text-sm">
            Acerte e ganhe <span className="font-black">+{bonusSeAcertar} pts</span>
          </p>
        </div>
      )}

      {triviaResolvida && (
        <div className={`flex items-center gap-2 rounded-xl p-3 ${bonusTrivia > 0 ? 'bg-[#071A0F] border border-[#00C853]/30' : 'bg-[#0F1D30]'}`}>
          {bonusTrivia > 0
            ? <><CheckCircle size={16} className="text-[#00C853]" /><p className="text-[#4A9A6A] text-sm font-bold">+{bonusTrivia} pts ganhos!</p></>
            : <><X size={16} className="text-[#8AB4CC]" /><p className="text-[#8AB4CC] text-sm">Não acertou — sem bônus desta vez</p></>
          }
        </div>
      )}
    </div>
  )
}

// ── Tela de Contratos Ativos ──────────────────────────────────

interface TelaContratosAtivosProps {
  onFechar: () => void
}

export function TelaContratosAtivos({ onFechar }: TelaContratosAtivosProps) {
  const contratos = getContratosAtivos()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0A1626] border border-[#1A3A5C] rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#1A3A5C]">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#FFD23F]" />
            <h2 className="font-bold text-white">Contratos Ativos</h2>
          </div>
          <button onClick={onFechar} className="text-[#8AB4CC] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {contratos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-[#8AB4CC]">Nenhum contrato ativo</p>
              <p className="text-[#5A8AAA] text-xs mt-1">Acerte o jogador do dia para assinar um</p>
            </div>
          ) : (
            contratos.map(c => (
              <div key={c.id} className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{c.bandeira}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{c.nomeJogador}</p>
                    <p className="text-[#8AB4CC] text-xs">{c.clube}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#FFD23F] font-black">{c.multiplicador}×</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8AB4CC]">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Aguardando partida</span>
                  </div>
                  <span className="text-[#00C853]">até +{calcularBonusMaximo(c.multiplicador)} pts</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
