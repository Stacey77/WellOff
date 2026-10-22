'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Zap, ChevronDown } from 'lucide-react'
import { contacts, messages as initialMessages } from '@/lib/data/contacts'
import { Message } from '@/types'

export default function SMSPanel() {
  const [selectedContactId, setSelectedContactId] = useState(contacts[0].id)
  const [allMessages, setAllMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [showDraft, setShowDraft] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const contact = contacts.find(c => c.id === selectedContactId)!
  const thread = allMessages.filter(m => m.contactId === selectedContactId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const send = () => {
    if (!input.trim()) return
    const msg: Message = {
      id: `sms-${Date.now()}`,
      contactId: selectedContactId,
      contactName: contact.name,
      content: input.trim(),
      direction: 'outbound',
      timestamp: new Date(),
      status: 'sent',
    }
    setAllMessages(prev => [...prev, msg])
    setInput('')
    setShowDraft(null)

    // Simulate reply
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const replies = [
          "Thanks, I'll think about it.",
          "Can we talk more about the price?",
          "What's the timeline on this?",
          "I'm interested. Send me more info.",
          "Not interested at this time.",
        ]
        const reply: Message = {
          id: `sms-reply-${Date.now()}`,
          contactId: selectedContactId,
          contactName: contact.name,
          content: replies[Math.floor(Math.random() * replies.length)],
          direction: 'inbound',
          timestamp: new Date(),
          status: 'read',
          aiDraft: "AI suggestion: Respond with value-add and a soft call-to-action.",
        }
        setAllMessages(prev => [...prev, reply])
      }, 4000)
    }
  }

  const aiDrafts = [
    `Hi ${contact.name}, following up on our last conversation. I have great news about properties in your area — values are up 4% this quarter. Can we connect this week?`,
    `${contact.name}, I pulled the latest comps for you. 3 similar properties sold above asking last month. Would love to share the full report — want me to text it over?`,
    `Hey ${contact.name} — checking in. Our team has a cash buyer actively looking in your area. Would you consider a no-obligation offer?`,
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm h-full flex flex-col overflow-hidden">
      {/* Header + Contact Selector */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white">SMS / Messaging</h3>
          <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-accent-green font-bold">
            AI DRAFTS ON
          </div>
        </div>
        <div className="relative">
          <select
            value={selectedContactId}
            onChange={e => setSelectedContactId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-white/20 appearance-none pr-7"
          >
            {contacts.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0d1526]">
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <AnimatePresence>
          {thread.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.direction === 'outbound'
                      ? 'bg-cyan-500/20 border border-cyan-500/20 text-white rounded-tr-sm'
                      : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-1 px-1 ${msg.direction === 'outbound' ? 'justify-end' : ''}`}>
                  <span className="text-[9px] text-gray-600">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.direction === 'outbound' && (
                    <span className={`text-[9px] ${msg.status === 'read' ? 'text-accent-cyan' : 'text-gray-600'}`}>
                      {msg.status}
                    </span>
                  )}
                </div>
                {msg.direction === 'inbound' && msg.aiDraft && (
                  <div className="mt-1 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap size={8} className="text-purple-400" />
                      <span className="text-[9px] text-purple-400 font-bold">AI SUGGESTION</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{msg.aiDraft}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* AI Draft Section */}
      <div className="px-3 py-2 border-t border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={10} className="text-purple-400" />
          <span className="text-[10px] text-purple-400 font-bold">AI DRAFT SUGGESTIONS</span>
        </div>
        <div className="space-y-1">
          {aiDrafts.slice(0, 2).map((draft, i) => (
            <button
              key={i}
              onClick={() => setInput(draft)}
              className="w-full text-left p-2 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors"
            >
              <p className="text-[10px] text-gray-400 line-clamp-1">{draft}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message or use AI draft..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
