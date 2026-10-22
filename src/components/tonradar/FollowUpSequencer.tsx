'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react'

interface SequenceItem {
  id: string
  leadName: string
  step: number
  totalSteps: number
  nextMessage: string
  scheduledFor: string
  status: 'queued' | 'sent' | 'pending' | 'failed'
}

const sampleSequences: SequenceItem[] = [
  {
    id: 'seq-1',
    leadName: 'Marcus Thompson',
    step: 3,
    totalSteps: 5,
    nextMessage: 'Sending comp report for 4821 Sunset Blvd...',
    scheduledFor: 'Now',
    status: 'queued',
  },
  {
    id: 'seq-2',
    leadName: 'Eleanor Whitfield',
    step: 1,
    totalSteps: 5,
    nextMessage: 'Initial outreach — inherited property offer',
    scheduledFor: 'In 15 min',
    status: 'queued',
  },
  {
    id: 'seq-3',
    leadName: 'Diana Reyes',
    step: 2,
    totalSteps: 5,
    nextMessage: 'Follow-up with free foreclosure avoidance guide',
    scheduledFor: 'In 2h',
    status: 'pending',
  },
  {
    id: 'seq-4',
    leadName: 'Sandra Morrison',
    step: 1,
    totalSteps: 3,
    nextMessage: 'Relocation special — expedited listing offer',
    scheduledFor: 'Tomorrow 9am',
    status: 'queued',
  },
  {
    id: 'seq-5',
    leadName: 'Harold Chen',
    step: 4,
    totalSteps: 5,
    nextMessage: 'Final check-in on industrial portfolio interest',
    scheduledFor: 'In 6h',
    status: 'pending',
  },
]

const statusConfig = {
  queued: { color: 'text-accent-cyan', bg: 'bg-cyan-500/10 border-cyan-500/20', icon: Clock, label: 'Queued' },
  sent: { color: 'text-accent-green', bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2, label: 'Sent' },
  pending: { color: 'text-accent-amber', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending' },
  failed: { color: 'text-accent-red', bg: 'bg-red-500/10 border-red-500/20', icon: AlertCircle, label: 'Failed' },
}

export default function FollowUpSequencer() {
  const [sequences, setSequences] = useState<SequenceItem[]>(sampleSequences)
  const [sentCount, setSentCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSequences(prev => {
        return prev.map(seq => {
          if (seq.status === 'queued' && seq.scheduledFor === 'Now' && Math.random() > 0.6) {
            setSentCount(c => c + 1)
            return { ...seq, status: 'sent' }
          }
          return seq
        })
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Follow-Up Sequencer</h3>
          <p className="text-xs text-gray-500">AI-powered outreach automation</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-bold text-accent-cyan">{sentCount + 23}</div>
            <div className="text-[10px] text-gray-500">sent today</div>
          </div>
          <button className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
            <Plus size={12} className="text-accent-cyan" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Active', value: sequences.filter(s => s.status !== 'sent').length, color: 'text-accent-cyan' },
          { label: 'Sent', value: sentCount + 23, color: 'text-accent-green' },
          { label: 'Rate', value: '84%', color: 'text-accent-amber' },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sequences */}
      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {sequences.map((seq) => {
            const sc = statusConfig[seq.status]
            const StatusIcon = sc.icon
            return (
              <motion.div
                key={seq.id}
                layout
                className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{seq.leadName}</span>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${sc.bg} ${sc.color}`}>
                        <StatusIcon size={8} />
                        {sc.label}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{seq.nextMessage}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({ length: seq.totalSteps }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < seq.step ? 'bg-accent-cyan' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0 font-mono">
                    Step {seq.step}/{seq.totalSteps}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1.5">
                  <Clock size={9} className="text-gray-600" />
                  <span className="text-[10px] text-gray-600">{seq.scheduledFor}</span>

                  {seq.status !== 'sent' && (
                    <button className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] text-cyan-400 hover:bg-cyan-500/20 transition-colors font-bold">
                      <Send size={8} />
                      Send Now
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
