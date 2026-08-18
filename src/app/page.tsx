'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Radar, MessageSquare, Map, Wand2, Zap, TrendingUp,
  Users, Building, Star, ArrowRight, Activity, ChevronRight
} from 'lucide-react'
import { UserRole, ActivityEvent } from '@/types'
import AgentOrchestrator from '@/components/agents/AgentOrchestrator'
import { AGENTS } from '@/components/agents/AgentBot'
import LiveIndicator from '@/components/ui/LiveIndicator'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const roles: { value: UserRole; label: string; color: string; agentId: string }[] = [
  { value: 'agent', label: 'Agent', color: '#8b5cf6', agentId: 'ARIA' },
  { value: 'developer', label: 'Developer', color: '#f59e0b', agentId: 'DEVX' },
  { value: 'land-dev', label: 'Land Dev', color: '#10b981', agentId: 'TERRA' },
  { value: 'commercial', label: 'Commercial', color: '#ef4444', agentId: 'CAPITA' },
  { value: 'non-commercial', label: 'Non-Commercial', color: '#3b82f6', agentId: 'NOVA' },
]

const features = [
  {
    href: '/tonradar',
    icon: Radar,
    title: 'TonRadar',
    subtitle: 'Signal Scanner',
    description: 'Live AI lead intelligence from 10+ data sources. Social signals, public records, MLS — all in one feed.',
    color: '#8b5cf6',
    agentId: 'ARIA',
    stats: ['48K+ signals/day', 'Real-time enrichment', '10 signal types'],
    gradient: 'from-purple-900/30 to-purple-800/10',
  },
  {
    href: '/command-center',
    icon: MessageSquare,
    title: 'Command Center',
    subtitle: 'AI Chat + CRM',
    description: 'Natural language commands to manage your entire CRM, send SMS, generate docs, and orchestrate agents.',
    color: '#00d4ff',
    agentId: 'TON',
    stats: ['1-click doc gen', 'AI SMS drafts', 'Voice commands'],
    gradient: 'from-cyan-900/30 to-cyan-800/10',
  },
  {
    href: '/territory',
    icon: Map,
    title: 'Territory Intel',
    subtitle: 'Zip Code Domination',
    description: 'Claim zip codes, track movement likelihood scores, and identify motivated sellers in your territory.',
    color: '#10b981',
    agentId: 'TERRA',
    stats: ['Movement scoring', 'Zip code claiming', 'Competitor tracking'],
    gradient: 'from-green-900/30 to-green-800/10',
  },
  {
    href: '/media-studio',
    icon: Wand2,
    title: 'Media Studio',
    subtitle: 'AI Content Engine',
    description: 'Virtual staging, property videos, social posts, and full brand kits — generated in seconds with AI.',
    color: '#f59e0b',
    agentId: 'DEVX',
    stats: ['Virtual staging', 'Video creator', 'Social templates'],
    gradient: 'from-amber-900/30 to-amber-800/10',
  },
]

const taglines = [
  'Close more deals with AI.',
  'Find motivated sellers first.',
  'All from one conversation.',
  'Outperform every competitor.',
  'Your AI team never sleeps.',
]

function useTypingEffect(texts: string[], speed = 60, pause = 2000) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const text = texts[textIndex]
    let timeout: NodeJS.Timeout

    if (!isDeleting && charIndex <= text.length) {
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, charIndex))
        setCharIndex(c => c + 1)
      }, speed)
    } else if (!isDeleting && charIndex > text.length) {
      timeout = setTimeout(() => setIsDeleting(true), pause)
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, charIndex - 1))
        setCharIndex(c => c - 1)
      }, speed / 2)
    } else {
      setIsDeleting(false)
      setTextIndex(i => (i + 1) % texts.length)
    }

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex, texts, speed, pause])

  return displayText
}

