'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Power, Loader2, Mic, Volume2 } from 'lucide-react'
import { AudioActivity, LinkStatus, Persona } from '@/lib/neural-link/types'

interface NeuralCoreProps {
  status: LinkStatus
  activity: AudioActivity
  persona: Persona
  muted: boolean
}

export default function NeuralCore({ status, activity, persona, muted }: NeuralCoreProps) {
  const isConnecting = status === 'connecting'
  const isActive = status === 'active'
  const isOffline = status === 'offline' || status === 'error'

  const ringColor = isOffline ? '#475569' : isConnecting ? '#f59e0b' : persona.color
  const activityColor =
    activity === 'listening' ? '#10b981' : activity === 'speaking' ? persona.color : 'transparent'

  const IconForState = isOffline ? Power : isConnecting ? Loader2 : activity === 'listening' ? Mic : Volume2

  return (
    <div className="relative w-[320px] h-[320px] flex items-center justify-center select-none">
      {isActive && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed"
            style={{ borderColor: `${persona.color}44` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-6 rounded-full border border-dashed"
            style={{ borderColor: `${persona.color}33` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
          />
        </>
      )}

      {isConnecting && (
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: '#f59e0b',
            borderRightColor: '#f59e0b88',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }}
        />
      )}

      <AnimatePresence>
        {(activity === 'speaking' || activity === 'listening') && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${activity}-${i}`}
                className="absolute rounded-full border-2 pointer-events-none"
                style={{ borderColor: activityColor }}
                initial={{ width: 180, height: 180, opacity: 0.6 }}
                animate={{
                  width: 320,
                  height: 320,
                  opacity: 0,
                }}
                transition={{
                  duration: activity === 'listening' ? 1.1 : 1.6,
                  delay: i * (activity === 'listening' ? 0.35 : 0.5),
                  ease: 'easeOut',
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-[220px] h-[220px] rounded-full flex items-center justify-center"
        animate={
          isConnecting
            ? { scale: [1, 1.03, 1] }
            : activity === 'speaking'
            ? { scale: [1, 1.05, 1] }
            : { scale: 1 }
        }
        transition={
          isConnecting
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : activity === 'speaking'
            ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
        }
        style={{
          border: `2px solid ${ringColor}${isOffline ? '55' : 'cc'}`,
          background: `radial-gradient(circle at 50% 50%, ${ringColor}22, transparent 70%)`,
          boxShadow: isOffline
            ? 'inset 0 0 40px rgba(0,0,0,0.5)'
            : `0 0 40px ${ringColor}55, inset 0 0 40px ${ringColor}22`,
        }}
      >
        <motion.div
          className="w-[150px] h-[150px] rounded-full flex items-center justify-center"
          animate={
            activity === 'speaking'
              ? { scale: [1, 1.08, 1] }
              : activity === 'listening'
              ? { scale: [1, 1.04, 1] }
              : isConnecting
              ? { scale: [1, 1.02, 1] }
              : { scale: 1 }
          }
          transition={{
            duration: activity === 'listening' ? 0.5 : activity === 'speaking' ? 0.7 : 1.2,
            repeat: activity !== 'idle' || isConnecting ? Infinity : 0,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle, ${ringColor}33, ${ringColor}05)`,
            border: `1px solid ${ringColor}66`,
            boxShadow:
              activity === 'listening'
                ? `0 0 50px ${activityColor}aa, inset 0 0 30px ${activityColor}44`
                : activity === 'speaking'
                ? `0 0 50px ${ringColor}aa, inset 0 0 30px ${ringColor}44`
                : `inset 0 0 30px ${ringColor}33`,
          }}
        >
          <IconForState
            size={48}
            style={{ color: isOffline ? '#64748b' : activity === 'listening' ? '#10b981' : ringColor }}
            className={isConnecting ? 'animate-spin' : ''}
          />
        </motion.div>
      </motion.div>

      {muted && isActive && (
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40">
          <Mic size={10} className="text-red-400" />
          <span className="text-[10px] font-mono font-bold text-red-400 tracking-widest">MUTED</span>
        </div>
      )}
    </div>
  )
}
