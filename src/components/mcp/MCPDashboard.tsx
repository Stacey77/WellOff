'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Server, Zap, Database, BookOpen, Terminal,
  ChevronDown, ChevronRight, Activity, Clock,
  CheckCircle2, XCircle, Loader2, Copy, Check,
  Plug, Globe, Radio
} from 'lucide-react'
import {
  MCP_SERVERS, MCPServer, MCPTool, ToolCall,
  SIMULATED_CALLS, getTotalTools, getTotalResources, getTotalCallsToday
} from '@/lib/mcp/servers'
import { AGENTS } from '@/components/agents/AgentBot'
import LiveIndicator from '@/components/ui/LiveIndicator'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: color }} />
      <div>
        <div className="text-xl font-black text-white">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
        {sub && <div className="text-[10px] text-gray-600 font-mono">{sub}</div>}
      </div>
    </div>
  )
}

// ─── JSON Schema Viewer ───────────────────────────────────────────────────────
function SchemaViewer({ schema }: { schema: object }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(schema, null, 2)

  const copy = () => {
    navigator.clipboard.writeText(json).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative rounded-xl bg-black/40 border border-white/10 overflow-hidden">
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors z-10"
      >
        {copied ? <Check size={11} className="text-accent-green" /> : <Copy size={11} className="text-gray-500" />}
      </button>
      <pre className="text-[10px] text-gray-400 font-mono p-3 overflow-x-auto leading-relaxed max-h-48">
        {json}
      </pre>
    </div>
  )
}

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, serverColor }: { tool: MCPTool; serverColor: string }) {
  const [open, setOpen] = useState(false)
  const agent = AGENTS.find(a => a.id === tool.agentId)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${serverColor}20`, border: `1px solid ${serverColor}33` }}>
          <Zap size={11} style={{ color: serverColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono font-bold text-white">{tool.name}</code>
            {agent && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{ color: agent.color, background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}>
                {agent.id}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{tool.description}</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {open
            ? <ChevronDown size={13} className="text-gray-500" />
            : <ChevronRight size={13} className="text-gray-500" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Input Schema</p>
              <SchemaViewer schema={tool.inputSchema} />
              {tool.inputSchema.required && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-gray-600">Required:</span>
                  {tool.inputSchema.required.map(r => (
                    <code key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono">{r}</code>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Server Panel ─────────────────────────────────────────────────────────────
type TabKey = 'tools' | 'resources' | 'prompts'

function ServerPanel({ server }: { server: MCPServer }) {
  const [tab, setTab] = useState<TabKey>('tools')
  const agent = AGENTS.find(a => a.id === server.agentId)

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'tools', label: 'Tools', count: server.tools.length },
    { key: 'resources', label: 'Resources', count: server.resources.length },
    { key: 'prompts', label: 'Prompts', count: server.prompts.length },
  ]

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Server header */}
      <div className="p-4 border-b border-white/10" style={{ background: `${server.color}08` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${server.color}20`, border: `1px solid ${server.color}40` }}>
            <Server size={16} style={{ color: server.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <code className="text-sm font-bold text-white">{server.name}</code>
              <span className="text-[9px] font-mono text-gray-600">v{server.version}</span>
              <LiveIndicator status={server.status === 'connected' ? 'active' : 'error'} size="sm" showLabel={false} />
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{server.description}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <Globe size={10} />
            <span className="font-mono truncate max-w-[160px]">{server.endpoint}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: server.color }}>
            <Radio size={10} />
            <span className="font-mono uppercase">{server.transport}</span>
          </div>
          {agent && (
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full"
              style={{ color: agent.color, background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: agent.color }} />
              {agent.name}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-3">
          <div className="text-center">
            <div className="text-sm font-bold text-white">{server.callsToday.toLocaleString()}</div>
            <div className="text-[9px] text-gray-500">calls today</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">{server.avgLatencyMs}ms</div>
            <div className="text-[9px] text-gray-500">avg latency</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">{server.tools.length}</div>
            <div className="text-[9px] text-gray-500">tools</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-white border-current'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
            style={tab === t.key ? { borderColor: server.color, color: server.color } : {}}
          >
            {t.label}
            <span className="px-1 py-0.5 rounded text-[9px] font-bold"
              style={tab === t.key
                ? { background: `${server.color}20`, color: server.color }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }
              }>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {tab === 'tools' && server.tools.map(tool => (
          <ToolCard key={tool.name} tool={tool} serverColor={server.color} />
        ))}

        {tab === 'resources' && server.resources.map(res => (
          <div key={res.uri} className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start gap-2">
              <Database size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <code className="text-xs font-mono text-cyan-400">{res.uri}</code>
                <p className="text-xs font-semibold text-white mt-0.5">{res.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{res.description}</p>
                <div className="mt-1.5 text-[9px] font-mono text-gray-600 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 inline-block">
                  {res.mimeType}
                </div>
              </div>
            </div>
          </div>
        ))}

        {tab === 'prompts' && server.prompts.map(prompt => (
          <div key={prompt.name} className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start gap-2">
              <BookOpen size={12} style={{ color: server.color }} className="mt-0.5 flex-shrink-0" />
              <div>
                <code className="text-xs font-mono font-bold text-white">{prompt.name}</code>
                <p className="text-[11px] text-gray-500 mt-0.5 mb-2">{prompt.description}</p>
                <div className="space-y-1">
                  {prompt.arguments.map(arg => (
                    <div key={arg.name} className="flex items-center gap-2 text-[10px]">
                      <code className="font-mono text-amber-400">{arg.name}</code>
                      {arg.required && <span className="text-red-400 font-bold">required</span>}
                      <span className="text-gray-600">{arg.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tool Call Log ────────────────────────────────────────────────────────────
function ToolCallLog({ calls }: { calls: ToolCall[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal size={14} className="text-accent-cyan" />
            Live Tool Calls
          </h3>
          <p className="text-[10px] text-gray-500">Real-time MCP invocations by AI agents</p>
        </div>
        <LiveIndicator status="active" size="sm" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        <AnimatePresence>
          {calls.map(call => {
            const server = MCP_SERVERS.find(s => s.id === call.serverId)!
            const agent = AGENTS.find(a => a.id === call.agentId)!
            const isExpanded = expanded === call.id

            return (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : call.id)}
                  className="w-full flex items-center gap-3 p-2.5 text-left"
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {call.status === 'success'
                      ? <CheckCircle2 size={13} className="text-accent-green" />
                      : call.status === 'error'
                        ? <XCircle size={13} className="text-accent-red" />
                        : <Loader2 size={13} className="text-accent-cyan animate-spin" />
                    }
                  </div>

                  {/* Agent avatar */}
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                    {agent.id[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono font-bold text-white">{call.toolName}</code>
                      <span className="text-[9px] text-gray-600">on</span>
                      <code className="text-[10px] font-mono" style={{ color: server?.color }}>{call.serverId}</code>
                    </div>
                  </div>

                  {/* Latency + time */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 justify-end">
                      <Clock size={9} />
                      {call.latencyMs}ms
                    </div>
                    <div className="text-[9px] text-gray-600 font-mono">
                      {call.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  <ChevronDown size={11} className={`text-gray-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Params</p>
                          <pre className="text-[10px] font-mono text-gray-400 bg-black/30 rounded-lg p-2 overflow-x-auto">
                            {JSON.stringify(call.params, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Result</p>
                          <pre className="text-[10px] font-mono text-accent-green bg-black/30 rounded-lg p-2 overflow-x-auto">
                            {JSON.stringify(call.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Config Snippet ───────────────────────────────────────────────────────────
function ConfigSnippet() {
  const [copied, setCopied] = useState(false)
  const config = {
    mcpServers: {
      "welloff-leads": { command: "npx", args: ["-y", "@welloff/mcp-leads"], env: { WELLOFF_API_KEY: "YOUR_KEY" } },
      "welloff-property": { command: "npx", args: ["-y", "@welloff/mcp-property"], env: { WELLOFF_API_KEY: "YOUR_KEY" } },
      "welloff-comms": { command: "npx", args: ["-y", "@welloff/mcp-comms"], env: { WELLOFF_API_KEY: "YOUR_KEY" } },
      "welloff-territory": { command: "npx", args: ["-y", "@welloff/mcp-territory"], env: { WELLOFF_API_KEY: "YOUR_KEY" } },
      "welloff-media": { command: "npx", args: ["-y", "@welloff/mcp-media"], env: { WELLOFF_API_KEY: "YOUR_KEY" } },
    }
  }
  const json = JSON.stringify(config, null, 2)
  const copy = () => { navigator.clipboard.writeText(json).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plug size={13} className="text-accent-cyan" />
            Claude Desktop / Any MCP Client Config
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Paste into <code className="text-cyan-400">claude_desktop_config.json</code> or any MCP-compatible client</p>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-400 font-semibold hover:bg-cyan-500/30 transition-colors">
          {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy Config</>}
        </button>
      </div>
      <pre className="text-[10px] font-mono text-gray-400 bg-black/40 rounded-xl p-3 overflow-x-auto leading-relaxed max-h-36 custom-scrollbar">
        {json}
      </pre>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MCPDashboard() {
  const [selectedServer, setSelectedServer] = useState<MCPServer>(MCP_SERVERS[0])
  const [calls, setCalls] = useState<ToolCall[]>([])
  const [callCount, setCallCount] = useState(getTotalCallsToday())

  // Seed + simulate live tool calls
  const seedCalls = useCallback(() => {
    return SIMULATED_CALLS.slice(0, 8).map((c, i) => ({
      ...c,
      id: `call-seed-${i}`,
      timestamp: new Date(Date.now() - (8 - i) * 18000),
    }))
  }, [])

  useEffect(() => {
    setCalls(seedCalls())

    const interval = setInterval(() => {
      const template = SIMULATED_CALLS[Math.floor(Math.random() * SIMULATED_CALLS.length)]
      const newCall: ToolCall = {
        ...template,
        id: `call-${Date.now()}`,
        timestamp: new Date(),
        latencyMs: Math.floor(template.latencyMs * (0.8 + Math.random() * 0.4)),
      }
      setCalls(prev => [newCall, ...prev.slice(0, 19)])
      setCallCount(prev => prev + 1)
    }, 3800)

    return () => clearInterval(interval)
  }, [seedCalls])

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Server size={18} className="text-accent-cyan" />
            </div>
            <h1 className="text-xl font-black text-white">MCP Server Hub</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-accent-cyan">5 SERVERS LIVE</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Model Context Protocol — AI agent tool registry and live call monitor</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="MCP Servers" value={MCP_SERVERS.length} sub="all connected" color="#00d4ff" />
        <StatCard label="Total Tools" value={getTotalTools()} sub="across all servers" color="#8b5cf6" />
        <StatCard label="Resources" value={getTotalResources()} sub="exposed endpoints" color="#10b981" />
        <StatCard label="Calls Today" value={callCount.toLocaleString()} sub="tool invocations" color="#f59e0b" />
      </div>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

        {/* Left: Server list */}
        <div className="col-span-2 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Servers</p>
          {MCP_SERVERS.map(server => {
            const agent = AGENTS.find(a => a.id === server.agentId)
            const isSelected = selectedServer.id === server.id
            return (
              <motion.button
                key={server.id}
                onClick={() => setSelectedServer(server)}
                whileHover={{ scale: 1.01 }}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-white/20 bg-white/[0.06]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
                style={isSelected ? { boxShadow: `0 0 15px ${server.color}22` } : {}}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: server.color }} />
                  <span className="text-[11px] font-bold text-white truncate">{server.name.replace('welloff-', '')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-600">{server.tools.length} tools</span>
                  {agent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color: agent.color, background: `${agent.color}15` }}>
                      {agent.id}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[9px] text-gray-600">
                  <Activity size={8} />
                  <span>{server.callsToday.toLocaleString()} calls</span>
                  <span className="ml-auto">{server.avgLatencyMs}ms</span>
                </div>
              </motion.button>
            )
          })}

          {/* Config snippet below server list */}
          <div className="mt-2">
            <ConfigSnippet />
          </div>
        </div>

        {/* Center: Server detail */}
        <div className="col-span-6 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedServer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ServerPanel server={selectedServer} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Live call log */}
        <div className="col-span-4 min-h-0">
          <ToolCallLog calls={calls} />
        </div>
      </div>
    </div>
  )
}
