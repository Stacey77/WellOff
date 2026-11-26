'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Power, Mic, MicOff, Send, Radio, Sparkles } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import NeuralCore from '@/components/neural-link/NeuralCore'
import StatusBar from '@/components/neural-link/StatusBar'
import PersonaSelector from '@/components/neural-link/PersonaSelector'
import ProjectVault from '@/components/neural-link/ProjectVault'
import ConversationView from '@/components/neural-link/ConversationView'
import { UserRole } from '@/types'
import {
  AudioActivity,
  LinkStatus,
  NeuralMessage,
  NeuralProject,
  NeuralVaultState,
  PersonaId,
} from '@/lib/neural-link/types'
import { getPersona, PERSONAS } from '@/lib/neural-link/personas'
import {
  createProject,
  loadVault,
  removeProject,
  saveVault,
  upsertProject,
} from '@/lib/neural-link/storage'

const RESPONSES: Record<PersonaId, string[]> = {
  NOVA: [
    "Understood. Modeling that as a layered system — surface constraints, capital stack, and ops dependencies. Where should we pressure-test first?",
    "The architectural view: your portfolio is coupled at the financing layer. Decoupling that gives you optionality on the next acquisition cycle.",
    "Pattern recognized — this is the same primitive as your Q3 play. I'd reuse the framework rather than rebuild.",
  ],
  SAGE: [
    "Take a breath with this one. The deal reads fine on paper, but the operator is the risk. I'd verify track record before underwriting further.",
    "Long horizon says hold. Short horizon says the cycle is against you. Match the horizon to your cash position, not your ambition.",
    "A measured approach: anchor the thesis in two comparable deals you've actually closed. If it doesn't rhyme, it's speculation.",
  ],
  SPARK: [
    "Yes! Pitch angle: lead with the lifestyle delta, not the square footage. Buyers make the emotional call first, then justify.",
    "Try this hook — 'the address the algorithm missed.' Scarcity plus sly positioning. Cracks through saturated feeds.",
    "Spin up three creatives: aspirational, utilitarian, contrarian. Test all three. Whichever moves fastest wins the budget.",
  ],
  CYBER: [
    "Risk enumeration: (1) title encumbrance — pull the chain. (2) escrow counterparty — verify licensing. (3) wire instructions — confirm out-of-band.",
    "Compliance gap identified. Your data retention policy doesn't cover the new voice transcripts. Patch before next audit cycle.",
    "Attack surface analysis: the weakest link is the CRM integration — rotate the API key and enforce IP allowlisting before production.",
  ],
}

const SIMULATED_USER_UTTERANCES = [
  "Let's walk through the underwriting on the Dallas portfolio.",
  "I need a sanity check on the offer strategy.",
  "Give me your take on the positioning for the listing.",
  "What's the compliance risk with the new workflow?",
  "Help me think through the territory expansion.",
]

function pickResponse(personaId: PersonaId, userText: string): string {
  const bank = RESPONSES[personaId]
  const hash = userText.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return bank[hash % bank.length]
}

