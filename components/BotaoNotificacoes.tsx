'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import {
  suportaNotificacoes,
  notificacoesAtivas,
  statusPermissao,
  pedirPermissaoNotificacoes,
  getTokenLocal,
} from '@/lib/notificacoes'
import { salvarTokenNotificacao } from '@/lib/supabase'

interface Props {
  apelido?: string
  /** Se true mostra como banner expandido; false mostra como botão compacto */
  modo?: 'banner' | 'compacto'
}

export default function BotaoNotificacoes({ apelido, modo = 'banner' }: Props) {
  const usuarioId = typeof window !== 'undefined'
    ? (localStorage.getItem('escalafc_supabase_id') ?? undefined)
    : undefined
  const [status, setStatus] = useState<'idle' | 'pedindo' | 'ativo' | 'negado' | 'indisponivel'>('idle')
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    if (!suportaNotificacoes()) { setStatus('indisponivel'); return }
    const perm = statusPermissao()
    if (perm === 'granted' && getTokenLocal()) setStatus('ativo')
    else if (perm === 'denied') setStatus('negado')
    else {
      // Verifica se o usuário já dispensou o banner nesta sessão
      const disp = sessionStorage.getItem('notif_dispensado')
      if (disp === '1') setDispensado(true)
    }
  }, [])

  async function handleAtivar() {
    setStatus('pedindo')
    const token = await pedirPermissaoNotificacoes()
    if (token) {
      setStatus('ativo')
      // Salva token no Supabase (fire-and-forget)
      void salvarTokenNotificacao({ token, usuarioId, apelido })
    } else {
      const perm = statusPermissao()
      setStatus(perm === 'denied' ? 'negado' : 'idle')
    }
  }

  function handleDispensar() {
    sessionStorage.setItem('notif_dispensado', '1')
    setDispensado(true)
  }

  // Não mostra nada se: já ativo, browser não suporta, ou foi dispensado
  if (status === 'indisponivel' || status === 'ativo' || dispensado) return null
  if (status === 'negado') return null  // browser bloqueou, não insistir

  if (modo === 'compacto') {
    return (
      <button
        onClick={handleAtivar}
        disabled={status === 'pedindo'}
        className="flex items-center gap-2 text-[#8AB4CC] hover:text-white text-xs transition-colors"
      >
        <Bell size={14} className="text-[#5A8AAA]" />
        {status === 'pedindo' ? 'Ativando...' : 'Ativar alertas'}
      </button>
    )
  }

  // Modo banner
  return (
    <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 bg-[#1A3A5C] rounded-xl flex items-center justify-center flex-shrink-0">
        <Bell size={18} className="text-[#FFD23F]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">Ativar notificações</p>
        <p className="text-[#8AB4CC] text-xs">Avisa quando novo desafio aparecer</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAtivar}
          disabled={status === 'pedindo'}
          className="bg-[#00C853] hover:bg-[#00E060] disabled:bg-[#1A3A5C] disabled:text-[#8AB4CC] text-[#0A1626] text-xs font-bold px-3 py-2 rounded-lg transition-all"
        >
          {status === 'pedindo' ? '...' : 'Ativar'}
        </button>
        <button onClick={handleDispensar} className="p-1.5 rounded-lg text-[#5A8AAA] hover:text-[#8AB4CC] transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/** Ícone de status de notificação para o header */
export function NotifStatusIcon({ className = '' }: { className?: string }) {
  const [ativo, setAtivo] = useState(false)

  useEffect(() => {
    setAtivo(notificacoesAtivas())
  }, [])

  if (!ativo) return null

  return (
    <div className={`flex items-center gap-1 ${className}`} title="Notificações ativas">
      <Bell size={12} className="text-[#00C853]" />
    </div>
  )
}
