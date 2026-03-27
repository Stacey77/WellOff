'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Wifi, Twitter, Linkedin, Database, FileText, Building } from 'lucide-react'

interface SignalEvent {
  id: string
  source: string
  type: string
  timestamp: Date
  strength: number
}

const sources = [
  { name: 'Twitter/X', icon: Twitter, color: '#1d9bf0', active: true },
  { name: 'LinkedIn', icon: Linkedin, color: '#0a66c2', active: true },
  { name: 'Public Records', icon: FileText, color: '#8b5cf6', active: true },
  { name: 'MLS', icon: Building, color: '#10b981', active: true },
  { name: 'County Records', icon: Database, color: '#f59e0b', active: true },
  { name: 'News Feeds', icon: Activity, color: '#ef4444', active: false },
]

const signalTypes = [
  'FSBO post detected',
  'Foreclosure notice filed',
  'Job change detected',
  'Divorce filing found',
  'Estate probate opened',
  'Tax lien recorded',
  'Utility shutoff detected',
  'Development permit filed',
  'Zoning variance applied',
  'CAP rate drop signal',
]

function generateSignal(): SignalEvent {
  return {
    id: `sig-${Date.now()}-${Math.random()}`,
    source: sources[Math.floor(Math.random() * sources.length)].name,
    type: signalTypes[Math.floor(Math.random() * signalTypes.length)],
    timestamp: new Date(),
    strength: Math.floor(Math.random() * 40) + 60,
  }
}

export default function SignalFeed() {
  const [signals, setSignals] = useState<SignalEvent[]>([])
  const [scanCount, setScanCount] = useState(48293)
  const [scanRate, setScanRate] = useState(142)

  useEffect(() => {
    const initial = Array.from({ length: 6 }, generateSignal)
    setSignals(initial)

    const interval = setInterval(() => {
      setSignals(prev => [generateSignal(), ...prev.slice(0, 9)])
      setScanCount(prev => prev + Math.floor(Math.random() * 50) + 10)
      setScanRate(Math.floor(Math.random() * 30) + 130)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Signal Sources</h3>
          <p className="text-xs text-gray-500">Live data ingestion</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-bold text-accent-cyan">{scanCount.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">signals scanned</div>
        </div>
      </div>

      {/* Sources */}
      <div className="space-y-2 mb-4">
        {sources.map((source) => {
          const Icon = source.icon
          return (
            <div key={source.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <Icon size={13} style={{ color: source.color }} />
              <span className="text-xs text-gray-400 flex-1">{source.name}</span>
              {source.active ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-accent-green animate-ping" />
                  <Wifi size={10} className="text-accent-green" />
                  <span className="text-[10px] text-accent-green font-mono font-bold">LIVE</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-600 font-mono">PAUSED</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Scan rate */}
      <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Scan Rate</span>
          <span className="text-[10px] font-mono font-bold text-accent-cyan">{scanRate} signals/min</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            animate={{ width: `${(scanRate / 200) * 100}%` }}
            className="h-full rounded-full bg-accent-cyan"
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Live signal stream */}
      <div className="flex-1 overflow-hidden">
        <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">Signal Stream</p>
        <div className="space-y-1.5 overflow-hidden">
          <AnimatePresence>
            {signals.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/[0.02]"
              >
                <div className="w-1 h-1 rounded-full flex-shrink-0 bg-accent-cyan animate-pulse" />
                <span className="text-[10px] text-gray-400 flex-1 truncate">{signal.type}</span>
                <span className="text-[9px] text-gray-600 flex-shrink-0">{signal.strength}%</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
