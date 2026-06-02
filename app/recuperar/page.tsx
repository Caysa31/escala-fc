'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recuperarPerfilPorCodigo } from '@/lib/perfil'

export default function RecuperarPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [recuperando, setRecuperando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cod = codigo.trim()
    if (!cod) { setErro('Digite seu código de recuperação'); return }

    setRecuperando(true)
    setErro('')
    try {
      const perfil = await recuperarPerfilPorCodigo(cod)
      if (!perfil) {
        setErro('Código não encontrado. Verifique e tente de novo.')
        return
      }
      setSucesso(`Conta de ${perfil.apelido} restaurada! Redirecionando...`)
      setTimeout(() => router.replace('/'), 1500)
    } finally {
      setRecuperando(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">⚽ ESCALA FC</h1>
          <p className="text-zinc-400 mt-1 text-sm">Recuperar minha conta</p>
        </div>

        {sucesso ? (
          <div className="bg-green-950 border border-green-700 rounded-2xl px-5 py-6 text-center">
            <p className="text-green-300 font-bold text-base">{sucesso}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
              <p className="text-zinc-400 text-xs leading-relaxed">
                Digite o código <span className="text-white font-bold">FC-XXXXX</span> que aparece
                na tela principal do jogo, abaixo dos desafios. Seus pontos e apelido serão restaurados.
              </p>
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-2">Código de recuperação:</label>
              <input
                type="text"
                value={codigo}
                onChange={e => { setCodigo(e.target.value.toUpperCase()); setErro('') }}
                placeholder="FC-XXXXX"
                maxLength={10}
                className="w-full bg-zinc-800 border-2 border-zinc-600 focus:border-blue-400 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors text-xl font-mono tracking-widest text-center"
                autoFocus
              />
              {erro && <p className="text-red-400 text-xs mt-2 text-center">{erro}</p>}
            </div>

            <button
              type="submit"
              disabled={recuperando}
              className={`w-full font-black text-lg rounded-xl py-4 transition-colors ${
                recuperando
                  ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {recuperando ? 'Buscando conta...' : 'RECUPERAR CONTA'}
            </button>

            <button
              type="button"
              onClick={() => router.replace('/')}
              className="w-full text-zinc-500 hover:text-zinc-300 text-sm text-center py-2 transition-colors"
            >
              ← Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
