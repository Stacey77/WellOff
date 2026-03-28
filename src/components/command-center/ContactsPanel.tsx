'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Phone, Mail, Star, TrendingUp, User } from 'lucide-react'
import { contacts } from '@/lib/data/contacts'
import { Contact } from '@/types'

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
      style={{ color, background: `${color}15`, border: `1px solid ${color}33` }}
    >
      <TrendingUp size={8} />
      {score}
    </div>
  )
}

const typeColors: Record<Contact['type'], string> = {
  lead: 'text-accent-purple bg-purple-500/10 border-purple-500/20',
  client: 'text-accent-green bg-green-500/10 border-green-500/20',
  prospect: 'text-accent-amber bg-amber-500/10 border-amber-500/20',
}

export default function ContactsPanel() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/10">
        <h3 className="text-sm font-bold text-white mb-2">Contacts</h3>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {selected ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 space-y-3"
          >
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Back to contacts
            </button>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                {selected.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{selected.name}</div>
                <div className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex ${typeColors[selected.type]}`}>
                  {selected.type}
                </div>
              </div>
              <ScoreBadge score={selected.aiScore} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Phone size={11} />
                {selected.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mail size={11} />
                {selected.email}
              </div>
            </div>

            {selected.propertyInterest && (
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-gray-500 mb-1">Property Interest</p>
                <p className="text-xs text-gray-300">{selected.propertyInterest}</p>
              </div>
            )}

            {selected.notes && (
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-gray-500 mb-1">AI Notes</p>
                <p className="text-xs text-gray-400 leading-relaxed">{selected.notes}</p>
              </div>
            )}

            <div className="flex gap-1.5 flex-wrap">
              {selected.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 font-semibold hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-1.5">
                <Phone size={11} />
                Call
              </button>
              <button className="py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-semibold hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1.5">
                <Mail size={11} />
                Email
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-0.5 p-1.5">
            {filtered.map((contact, i) => (
              <motion.button
                key={contact.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(contact)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-300 flex-shrink-0 group-hover:bg-white/15 transition-colors">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-200 truncate">{contact.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1 py-0.5 rounded border ${typeColors[contact.type]}`}>
                      {contact.type}
                    </span>
                    <span className="text-[9px] text-gray-600">{contact.lastContact}</span>
                  </div>
                </div>
                <ScoreBadge score={contact.aiScore} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