function MetricCounter({ value, label, color, icon: Icon }: {
  value: number; label: string; color: string; icon: React.ElementType
}) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const step = value / 40
    let current = 0
    const interval = setInterval(() => {
      current += step
      if (current >= value) {
        setDisplayed(value)
        clearInterval(interval)
      } else {
        setDisplayed(Math.floor(current))
      }
    }, 30)
    return () => clearInterval(interval)
  }, [value])

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="p-2.5 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <motion.div
          className="text-2xl font-black text-white"
          animate={{ opacity: 1 }}
          style={{ textShadow: `0 0 20px ${color}66` }}
        >
          {displayed.toLocaleString()}
        </motion.div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

const activityTemplates = [
  (a: string) => `${a} found a new motivated seller in 90028`,
  (a: string) => `${a} sent follow-up to Marcus Thompson`,
  (a: string) => `${a} generated comp report for 4821 Sunset`,
  (a: string) => `${a} detected pre-foreclosure signal in Dallas`,
  (a: string) => `${a} claimed territory ZIP 75201`,
  (a: string) => `${a} drafted offer letter for Eleanor Whitfield`,
  (a: string) => `${a} identified 3 new CAP rate opportunities`,
  (a: string) => `${a} updated movement score for 8 properties`,
  (a: string) => `${a} queued 12-message follow-up sequence`,
  (a: string) => `${a} generated virtual staging for listing`,
  (a: string) => `${a} drafted outreach email via Kimi for distressed-property lead`,
  (a: string) => `${a} summarized 128 K-token lease via Kimi (moonshot-v1-128k)`,
]