export default function NeuralLinkPage() {
  const [role, setRole] = useState<UserRole>('agent')

  const [vault, setVault] = useState<NeuralVaultState>({ activeProjectId: null, projects: [] })
  const [hydrated, setHydrated] = useState(false)

  const [status, setStatus] = useState<LinkStatus>('offline')
  const [activity, setActivity] = useState<AudioActivity>('idle')
  const [muted, setMuted] = useState(false)
  const [typedInput, setTypedInput] = useState('')

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }
  const pushTimer = (t: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(t)
  }

  const genRef = useRef(0)

  const interrupt = useCallback(() => {
    genRef.current += 1
    clearTimers()
    setActivity('idle')
  }, [])

  useEffect(() => {
    const loaded = loadVault()
    if (loaded.projects.length === 0) {
      const seed = createProject('Engineering Session #1')
      setVault({ activeProjectId: seed.id, projects: [seed] })
    } else {
      setVault({
        ...loaded,
        activeProjectId: loaded.activeProjectId ?? loaded.projects[0]?.id ?? null,
      })
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveVault(vault)
  }, [vault, hydrated])

  useEffect(() => () => clearTimers(), [])

  const activeProject = useMemo(
    () => vault.projects.find((p) => p.id === vault.activeProjectId) ?? null,
    [vault],
  )
  const activePersona = getPersona(activeProject?.personaId ?? 'NOVA')

  const updateActiveProject = useCallback(
    (mutator: (p: NeuralProject) => NeuralProject) => {
      setVault((prev) => {
        const current = prev.projects.find((p) => p.id === prev.activeProjectId)
        if (!current) return prev
        return upsertProject(prev, mutator(current))
      })
    },
    [],
  )

  const appendMessage = useCallback(
    (msg: NeuralMessage) => {
      updateActiveProject((p) => ({ ...p, messages: [...p.messages, msg] }))
    },
    [updateActiveProject],
  )

  const connect = useCallback(() => {
    interrupt()
    setStatus('connecting')
    const gen = genRef.current
    pushTimer(
      setTimeout(() => {
        if (gen !== genRef.current) return
        setStatus('active')
        const project = vault.projects.find((p) => p.id === vault.activeProjectId)
        if (project) {
          const persona = getPersona(project.personaId)
          const greeting: NeuralMessage = {
            id: `msg-${Date.now()}-conn`,
            role: 'assistant',
            personaId: project.personaId,
            content: `${persona.name} link restored. ${persona.greeting.split('.').slice(-2).join('.').trim()}`,
            source: 'voice',
            timestamp: Date.now(),
          }
          appendMessage(greeting)
          setActivity('speaking')
          pushTimer(
            setTimeout(() => {
              if (gen !== genRef.current) return
              setActivity('idle')
            }, 1800),
          )
        }
      }, 1400),
    )
  }, [appendMessage, interrupt, vault.activeProjectId, vault.projects])

  const disconnect = useCallback(() => {
    interrupt()
    setStatus('offline')
  }, [interrupt])

  const toggleLink = () => {
    if (status === 'offline' || status === 'error') connect()
    else disconnect()
  }

  const switchPersona = (id: PersonaId) => {
    if (!activeProject || activeProject.personaId === id) return
    updateActiveProject((p) => ({ ...p, personaId: id }))
    if (status === 'active' || status === 'connecting') {
      interrupt()
      setStatus('connecting')
      const gen = genRef.current
      pushTimer(
        setTimeout(() => {
          if (gen !== genRef.current) return
          setStatus('active')
          const persona = getPersona(id)
          const msg: NeuralMessage = {
            id: `msg-${Date.now()}-persona`,
            role: 'assistant',
            personaId: id,
            content: persona.greeting,
            source: 'voice',
            timestamp: Date.now(),
          }
          appendMessage(msg)
          setActivity('speaking')
          pushTimer(
            setTimeout(() => {
              if (gen !== genRef.current) return
              setActivity('idle')
            }, 1600),
          )
        }, 900),
      )
    }
  }

  const sendTurn = useCallback(
    (text: string, source: 'text' | 'voice') => {
      if (!activeProject) return
      const personaId = activeProject.personaId

      const userMsg: NeuralMessage = {
        id: `msg-${Date.now()}-u`,
        role: 'user',
        personaId,
        content: text,
        source,
        timestamp: Date.now(),
      }
      appendMessage(userMsg)
      setActivity('idle')

      const gen = genRef.current
      pushTimer(
        setTimeout(() => {
          if (gen !== genRef.current) return
          setActivity('speaking')
          const reply: NeuralMessage = {
            id: `msg-${Date.now()}-a`,
            role: 'assistant',
            personaId,
            content: pickResponse(personaId, text),
            source: status === 'active' ? 'voice' : 'text',
            timestamp: Date.now(),
          }
          appendMessage(reply)
          const dur = Math.min(3200, 900 + reply.content.length * 18)
          pushTimer(
            setTimeout(() => {
              if (gen !== genRef.current) return
              setActivity('idle')
            }, dur),
          )
        }, 650),
      )
    },
    [activeProject, appendMessage, status],
  )

  const handleTextSend = () => {
    const txt = typedInput.trim()
    if (!txt || !activeProject) return
    setTypedInput('')
    sendTurn(txt, 'text')
  }

  const holdStartRef = useRef<number | null>(null)
  const handleMicDown = () => {
    if (status !== 'active' || muted) return
    if (activity === 'speaking' || timersRef.current.length > 0) {
      interrupt()
    }
    holdStartRef.current = Date.now()
    setActivity('listening')
  }
  const handleMicUp = () => {
    if (holdStartRef.current == null) return
    const held = Date.now() - holdStartRef.current
    holdStartRef.current = null
    setActivity('idle')
    if (held < 300) return
    const utterance = SIMULATED_USER_UTTERANCES[Math.floor(Math.random() * SIMULATED_USER_UTTERANCES.length)]
    sendTurn(utterance, 'voice')
  }

  const handleCreate = (name: string) => {
    const p = createProject(name)
    setVault((prev) => ({
      activeProjectId: p.id,
      projects: [p, ...prev.projects],
    }))
  }
  const handleSelect = (id: string) => {
    setVault((prev) => ({ ...prev, activeProjectId: id }))
    if (status === 'active') {
      interrupt()
      setStatus('connecting')
      const gen = genRef.current
      pushTimer(
        setTimeout(() => {
          if (gen !== genRef.current) return
          setStatus('active')
        }, 900),
      )
    }
  }
  const handleDelete = (id: string) => {
    setVault((prev) => removeProject(prev, id))
  }

  const micDisabled = status !== 'active' || muted

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} onRoleChange={setRole} />

        <main className="flex-1 overflow-hidden grid grid-cols-12 gap-4 p-4 animated-bg">
          <div className="col-span-3 flex flex-col min-h-0">
            <ProjectVault
              projects={vault.projects}
              activeProjectId={vault.activeProjectId}
              onSelect={handleSelect}
              onCreate={handleCreate}
              onDelete={handleDelete}
            />
          </div>

          <div className="col-span-5 flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 min-h-0">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Neural Link
                </span>
              </div>
              <div className="text-[10px] font-mono text-gray-500">
                {activeProject ? activeProject.name : 'No project'}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <NeuralCore
                status={status}
                activity={activity}
                persona={activePersona}
                muted={muted}
              />
              <StatusBar status={status} persona={activePersona} />
            </div>

            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleLink}
                  title={
                    status === 'offline' || status === 'error'
                      ? 'Establish neural link'
                      : 'Terminate neural link'
                  }
                  className="px-5 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-2"
                  style={
                    status === 'active' || status === 'connecting'
                      ? {
                          background: `${activePersona.color}22`,
                          border: `1px solid ${activePersona.color}66`,
                          color: activePersona.color,
                          boxShadow: `0 0 20px ${activePersona.color}33`,
                        }
                      : {
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fca5a5',
                        }
                  }
                >
                  <Power size={14} />
                  {status === 'active'
                    ? 'Terminate Link'
                    : status === 'connecting'
                    ? 'Connecting…'
                    : 'Establish Link'}
                </button>

                <button
                  onClick={() => setMuted((m) => !m)}
                  disabled={status !== 'active'}
                  title={muted ? 'Unmute microphone' : 'Mute microphone'}
                  className={`p-2.5 rounded-xl border transition-all ${
                    status !== 'active' ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: muted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor: muted ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255,255,255,0.12)',
                  }}
                >
                  {muted ? (
                    <MicOff size={14} className="text-red-400" />
                  ) : (
                    <Mic size={14} className="text-gray-300" />
                  )}
                </button>

                <motion.button
                  onMouseDown={handleMicDown}
                  onMouseUp={handleMicUp}
                  onMouseLeave={handleMicUp}
                  onTouchStart={handleMicDown}
                  onTouchEnd={handleMicUp}
                  disabled={micDisabled}
                  title={
                    micDisabled
                      ? 'Establish the link to use voice'
                      : 'Hold to speak (simulated)'
                  }
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center gap-2 ${
                    micDisabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  whileTap={{ scale: 0.96 }}
                  style={
                    activity === 'listening'
                      ? {
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.6)',
                          color: '#34d399',
                          boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#e5e7eb',
                        }
                  }
                >
                  <Sparkles size={14} />
                  {activity === 'listening' ? 'Listening…' : 'Hold to Speak'}
                </motion.button>
              </div>

              <div className="flex gap-2">
                <input
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                  disabled={!activeProject}
                  placeholder={
                    activeProject
                      ? `Type a message to ${activePersona.name}…`
                      : 'Create a project to begin'
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40 disabled:opacity-40"
                />
                <button
                  onClick={handleTextSend}
                  disabled={!typedInput.trim() || !activeProject}
                  className="px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-3 min-h-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase">Persona</h3>
                <span className="text-[10px] font-mono text-gray-500">{PERSONAS.length} available</span>
              </div>
              <PersonaSelector
                activeId={activePersona.id}
                onSelect={switchPersona}
                disabled={!activeProject}
              />
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                <div className="text-[10px] font-mono text-gray-500">VOICE PROFILE</div>
                <div className="text-[11px] text-gray-300">{activePersona.voice}</div>
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                    Transcript
                  </h3>
                  <p className="text-[10px] font-mono text-gray-500">
                    {activeProject
                      ? `${activeProject.messages.length} messages · auto-saved`
                      : 'No active project'}
                  </p>
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: activePersona.color,
                    boxShadow: `0 0 8px ${activePersona.color}`,
                  }}
                />
              </div>
              <ConversationView
                messages={activeProject?.messages ?? []}
                emptyHint="Establish the link and speak — or type — to begin the transcript."
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
