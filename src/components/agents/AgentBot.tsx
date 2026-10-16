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
    id: 'NEXUS',
    name: 'NEXUS',
    role: 'Technology Sector AI',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    description: 'Monitors tech industry: funding, acquisitions, SaaS metrics, talent signals, and enterprise software',
    assignedTo: ['tech'],
    status: 'active',
    currentTask: 'Scanning TechCrunch for Series B+ funding rounds…',
    tasks: [
      'Scanning TechCrunch for Series B+ funding rounds…',
      'Tracking SaaS churn signals for 3 enterprise accounts',
      'Monitoring competitor product launches in AI sector',
      'Identifying acquisition targets: profitable B2B SaaS under $50M ARR',
      'Analyzing tech layoff signals in target verticals',
      'Mapping enterprise software spending patterns Q4',
      'Detecting talent exodus signals at competitor firms',
    ],
  },
  {
    id: 'FORGE',
    name: 'FORGE',
    role: 'AI Robotics Engineer',
    color: '#f97316',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Robot fleet management, ROS integration, maintenance scheduling, computer vision, and simulation',
    assignedTo: ['robotics'],
    status: 'active',
    currentTask: 'Monitoring robot fleet health: 12 units across 3 sites…',
    tasks: [
      'Monitoring robot fleet health: 12 units across 3 sites…',
      'Scheduling predictive maintenance for Unit RB-047',
      'Running ROS2 navigation simulation for warehouse layout',
      'Analyzing computer vision accuracy: 97.3% defect detection',
      'Generating actuator replacement schedule for Q1',
      'Optimizing path planning algorithm for pick-and-place arm',
      'Processing LiDAR point cloud for facility mapping',
    ],
  },
  {
    id: 'ARCH',
    name: 'ARCH',
    role: 'AI Civil & Structural Engineer',
    color: '#84cc16',
    bgColor: 'bg-lime-500/10',
    borderColor: 'border-lime-500/30',
    description: 'BIM analysis, structural calculations, permit tracking, environmental impact, and project cost estimation',
    assignedTo: ['civil-eng'],
    status: 'active',
    currentTask: 'Reviewing structural load calculations for Tower C…',
    tasks: [
      'Reviewing structural load calculations for Tower C…',
      'Pulling permit status for 14 active project sites',
      'Running BIM clash detection on Level 3–7 MEP systems',
      'Calculating wind load compliance for curtain wall design',
      'Tracking environmental impact assessment for Phase 2',
      'Flagging code violations in submitted drawing set',
      'Estimating cost delta for revised foundation design',
    ],
  },
  {
    id: 'VOLT',
    name: 'VOLT',
    role: 'AI Mechanical Engineer',
    color: '#eab308',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'CAD/FEA analysis, materials selection, manufacturing process optimization, and thermal analysis',
    assignedTo: ['mech-eng'],
    status: 'active',
    currentTask: 'Running FEA on redesigned bracket assembly…',
    tasks: [
      'Running FEA on redesigned bracket assembly…',
      'Selecting material for high-temp application: 380°C',
      'Analyzing vibration fatigue failure in pump housing',
      'Optimizing cooling fin geometry for heat exchanger',
      'Reviewing tolerances on CNC machining spec sheet',
      'Calculating stress concentration factor for keyway',
      'Generating DFMEA for new drive shaft assembly',
    ],
  },
  {
    id: 'MOTOR',
    name: 'MOTOR',
    role: 'AI Automotive Engineer',
    color: '#ec4899',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    description: 'Vehicle diagnostics, EV battery management, fleet telemetry, ADAS configuration, and emissions compliance',
    assignedTo: ['automotive'],
    status: 'active',
    currentTask: 'Analyzing fleet telemetry: 247 vehicles across 6 depots…',
    tasks: [
      'Analyzing fleet telemetry: 247 vehicles across 6 depots…',
      'Diagnosing fault code P0300 on Unit VH-2291',
      'Monitoring EV battery degradation: avg SoH 91.4%',
      'Checking ADAS calibration drift on 8 flagged units',
      'Running emissions compliance check for Euro 7 targets',
      'Optimizing charging schedule for overnight depot cycle',
      'Flagging warranty claim pattern: brake actuator batch 44B',
    ],
  },
  {
    id: 'MESH',
    name: 'MESH',
    role: 'Computer Networking AI',
    color: '#14b8a6',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    description: 'Network topology mapping, security threat detection, bandwidth optimization, IaC generation, and cloud networking',
    assignedTo: ['networking'],
    status: 'active',
    currentTask: 'Mapping network topology across 3 data centers…',
    tasks: [
      'Mapping network topology across 3 data centers…',
      'Detecting anomalous traffic: 2.3Gbps spike on VLAN 40',
      'Generating Terraform config for new VPC subnet',
      'Auditing firewall rules: 14 deprecated ACL entries found',
      'Monitoring BGP route convergence time post-failover',
      'Running bandwidth utilization report: 78% peak on core uplink',
      'Scanning for CVE-2024-3094 exposure across edge nodes',
    ],
  },
  {
    id: 'INFRA',
    name: 'INFRA',
    role: 'Infrastructure as a Service AI',
    color: '#0ea5e9',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    description: 'Provisions and manages cloud infrastructure across AWS, Azure, and GCP',
    assignedTo: ['iaas'],
    status: 'active',
    currentTask: 'Provisioning 3-node Kubernetes cluster in us-east-1...',
    tasks: [
      'Provisioning 3-node Kubernetes cluster in us-east-1...',
      'Right-sizing 14 underutilized EC2 instances — saving $2,340/mo',
      'Configuring VPC peering between prod and staging environments',
      'Running disaster recovery drill: RTO target 4 minutes',
      'Scaling auto-scaling group: 8→24 instances for traffic spike',
      'Auditing S3 bucket policies: 3 public buckets flagged',
      'Migrating 2TB RDS snapshot to cold storage tier',
    ],
  },
  {
    id: 'PLAT',
    name: 'PLAT',
    role: 'Platform as a Service AI',
    color: '#7c3aed',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    description: 'Manages application platforms, CI/CD pipelines, and managed services lifecycle',
    assignedTo: ['paas'],
    status: 'active',
    currentTask: 'Deploying v2.4.1 to production via blue-green rollout...',
    tasks: [
      'Deploying v2.4.1 to production via blue-green rollout...',
      'Provisioning managed Postgres 15 cluster: 3 replicas',
      'CI/CD pipeline: build #847 — 23 tests passing, deploying',
      'Scaling API service: 4→12 replicas (CPU 91% threshold)',
      'Rotating database credentials for 6 microservices',
      'Configuring canary release: 5% traffic to new image',
      'Helm chart upgrade: ingress-nginx 4.8.3 → 4.9.1',
    ],
  },
  {
    id: 'XAAS',
    name: 'XAAS',
    role: 'Everything as a Service AI',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'Orchestrates multi-tenant service delivery, billing, SLAs, and API gateway across the full service catalog',
    assignedTo: ['xaas'],
    status: 'active',
    currentTask: 'Onboarding tenant Acme Corp: provisioning 14-service stack...',
    tasks: [
      'Onboarding tenant Acme Corp: provisioning 14-service stack...',
      'Billing cycle complete: $847K invoiced across 203 tenants',
      'SLA breach detected: API latency 847ms (threshold 500ms)',
      'API gateway rate limit update: 10K→25K req/min for Enterprise tier',
      'Generating service catalog: 47 offerings across 6 categories',
      'Multi-cloud failover triggered: Azure → AWS us-west-2',
      'White-label portal deployed for TechCorp reseller account',
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
