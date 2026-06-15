'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recuperarPerfilPorApelido } from '@/lib/perfil'

export default function RecuperarPage() {
  const router = useRouter()
  const [apelido, setApelido] = useState('')
  const [erro, setErro] = useState('')
  const [recuperando, setRecuperando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nome = apelido.trim()
    if (!nome) { setErro('Digite seu apelido'); return }
    setRecuperando(true); setErro('')
    try {
      const perfil = await recuperarPerfilPorApelido(nome)
      if (!perfil) { setErro('Apelido não encontrado. Verifique como digitou.'); return }
      setSucesso(`Conta de ${perfil.apelido} restaurada! Redirecionando...`)
      setTimeout(() => router.replace('/'), 1500)
    } finally {
      setRecuperando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <p className="text-4xl mb-1">🐍</p>
          <h1 className="text-3xl font-black text-white tracking-widest">COBRA</h1>
          <p className="text-[#8AB4CC] mt-1 text-sm">Recuperar minha conta</p>
        </div>

        {sucesso ? (
          <div className="bg-[#071A0F] border border-[#00C853]/30 rounded-2xl px-5 py-6 text-center">
            <p className="text-[#00C853] font-bold text-base">{sucesso}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0F1D30] border border-[#1A3A5C] rounded-2xl p-4">
              <p className="text-[#8AB4CC] text-xs leading-relaxed">
                Digite o <span className="text-white font-bold">apelido</span> que você escolheu
                quando entrou no jogo. Seus pontos serão restaurados.
              </p>
            </div>

            <div>
              <label className="block text-[#8AB4CC] text-sm mb-2">Qual era o seu apelido?</label>
              <input
                type="text"
                value={apelido}
                onChange={e => { setApelido(e.target.value); setErro('') }}
                placeholder="Ex: CraqueDaSala"
                maxLength={20}
                className="w-full bg-[#0F1D30] border-2 border-[#1A3A5C] focus:border-[#00C853] rounded-xl px-4 py-3 text-white placeholder-[#2A4A6A] outline-none transition-colors text-base"
                autoFocus
              />
              {erro && <p className="text-red-400 text-xs mt-2">{erro}</p>}
            </div>

            <button
              type="submit"
              disabled={recuperando}
              className={`w-full font-black text-lg rounded-xl py-4 transition-colors ${
                recuperando
                  ? 'bg-[#1A3A5C] text-[#8AB4CC] cursor-not-allowed'
                  : 'bg-[#00C853] hover:bg-[#00E060] text-[#0A1626]'
              }`}
            >
              {recuperando ? 'Buscando conta...' : 'RECUPERAR CONTA'}
            </button>

            <button
              type="button"
              onClick={() => router.replace('/')}
              className="w-full text-[#8AB4CC] hover:text-white text-sm text-center py-2 transition-colors"
            >
              ← Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
