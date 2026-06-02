'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home as HomeIcon, Swords, Gamepad2, Globe, Users } from 'lucide-react'

const NAV = [
  { href: '/',        Icon: HomeIcon, label: 'Início'  },
  { href: '/sala',    Icon: Swords,   label: 'Liga'    },
  { href: '/modos',   Icon: Gamepad2, label: 'Modos'   },
  { href: '/ranking', Icon: Globe,    label: 'Ranking' },
  { href: '/grupos',  Icon: Users,    label: 'Grupos'  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070E1A] border-t border-[#1A3A5C]">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV.map(({ href, Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'bg-[#0F1D30] border border-[#00C853]/30' : ''
              }`}
            >
              <Icon size={18} className={active ? 'text-[#00C853]' : 'text-[#8AB4CC]'} />
              <span className={`text-[10px] font-semibold ${active ? 'text-[#00C853]' : 'text-[#8AB4CC]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
