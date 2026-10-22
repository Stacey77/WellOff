'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Zap, Bot, User } from 'lucide-react'
import { ChatMessage } from '@/types'

const quickActions = [
  { label: 'Find leads in 90210', icon: '🎯' },
  { label: 'Send follow-up to John Smith', icon: '📱' },
  { label: 'Generate offer letter', icon: '📄' },
  { label: 'Pull comp report', icon: '📊' },
  { label: 'Claim territory 90028', icon: '🗺️' },
  { label: 'Draft NDA for deal', icon: '✍️' },
]

const tonResponses: Record<string, string> = {
  default: "I'm TON, your Total Operations Navigator. I've orchestrated 6 specialized AI agents across your real estate portfolio. What would you like to accomplish today?",
  leads: "Scanning lead database for 90210... Found 23 potential sellers with movement scores above 70. ARIA has flagged 8 as hot leads. Shall I initiate an outreach sequence for all 23, or just the top 8? I can also schedule a territory sweep.",
  followup: "Locating John Smith in your contacts... Found him. He's at step 2 of 5 in your nurture sequence. His last response was positive — he asked about comps. ARIA is drafting a personalized follow-up with recent sales data. Send now or review first?",
  offer: "Generating offer letter... I need a few details: Property address, offer amount, and any contingencies? Or should I pull the data from your last discussed property (4821 Sunset Blvd, asking $1.25M)? I'll have it ready in 30 seconds.",
  comp: "Pulling comp report for your active territories... Analyzing 47 recent sales across 90028 and 75201. Average DOM: 23 days. Median price/sqft up 3.2% MoM. Generating full PDF report — want me to attach it to Marcus Thompson's follow-up too?",
  territory: "Initiating territory claim for ZIP 90028... Scanning 2,100 properties. High opportunity score: 91/100. Found 28 motivated sellers. TERRA has identified 6 vacant properties with tax delinquency. Claim now for $0 (you're already in this zone). Shall I start automated outreach?",
  nda: "Generating NDA... Pulling template from your document vault. Do you want the standard mutual NDA or a one-way NDA protecting your deal strategy? I can have it ready in under 60 seconds with e-signature ready.",
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('lead') || lower.includes('find')) return tonResponses.leads
  if (lower.includes('follow') || lower.includes('john') || lower.includes('smith')) return tonResponses.followup
  if (lower.includes('offer')) return tonResponses.offer
  if (lower.includes('comp')) return tonResponses.comp
  if (lower.includes('territory') || lower.includes('claim')) return tonResponses.territory
  if (lower.includes('nda') || lower.includes('contract')) return tonResponses.nda
  return tonResponses.default
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: tonResponses.default,
      timestamp: new Date(),
      agentId: 'TON',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayedText])

  const simulateTyping = (messageId: string, text: string) => {
    setTypingMessageId(messageId)
    setDisplayedText('')
    let i = 0
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i))
        i++
      } else {
        clearInterval(interval)
        setTypingMessageId(null)
        setIsTyping(false)
      }
    }, 18)
    return () => clearInterval(interval)
  }

  const sendMessage = (text?: string) => {
    const content = text || input.trim()
    if (!content) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const responseText = getResponse(content)
    const responseId = `resp-${Date.now()}`

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: responseId,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        agentId: 'TON',
      }
      setMessages(prev => [...prev, assistantMsg])
      simulateTyping(responseId, responseText)
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{
            background: 'linear-gradient(135deg, #00d4ff33, #00d4ff11)',
            border: '1px solid #00d4ff55',
            boxShadow: '0 0 15px #00d4ff33',
            color: '#00d4ff',
          }}
        >
          TON
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Chat with TON</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[10px] text-gray-500">Total Operations Navigator — All agents ready</span>
          </div>
        </div>
        <div className="ml-auto px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-[10px] font-mono font-bold text-accent-cyan">LIVE</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.label)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'bg-cyan-500/20 border border-cyan-500/30'
                }`}
              >
                {msg.role === 'user'
                  ? <User size={13} className="text-purple-400" />
                  : <Bot size={13} className="text-cyan-400" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-500/20 border border-purple-500/20 text-white rounded-tr-sm'
                      : 'bg-cyan-500/10 border border-cyan-500/15 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && typingMessageId === msg.id
                    ? (
                      <span>
                        {displayedText}
                        <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 animate-pulse" />
                      </span>
                    )
                    : msg.content
                  }
                </div>
                <span className="text-[10px] text-gray-600 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && !typingMessageId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/20 border border-cyan-500/30">
              <Bot size={13} className="text-cyan-400" />
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/15 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-cyan-500/40 transition-colors">
            <Zap size={13} className="text-gray-600 flex-shrink-0" />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask TON anything — find leads, generate docs, manage CRM..."
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none"
            />
            <button className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <Mic size={13} className="text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
