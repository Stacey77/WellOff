'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, User, Zap, ChevronDown } from 'lucide-react'
import { UserRole } from '@/types'
import LiveIndicator from '@/components/ui/LiveIndicator'

interface HeaderProps {
  role: UserRole
  onRoleChange: (role: UserRole) => void
}

const roles: { value: UserRole; label: string; color: string }[] = [
  { value: 'agent', label: 'Agent', color: '#8b5cf6' },
  { value: 'developer', label: 'Developer', color: '#f59e0b' },
  { value: 'land-dev', label: 'Land Dev', color: '#10b981' },
  { value: 'commercial', label: 'Commercial', color: '#ef4444' },
  { value: 'non-commercial', label: 'Non-Commercial', color: '#3b82f6' },
]

export default function Header({ role, onRoleChange }: HeaderProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [notifications] = useState(7)
  const activeRole = roles.find(r => r.value === role)!

  return (
    <header className="h-14 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-xl flex items-center px-4 gap-4 relative z-10">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Ask TON anything... find leads, generate docs, claim territory"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.07] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* System status */}
        <div className="hidden md:flex items-center gap-2">
          <LiveIndicator status="active" size="sm" />
          <span className="text-[10px] font-mono text-gray-500">6 AGENTS ONLINE</span>
        </div>

        {/* Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: `${activeRole.color}44`,
              background: `${activeRole.color}11`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeRole.color }} />
            <span className="text-xs font-medium" style={{ color: activeRole.color }}>
              {activeRole.label}
            </span>
            <ChevronDown size={12} className="text-gray-500" />
          </button>

          {showRoleMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#0d1526] shadow-2xl overflow-hidden z-50"
            >
              {roles.map(r => (
                <button
                  key={r.value}
                  onClick={() => { onRoleChange(r.value); setShowRoleMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  <span className="text-sm text-gray-300">{r.label}</span>
                  {r.value === role && (
                    <div className="ml-auto">
                      <Zap size={10} style={{ color: r.color }} />
                    </div>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <Bell size={16} className="text-gray-400" />
          {notifications > 0 && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-cyan flex items-center justify-center">
              <span className="text-[9px] font-bold text-black">{notifications}</span>
            </div>
          )}
        </button>

        {/* User avatar */}
        <button className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #00d4ff33, #8b5cf633)',
            border: '1px solid #00d4ff44',
          }}>
          <User size={13} className="text-cyan-400" />
        </button>
      </div>
    </header>
  )
}
