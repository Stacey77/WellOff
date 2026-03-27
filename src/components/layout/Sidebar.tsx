'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Radar,
  MessageSquare,
  Map,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Server,
} from 'lucide-react'

const navItems = [
  {
    href: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    color: '#00d4ff',
  },
  {
    href: '/tonradar',
    icon: Radar,
    label: 'TonRadar',
    color: '#8b5cf6',
  },
  {
    href: '/command-center',
    icon: MessageSquare,
    label: 'Command Center',
    color: '#00d4ff',
  },
  {
    href: '/territory',
    icon: Map,
    label: 'Territory',
    color: '#10b981',
  },
  {
    href: '/media-studio',
    icon: Wand2,
    label: 'Media Studio',
    color: '#f59e0b',
  },
  {
    href: '/mcp',
    icon: Server,
    label: 'MCP Hub',
    color: '#00d4ff',
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-full border-r border-white/10 bg-[#0a0f1e]/80 backdrop-blur-xl relative z-10 flex-shrink-0"
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #00d4ff33, #8b5cf644)',
            border: '1px solid #00d4ff44',
            boxShadow: '0 0 15px #00d4ff33',
          }}>
          <Zap size={16} className="text-accent-cyan" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-white font-black text-base tracking-tight leading-none">WellOff</div>
            <div className="text-[10px] text-cyan-400 font-mono tracking-widest">AI REAL ESTATE OPS</div>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-hidden">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-white/10 border border-white/10'
                    : 'hover:bg-white/5 border border-transparent'
                  }`}
                style={isActive ? { boxShadow: `0 0 15px ${item.color}22` } : {}}
              >
                <Icon
                  size={18}
                  className="flex-shrink-0 transition-all"
                  style={{ color: isActive ? item.color : '#6b7280' }}
                />
                {!collapsed && (
                  <span
                    className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}
                  >
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Status indicator */}
      {!collapsed && (
        <div className="p-3 mx-2 mb-2 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[10px] font-mono text-green-400 font-bold">ALL SYSTEMS LIVE</span>
          </div>
          <p className="text-[9px] text-gray-500 mt-0.5">6 agents active</p>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0d1526] border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors z-20"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-gray-400" />
          : <ChevronLeft size={12} className="text-gray-400" />
        }
      </button>
    </motion.aside>
  )
}
