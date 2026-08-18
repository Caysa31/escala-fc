'use client'

import { useState } from 'react'
import { Flag, Send, Check } from 'lucide-react'
import { enviarFeedback } from '@/lib/supabase'
import { Jogador } from '@/lib/types'

const TIPOS = [
  { id: 'dado_errado', label: 'Dado errado' },
  { id: 'bug',         label: 'Bug' },
  { id: 'sugestao',    label: 'Sugestão' },
  { id: 'outro',       label: 'Outro' },
] as const

type TipoId = typeof TIPOS[number]['id']

interface FeedbackFormProps {
  jogador: Jogador
  usuarioApelido?: string
}

export default function FeedbackForm({ jogador, usuarioApelido }: FeedbackFormProps) {
  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState<TipoId | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleEnviar() {
    if (!tipo) return
    setEnviando(true)
    await enviarFeedback({
      jogadorId:      jogador.id,
      jogadorNome:    jogador.nome,
      tipo,
      mensagem:       mensagem.trim(),
      usuarioApelido,
    })
    setEnviando(false)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-[#00C853] text-sm font-semibold">
        <Check size={15} />
        Obrigado! Vamos verificar.
      </div>
    )
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="w-full flex items-center justify-center gap-1.5 text-[#3A5570] hover:text-[#5A8AAA] text-xs py-1.5 transition-colors"
      >
        <Flag size={12} />
        Ajude a melhorar o jogo
      </button>
    )
  }

  return (
    <div className="bg-[#0A1220] border border-[#1A2A40] rounded-xl p-4 space-y-3">
      <p className="text-[#8AB4CC] text-xs font-bold uppercase tracking-wider">
        🚩 Reportar sobre {jogador.nome}
      </p>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2">
        {TIPOS.map(t => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              tipo === t.id
                ? 'bg-[#FFD23F] text-[#0A1626] border-[#FFD23F]'
                : 'bg-transparent text-[#8AB4CC] border-[#1A2A40] hover:border-[#2A4A6A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Texto opcional */}
      <textarea
        value={mensagem}
        onChange={e => setMensagem(e.target.value)}
        placeholder="Descreve o problema (opcional)..."
        maxLength={500}
        rows={3}
        className="w-full bg-[#080D18] border border-[#1A2A40] rounded-lg px-3 py-2 text-white text-sm placeholder-[#2A4A6A] outline-none focus:border-[#2A4A6A] resize-none"
      />

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={() => { setAberto(false); setTipo(null); setMensagem('') }}
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-[#5A8AAA] border border-[#1A2A40] hover:border-[#2A4A6A] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleEnviar}
          disabled={!tipo || enviando}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            tipo && !enviando
              ? 'bg-[#00C853] text-[#0A1626]'
              : 'bg-[#1A2A40] text-[#3A5570] cursor-not-allowed'
          }`}
        >
          <Send size={12} />
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
