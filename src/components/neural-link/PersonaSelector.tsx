'use client'

import { PERSONAS } from '@/lib/neural-link/personas'
import { PersonaId } from '@/lib/neural-link/types'

interface PersonaSelectorProps {
  activeId: PersonaId
  onSelect: (id: PersonaId) => void
  disabled?: boolean
}

export default function PersonaSelector({ activeId, onSelect, disabled }: PersonaSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PERSONAS.map((p) => {
        const active = p.id === activeId
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            disabled={disabled}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
              disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'
            }`}
            style={
              active
                ? {
                    background: `${p.color}18`,
                    borderColor: `${p.color}66`,
                    boxShadow: `0 0 15px ${p.color}33`,
                  }
                : {
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }
            }
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: p.color, boxShadow: active ? `0 0 8px ${p.color}` : 'none' }}
              />
              <span className="text-sm font-bold" style={{ color: active ? p.color : '#e5e7eb' }}>
                {p.name}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
              {p.title}
            </span>
            <span className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
              {p.tagline}
            </span>
          </button>
        )
      })}
    </div>
  )
}
