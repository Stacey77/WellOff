'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Radar, Zap, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { Lead } from '@/types'
import { initialLeads, generateNewLead } from '@/lib/data/leads'
import LeadCard from './LeadCard'
import SignalFeed from './SignalFeed'
import FollowUpSequencer from './FollowUpSequencer'
import AgentBot, { AGENTS } from '@/components/agents/AgentBot'
import { UserRole } from '@/types'

const agentForRole: Record<UserRole, string> = {
  agent: 'ARIA',
  developer: 'DEVX',
  'land-dev': 'TERRA',
  commercial: 'CAPITA',
  'non-commercial': 'NOVA',
}

interface TonRadarDashboardProps {
  role: UserRole
}

export default function TonRadarDashboard({ role }: TonRadarDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    signalsScanned: 48293,
    leadsFound: initialLeads.length,
    enrichmentRate: 84,
    followUpRate: 91,
  })

  const activeAgentId = agentForRole[role]
  const activeAgent = AGENTS.find(a => a.id === activeAgentId)!

  useEffect(() => {
    const interval = setInterval(() => {
      const newLead = generateNewLead()
      setLeads(prev => [newLead, ...prev.slice(0, 19)])
      setNewLeadIds(prev => { const s = new Set(prev); s.add(newLead.id); return s })
      setTimeout(() => {
        setNewLeadIds(prev => {
          const next = new Set(prev)
          next.delete(newLead.id)
          return next
        })
      }, 3000)
      setStats(prev => ({
        ...prev,
        signalsScanned: prev.signalsScanned + Math.floor(Math.random() * 100) + 20,
        leadsFound: prev.leadsFound + 1,
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Radar size={18} className="text-accent-purple" />
            </div>
            <h1 className="text-xl font-black text-white">TonRadar Signal Scanner</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-accent-cyan">LIVE SCAN</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">AI-powered lead intelligence from 10+ data sources</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Signals Scanned', value: stats.signalsScanned.toLocaleString(), icon: Radar, color: '#00d4ff' },
          { label: 'Leads Found', value: stats.leadsFound, icon: Users, color: '#8b5cf6' },
          { label: 'Enrichment Rate', value: `${stats.enrichmentRate}%`, icon: TrendingUp, color: '#10b981' },
          { label: 'Follow-Up Rate', value: `${stats.followUpRate}%`, icon: CheckCircle, color: '#f59e0b' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                <Icon size={14} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-base font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-gray-500">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left: Signal Sources */}
        <div className="col-span-3">
          <SignalFeed />
        </div>

        {/* Center: Lead Feed */}
        <div className="col-span-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={13} className="text-accent-cyan" />
              Live Lead Feed
            </h2>
            <span className="text-[10px] text-gray-500 font-mono">{leads.length} leads tracked</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {leads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={index}
                isNew={newLeadIds.has(lead.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Agent + Sequencer */}
        <div className="col-span-3 flex flex-col gap-4">
          <AgentBot agent={activeAgent} showLog={true} />
          <FollowUpSequencer />
        </div>
      </div>
    </div>
  )
}
