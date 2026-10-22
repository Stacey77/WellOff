'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AGENTS } from './AgentBot'
import LiveIndicator from '@/components/ui/LiveIndicator'
import { AgentStatus } from '@/types'

export default function AgentOrchestrator() {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({
    ARIA: 'active',
    DEVX: 'active',
    TERRA: 'thinking',
    CAPITA: 'active',
    NOVA: 'active',
    TON: 'active',
  })
  const [taskIndices, setTaskIndices] = useState<Record<string, number>>({
    ARIA: 0, DEVX: 0, TERRA: 0, CAPITA: 0, NOVA: 0, TON: 0,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskIndices(prev => {
        const updated = { ...prev }
        const randomAgent = AGENTS[Math.floor(Math.random() * AGENTS.length)]
        updated[randomAgent.id] = (updated[randomAgent.id] + 1) % randomAgent.tasks.length
        return updated
      })

      // Occasionally flip status
      if (Math.random() > 0.7) {
        const randomAgent = AGENTS[Math.floor(Math.random() * AGENTS.length)]
        setAgentStatuses(prev => ({
          ...prev,
          [randomAgent.id]: prev[randomAgent.id] === 'active' ? 'thinking' : 'active',
        }))
        setTimeout(() => {
          setAgentStatuses(prev => ({ ...prev, [randomAgent.id]: 'active' }))
        }, 2000)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Agent Orchestrator</h3>
          <p className="text-xs text-gray-500">All AI agents — real-time status</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-accent-cyan">6/6 ACTIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {AGENTS.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${agent.color}44, ${agent.color}11)`,
                border: `1px solid ${agent.color}55`,
                boxShadow: `0 0 8px ${agent.color}33`,
              }}
            >
              {agent.id.slice(0, 2)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold" style={{ color: agent.color }}>{agent.name}</span>
                <LiveIndicator status={agentStatuses[agent.id]} size="sm" showLabel={false} />
              </div>
              <p className="text-gray-500 text-[10px] truncate font-mono">
                {agent.tasks[taskIndices[agent.id]]}
              </p>
            </div>

            {/* Status badge */}
            <div
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
              style={{
                color: agent.color,
                background: `${agent.color}15`,
                border: `1px solid ${agent.color}33`,
              }}
            >
              {agentStatuses[agent.id]}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
