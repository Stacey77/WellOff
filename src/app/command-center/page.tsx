'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, FileText, Terminal, Download } from 'lucide-react'
import { UserRole } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ChatInterface from '@/components/command-center/ChatInterface'
import ContactsPanel from '@/components/command-center/ContactsPanel'
import SMSPanel from '@/components/command-center/SMSPanel'
import AgentBot, { AGENTS } from '@/components/agents/AgentBot'

const tonAgent = AGENTS.find(a => a.id === 'TON')!

const docTemplates = [
  { label: 'Offer Letter', icon: FileText, color: '#8b5cf6', desc: 'Standard residential offer' },
  { label: 'Letter of Intent', icon: FileText, color: '#00d4ff', desc: 'Commercial LOI template' },
  { label: 'NDA', icon: FileText, color: '#f59e0b', desc: 'Mutual non-disclosure' },
  { label: 'Lease Agreement', icon: FileText, color: '#10b981', desc: 'Residential lease' },
  { label: 'Comp Report', icon: FileText, color: '#ef4444', desc: 'Market comp analysis' },
  { label: 'Purchase Contract', icon: FileText, color: '#3b82f6', desc: 'AS-IS purchase contract' },
]

const crmLog = [
  { time: '14:32:01', action: 'ARIA found 3 new FSBO leads in 90028', agent: '#8b5cf6' },
  { time: '14:31:45', action: 'TON sent comp report to Marcus Thompson', agent: '#00d4ff' },
  { time: '14:30:22', action: 'NOVA queued follow-up for Eleanor Whitfield', agent: '#3b82f6' },
  { time: '14:28:11', action: 'CAPITA pulled NOI data for Houston industrial', agent: '#ef4444' },
  { time: '14:26:00', action: 'TERRA scanned 12 new permit filings', agent: '#10b981' },
  { time: '14:24:33', action: 'TON generated offer letter for 4821 Sunset', agent: '#00d4ff' },
]

export default function CommandCenterPage() {
  const [role, setRole] = useState<UserRole>('agent')
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null)
  const [generatedDocs, setGeneratedDocs] = useState<Set<string>>(new Set())

  const generateDoc = (label: string) => {
    setGeneratingDoc(label)
    setTimeout(() => {
      setGeneratingDoc(null)
      setGeneratedDocs(prev => { const s = new Set(prev); s.add(label); return s })
    }, 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} onRoleChange={setRole} />

        <main className="flex-1 overflow-hidden p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <MessageSquare size={18} className="text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Command Center</h1>
              <p className="text-sm text-gray-500">AI-powered CRM, messaging, and document generation</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
            {/* Main Chat */}
            <div className="col-span-5">
              <ChatInterface />
            </div>

            {/* Contacts + SMS */}
            <div className="col-span-3 flex flex-col gap-4 min-h-0">
              <div className="flex-1 min-h-0">
                <ContactsPanel />
              </div>
            </div>

            {/* SMS + Docs + Log */}
            <div className="col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-64">
                <SMSPanel />
              </div>

              {/* Doc Generator */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal size={14} className="text-accent-cyan" />
                  <h3 className="text-sm font-bold text-white">1-Click Doc Generator</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {docTemplates.map(doc => {
                    const isDone = generatedDocs.has(doc.label)
                    const isGenerating = generatingDoc === doc.label
                    return (
                      <motion.button
                        key={doc.label}
                        onClick={() => !isDone && generateDoc(doc.label)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                          isDone
                            ? 'border-green-500/20 bg-green-500/10'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                        }`}
                      >
                        {isGenerating && (
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                            className="absolute bottom-0 left-0 h-0.5"
                            style={{ background: doc.color }}
                          />
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{doc.label}</span>
                          {isDone ? (
                            <div className="flex gap-1">
                              <Download size={10} className="text-accent-green" />
                            </div>
                          ) : isGenerating ? (
                            <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" style={{ color: doc.color }} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: doc.color }} />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">{doc.desc}</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* CRM Command Log */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Terminal size={13} className="text-gray-500" />
                  CRM Command Log
                </h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {crmLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">{entry.time}</span>
                      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: entry.agent }} />
                      <span className="text-[10px] text-gray-400 leading-relaxed">{entry.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TON Agent */}
              <AgentBot agent={tonAgent} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
