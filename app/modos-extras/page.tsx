'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { TipoModo } from '@/lib/geradorQuestoes'
import JogoExtra from '@/components/ModosExtras/JogoExtra'

type Tela = 'hub' | 'jogo'

export default function ModosExtrasPage() {
  const router = useRouter()
  const [tela, setTela] = useState<Tela>('hub')
  const [modoSelecionado, setModoSelecionado] = useState<TipoModo>('quem-nao-pertence')

  function iniciarJogo(tipo: TipoModo) {
    setModoSelecionado(tipo)
    setTela('jogo')
  }

  if (tela === 'jogo') {
    return <JogoExtra tipo={modoSelecionado} onVoltar={() => setTela('hub')} />
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#09090b]"
      style={{
        backgroundImage: 'url(/assets/estadio-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/75" />

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-safe-top pb-10">
        {/* Header */}
        <div className="flex items-center pt-5 pb-6">
          <button
            onClick={() => router.back()}
            className="text-white/60 text-2xl w-10 h-10 flex items-center justify-center mr-2"
          >
            ‹
          </button>
          <div>
            <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Cobra da Bola</div>
            <h1 className="text-xl font-black text-white leading-none">Modos Extras</h1>
          </div>
        </div>

        {/* Badge "novo" */}
        <div className="mb-6">
          <span className="bg-[#00C853]/20 text-[#00C853] text-[11px] font-black px-3 py-1 rounded-full border border-[#00C853]/30 tracking-wider">
            ✦ NOVO
          </span>
        </div>

        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Novos desafios, mesmos jogadores. Você sabe quem é o intruso do grupo?
        </p>

        {/* Card: Quem Não Pertence */}
        <button
          onClick={() => iniciarJogo('quem-nao-pertence')}
          className="w-full mb-4 text-left"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[#00C853]/30 bg-[#00C853]/10 backdrop-blur-sm">
            {/* Ícone decorativo */}
            <div className="absolute right-4 top-4 opacity-20">
              <Image
                src="/assets/soccer-ball-3d.png"
                alt=""
                width={80}
                height={80}
                className="rotate-12"
                unoptimized
              />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#00C853]/60 tracking-widest uppercase">Modo 1</div>
                  <h2 className="text-xl font-black text-white">Quem Não Pertence?</h2>
                </div>
              </div>
              <p className="text-white/50 text-[13px] leading-relaxed mb-4">
                4 jogadores aparecem — 3 têm algo em comum. Descubra o intruso sem que a gente dê o tema.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['10 questões', 'Clube', 'Liga', 'Posição', 'Título'].map(tag => (
                  <span key={tag} className="bg-white/8 text-white/50 text-[10px] px-2 py-1 rounded-full border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-6 pb-5">
              <div className="bg-[#00C853] text-black font-black py-3 rounded-2xl text-center text-sm tracking-wide">
                JOGAR AGORA →
              </div>
            </div>
          </div>
        </button>

        {/* Card: Elimine 1 dos 4 */}
        <button
          onClick={() => iniciarJogo('elimine-1')}
          className="w-full text-left"
        >
          <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm">
            {/* Ícone decorativo */}
            <div className="absolute right-4 top-4 opacity-25">
              <Image
                src="/assets/red-card.png"
                alt=""
                width={60}
                height={60}
                className="rotate-6"
                unoptimized
              />
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <Image src="/assets/red-card.png" alt="" width={28} height={28} unoptimized />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-red-400/60 tracking-widest uppercase">Modo 2</div>
                  <h2 className="text-xl font-black text-white">Elimine 1 dos 4</h2>
                </div>
              </div>
              <p className="text-white/50 text-[13px] leading-relaxed mb-4">
                A categoria é revelada — mas qual dos 4 jogadores não se encaixa nela? Dê o cartão vermelho!
              </p>
              <div className="flex gap-2 flex-wrap">
                {['10 questões', 'Categoria dada', 'Mais fácil', 'Ótimo para iniciar'].map(tag => (
                  <span key={tag} className="bg-white/8 text-white/50 text-[10px] px-2 py-1 rounded-full border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-6 pb-5">
              <div className="bg-red-500 text-white font-black py-3 rounded-2xl text-center text-sm tracking-wide">
                JOGAR AGORA →
              </div>
            </div>
          </div>
        </button>

        {/* Rodapé */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-white/20 text-[11px]">Base: 194 jogadores · questões geradas dinamicamente</p>
        </div>
      </div>
    </div>
  )
}
