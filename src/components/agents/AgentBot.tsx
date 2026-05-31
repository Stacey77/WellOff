'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Agent } from '@/types'
import LiveIndicator from '@/components/ui/LiveIndicator'

interface AgentBotProps {
  agent: Agent
  compact?: boolean
  showLog?: boolean
}

export const AGENTS: Agent[] = [
  {
    id: 'ARIA',
    name: 'ARIA',
    role: 'Real Estate Agent AI',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Finds buyer/seller leads and manages agent workflows',
    assignedTo: ['agent'],
    status: 'active',
    currentTask: 'Scanning FSBO listings in 90028...',
    tasks: [
      'Scanning FSBO listings in 90028...',
      'Enriching lead: Marcus Thompson',
      'Drafting follow-up SMS for 3 hot leads',
      'Analyzing comparable sales in LA market',
      'Queuing outreach sequence for 8 new leads',
      'Cross-referencing MLS data with social signals',
      'Identifying motivated sellers in watchlist',
      'Drafting outreach email via Kimi for distressed-property lead',
      'Generating personalized listing summary with Kimi (128 K context)',
    ],
  },
  {
    id: 'DEVX',
    name: 'DEVX',
    role: 'Real Estate Developer AI',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Tracks permits, zoning changes, and development opportunities',
    assignedTo: ['developer'],
    status: 'active',
    currentTask: 'Monitoring new permit filings in Dallas County...',
    tasks: [
      'Monitoring new permit filings in Dallas County...',
      'Analyzing zoning change in Austin corridor',
      'Calculating IRR on 40-unit Houston project',
      'Sourcing off-market land parcels in Phoenix',
      'Running feasibility on mixed-use development',
      'Tracking municipal council agenda items',
      'Modeling construction cost escalation scenarios',
    ],
  },
  {
    id: 'TERRA',
    name: 'TERRA',
    role: 'Land Developer AI',
    color: '#10b981',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Specializes in raw land acquisition and entitlement tracking',
    assignedTo: ['land-dev'],
    status: 'thinking',
    currentTask: 'Evaluating entitlement risk on 3 parcels...',
    tasks: [
      'Evaluating entitlement risk on 3 parcels...',
      'Scanning GIS data for utility access points',
      'Analyzing flood zone maps for Atlanta parcel',
      'Tracking agricultural land conversions',
      'Monitoring subdivision plat applications',
      'Calculating density potential for rezoning',
      'Reviewing environmental impact assessments',
    ],
  },
  {
    id: 'CAPITA',
    name: 'CAPITA',
    role: 'Commercial Investor AI',
    color: '#ef4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description: 'Identifies CAP rate opportunities in commercial markets',
    assignedTo: ['commercial'],
    status: 'active',
    currentTask: 'Screening 12 NNN lease opportunities...',
    tasks: [
      'Screening 12 NNN lease opportunities...',
      'Calculating NOI on Houston industrial portfolio',
      'Tracking CMBS maturity calendar for distressed deals',
      'Analyzing retail vacancy trends in Chicago Loop',
      'Modeling cash-on-cash return for Dallas strip mall',
      'Identifying 1031 exchange candidates',
      'Monitoring cap rate compression in Sun Belt markets',
    ],
  },
  {
    id: 'NOVA',
    name: 'NOVA',
    role: 'Non-Commercial Investor AI',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Finds residential investment opportunities and rental analysis',
    assignedTo: ['non-commercial'],
    status: 'active',
    currentTask: 'Running rental income analysis on 5 targets...',
    tasks: [
      'Running rental income analysis on 5 targets...',
      'Screening foreclosure auction lists',
      'Analyzing long-term rental demand in Savannah',
      'Calculating BRRRR strategy metrics for 3 properties',
      'Identifying Airbnb arbitrage opportunities',
      'Monitoring delinquency notices in target zip codes',
      'Building cash flow projections for multifamily',
    ],
  },
  {
    id: 'TON',
    name: 'TON',
    role: 'Total Operations Navigator',
    color: '#00d4ff',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Master command AI orchestrating all agents and operations',
    assignedTo: ['agent', 'developer', 'land-dev', 'commercial', 'non-commercial'],
    status: 'active',
    currentTask: 'Orchestrating 5 agents across 3 active campaigns...',
    tasks: [
      'Orchestrating 5 agents across 3 active campaigns...',
      'Processing natural language command from user',
      'Routing lead to ARIA for immediate follow-up',
      'Generating LOI document for Chicago property',
      'Coordinating territory expansion analysis',
      'Synthesizing market intelligence report',
      'Dispatching bulk SMS sequence to 47 contacts',
      'Invoking Kimi (kimi-k2) for long-context deal analysis',
    ],
  },
]

export default function AgentBot({ agent, compact = false, showLog = false }: AgentBotProps) {
  const [taskIndex, setTaskIndex] = useState(0)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setTaskIndex(prev => (prev + 1) % agent.tasks.length)
      setLog(prev => {
        const newEntry = `[${new Date().toLocaleTimeString()}] ${agent.tasks[taskIndex]}`
        return [newEntry, ...prev.slice(0, 4)]
      })
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [agent.tasks, taskIndex])

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${agent.borderColor} ${agent.bgColor} backdrop-blur-sm`}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${agent.color}44, ${agent.color}22)`,
            border: `1px solid ${agent.color}66`,
            boxShadow: `0 0 10px ${agent.color}44`,
          }}
        >
          {agent.id[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: agent.color }}>{agent.name}</span>
            <LiveIndicator status={agent.status} size="sm" showLabel={false} />
          </div>
          <p className="text-gray-400 text-[10px] truncate">{agent.tasks[taskIndex]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border ${agent.borderColor} ${agent.bgColor} backdrop-blur-sm p-4`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${agent.color}66, ${agent.color}22)`,
              border: `1px solid ${agent.color}88`,
              boxShadow: `0 0 20px ${agent.color}44`,
            }}
          >
            {agent.id.slice(0, 2)}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <LiveIndicator status={agent.status} size="sm" showLabel={false} />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-white text-sm">{agent.name}</h3>
            <LiveIndicator status={agent.status} size="sm" />
          </div>
          <p className="text-gray-400 text-xs">{agent.role}</p>
        </div>
      </div>

      {/* Current Task */}
      <div className="rounded-lg p-2.5 mb-3" style={{ background: `${agent.color}0d`, border: `1px solid ${agent.color}22` }}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: agent.color }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: agent.color }}>
            Current Task
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={taskIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-gray-300 font-mono"
          >
            {agent.tasks[taskIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Role Tag */}
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
        style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}33` }}
      >
        <span>Assigned to:</span>
        <span>{agent.assignedTo.map(r => r.replace('-', ' ')).join(', ')}</span>
      </div>

      {/* Activity Log */}
      {showLog && log.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">Activity Log</p>
          {log.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-mono text-gray-500 truncate"
            >
              {entry}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