export default function Dashboard() {
  const [role, setRole] = useState<UserRole>('agent')
  const [metrics, setMetrics] = useState({ leadsToday: 47, territoriesClaimed: 2, messagesSent: 134, mediaCreated: 8 })
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([])
  const tagline = useTypingEffect(taglines)

  const activeRoleConfig = roles.find(r => r.value === role)!

  useEffect(() => {
    // Seed initial activity
    const initial: ActivityEvent[] = Array.from({ length: 6 }, (_, i) => {
      const agent = AGENTS[i % AGENTS.length]
      const template = activityTemplates[i % activityTemplates.length]
      return {
        id: `act-${i}`,
        agentId: agent.id,
        action: template(agent.name),
        target: '',
        timestamp: new Date(Date.now() - (6 - i) * 45000),
      }
    })
    setActivityFeed(initial)

    const interval = setInterval(() => {
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)]
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)]
      const newEvent: ActivityEvent = {
        id: `act-${Date.now()}`,
        agentId: agent.id,
        action: template(agent.name),
        target: '',
        timestamp: new Date(),
      }
      setActivityFeed(prev => [newEvent, ...prev.slice(0, 11)])
      setMetrics(prev => ({
        ...prev,
        leadsToday: prev.leadsToday + (Math.random() > 0.7 ? 1 : 0),
        messagesSent: prev.messagesSent + (Math.random() > 0.5 ? 1 : 0),
      }))
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} onRoleChange={setRole} />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Hero Section */}
          <div className="relative px-6 pt-8 pb-6 overflow-hidden">
            {/* BG effects */}
            <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-96 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-96 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                    <span className="text-xs font-mono font-bold text-accent-cyan">AI REAL ESTATE OPS — LIVE</span>
                  </div>
                </div>

                <h1 className="text-4xl font-black text-white mb-3 leading-tight">
                  Welcome to{' '}
                  <span className="gradient-text-cyan">WellOff</span>
                </h1>

                <div className="h-8 flex items-center">
                  <span className="text-xl text-gray-400 font-light">
                    {tagline}
                    <span className="inline-block w-0.5 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="px-6 pb-8 space-y-6">
            {/* Role Selector */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Your Role</p>
              <div className="flex gap-2 flex-wrap">
                {roles.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      role === r.value
                        ? 'scale-105'
                        : 'opacity-60 hover:opacity-80'
                    }`}
                    style={role === r.value ? {
                      background: `${r.color}20`,
                      border: `1px solid ${r.color}44`,
                      color: r.color,
                      boxShadow: `0 0 15px ${r.color}22`,
                    } : {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#9ca3af',
                    }}
                  >
                    {role === r.value && <Zap size={13} />}
                    {r.label}
                    {role === r.value && (
                      <span className="text-[10px] font-mono ml-1">({r.agentId})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <MetricCounter value={metrics.leadsToday} label="Leads Today" color="#8b5cf6" icon={Users} />
              <MetricCounter value={metrics.territoriesClaimed} label="Territories Claimed" color="#10b981" icon={Map} />
              <MetricCounter value={metrics.messagesSent} label="Messages Sent" color="#00d4ff" icon={MessageSquare} />
              <MetricCounter value={metrics.mediaCreated} label="Media Created" color="#f59e0b" icon={Wand2} />
            </div>

            {/* Feature Cards */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Command Modules</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature, i) => {
                  const Icon = feature.icon
                  const agent = AGENTS.find(a => a.id === feature.agentId)!
                  return (
                    <motion.div
                      key={feature.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Link href={feature.href}>
                        <div
                          className={`relative rounded-2xl border border-white/10 overflow-hidden p-5 group cursor-pointer
                            hover:border-white/20 transition-all duration-300 bg-gradient-to-br ${feature.gradient}`}
                          style={{ '--hover-glow': feature.color } as React.CSSProperties}
                        >
                          {/* Hover glow */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            style={{ background: `radial-gradient(circle at 50% 0%, ${feature.color}15, transparent 70%)` }}
                          />

                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative z-10"
                            style={{
                              background: `${feature.color}20`,
                              border: `1px solid ${feature.color}33`,
                              boxShadow: `0 0 15px ${feature.color}22`,
                            }}
                          >
                            <Icon size={18} style={{ color: feature.color }} />
                          </div>

                          <h3 className="text-base font-black text-white mb-0.5 relative z-10">{feature.title}</h3>
                          <p className="text-xs text-gray-500 mb-3 relative z-10">{feature.subtitle}</p>
                          <p className="text-xs text-gray-400 mb-4 leading-relaxed relative z-10 line-clamp-2">
                            {feature.description}
                          </p>

                          {/* Stats */}
                          <div className="space-y-1.5 mb-4 relative z-10">
                            {feature.stats.map(stat => (
                              <div key={stat} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                <div className="w-1 h-1 rounded-full" style={{ background: feature.color }} />
                                {stat}
                              </div>
                            ))}
                          </div>

                          {/* Agent badge */}
                          <div className="flex items-center justify-between relative z-10">
                            <div
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
                              style={{
                                background: `${agent.color}15`,
                                border: `1px solid ${agent.color}33`,
                                color: agent.color,
                              }}
                            >
                              <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: agent.color }} />
                              {agent.name} active
                            </div>
                            <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Bottom grid: Orchestrator + Activity */}
            <div className="grid grid-cols-12 gap-4">
              {/* Agent Orchestrator */}
              <div className="col-span-5">
                <AgentOrchestrator />
              </div>

              {/* Activity Feed */}
              <div className="col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity size={14} className="text-accent-cyan" />
                      Live Activity Feed
                    </h3>
                    <p className="text-xs text-gray-500">Real-time agent operations</p>
                  </div>
                  <LiveIndicator status="active" size="sm" />
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  <AnimatePresence>
                    {activityFeed.map((event) => {
                      const agent = AGENTS.find(a => a.id === event.agentId)!
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                            style={{
                              background: `${agent.color}20`,
                              border: `1px solid ${agent.color}33`,
                              color: agent.color,
                            }}
                          >
                            {agent.id.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300 leading-relaxed">{event.action}</p>
                          </div>
                          <span className="text-[10px] text-gray-600 flex-shrink-0 font-mono">
                            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
