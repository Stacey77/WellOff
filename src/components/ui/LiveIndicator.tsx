'use client'

import { AgentStatus } from '@/types'

interface LiveIndicatorProps {
  status: AgentStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const statusConfig = {
  active: {
    color: 'bg-accent-green',
    ring: 'bg-green-500/30',
    label: 'LIVE',
    textColor: 'text-accent-green',
  },
  thinking: {
    color: 'bg-accent-amber',
    ring: 'bg-amber-500/30',
    label: 'THINKING',
    textColor: 'text-accent-amber',
  },
  idle: {
    color: 'bg-gray-500',
    ring: 'bg-gray-500/20',
    label: 'IDLE',
    textColor: 'text-gray-400',
  },
  error: {
    color: 'bg-accent-red',
    ring: 'bg-red-500/30',
    label: 'ERROR',
    textColor: 'text-accent-red',
  },
}

const sizeConfig = {
  sm: { dot: 'w-1.5 h-1.5', ring: 'w-3 h-3', text: 'text-[9px]' },
  md: { dot: 'w-2 h-2', ring: 'w-4 h-4', text: 'text-[10px]' },
  lg: { dot: 'w-2.5 h-2.5', ring: 'w-5 h-5', text: 'text-xs' },
}

export default function LiveIndicator({ status, size = 'md', showLabel = true }: LiveIndicatorProps) {
  const config = statusConfig[status]
  const sz = sizeConfig[size]

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute ${sz.ring} rounded-full ${config.ring} ${status !== 'idle' ? 'animate-ping' : ''}`}
        />
        <div className={`relative ${sz.dot} rounded-full ${config.color}`} />
      </div>
      {showLabel && (
        <span className={`font-mono font-bold tracking-widest ${sz.text} ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}
