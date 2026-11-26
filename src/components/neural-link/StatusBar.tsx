'use client'

import { motion } from 'framer-motion'
import { LinkStatus, Persona } from '@/lib/neural-link/types'

interface StatusBarProps {
  status: LinkStatus
  persona: Persona
}

const STATUS_COPY: Record<LinkStatus, { dot: string; label: string; sub: string }> = {
  offline: {
    dot: '#ef4444',
    label: 'Link Offline',
    sub: 'System Standby',
  },
  connecting: {
    dot: '#f59e0b',
    label: 'Establishing Link',
    sub: 'Synchronizing neural pathways',
  },
  active: {
    dot: '#10b981',
    label: 'Link Active',
    sub: 'Data stream online',
  },
  error: {
    dot: '#ef4444',
    label: 'Link Fault',
    sub: 'Re-establishing channel',
  },
}

export default function StatusBar({ status, persona }: StatusBarProps) {
  const copy = STATUS_COPY[status]
  const pulsing = status === 'connecting' || status === 'active'

  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-sm"
      style={{
        borderColor: `${copy.dot}55`,
        background: `${copy.dot}0d`,
        boxShadow: pulsing ? `0 0 25px ${copy.dot}33` : 'none',
      }}
    >
      <div className="relative flex items-center justify-center">
        {pulsing && (
          <motion.div
            className="absolute w-4 h-4 rounded-full"
            style={{ background: `${copy.dot}55` }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className="relative w-2.5 h-2.5 rounded-full" style={{ background: copy.dot }} />
      </div>
      <div className="flex flex-col">
        <span
          className="text-xs italic font-bold tracking-[0.25em] uppercase"
          style={{ color: copy.dot }}
        >
          {copy.label}
        </span>
        <span className="text-[10px] font-mono text-gray-500 tracking-wider">
          {copy.sub}
          {status === 'active' && (
            <>
              {' · '}
              <span style={{ color: persona.color }}>{persona.name} engaged</span>
            </>
          )}
        </span>
      </div>
    </div>
  )
}
