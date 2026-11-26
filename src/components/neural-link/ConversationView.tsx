'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mic, Type } from 'lucide-react'
import { NeuralMessage } from '@/lib/neural-link/types'
import { getPersona } from '@/lib/neural-link/personas'

interface ConversationViewProps {
  messages: NeuralMessage[]
  emptyHint?: string
}

export default function ConversationView({ messages, emptyHint }: ConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3 min-h-0">
      {messages.length === 0 && emptyHint && (
        <div className="h-full flex items-center justify-center text-center">
          <p className="text-xs font-mono text-gray-600 max-w-xs leading-relaxed">{emptyHint}</p>
        </div>
      )}
      {messages.map((msg) => {
        const persona = getPersona(msg.personaId)
        const isUser = msg.role === 'user'
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
          >
            <div
              className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={
                isUser
                  ? {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#9ca3af',
                    }
                  : {
                      background: `${persona.color}20`,
                      border: `1px solid ${persona.color}55`,
                      color: persona.color,
                    }
              }
            >
              {isUser ? 'YOU' : persona.id.slice(0, 2)}
            </div>

            <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className="px-3 py-2 rounded-xl text-xs leading-relaxed"
                style={
                  isUser
                    ? {
                        background: 'rgba(0,212,255,0.08)',
                        border: '1px solid rgba(0,212,255,0.20)',
                        color: '#e5e7eb',
                      }
                    : {
                        background: `${persona.color}10`,
                        border: `1px solid ${persona.color}33`,
                        color: '#e5e7eb',
                      }
                }
              >
                {msg.content}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-600">
                {msg.source === 'voice' ? <Mic size={9} /> : <Type size={9} />}
                <span>{msg.source === 'voice' ? 'VOICE' : 'TEXT'}</span>
                <span>·</span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {!isUser && (
                  <>
                    <span>·</span>
                    <span style={{ color: persona.color }}>{persona.name}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
