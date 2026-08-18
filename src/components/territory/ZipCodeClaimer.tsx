'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Zap, TrendingUp, Users, Building, CheckCircle } from 'lucide-react'
import { territories } from '@/lib/data/territories'
import { Territory } from '@/types'

const statusColors = {
  claimed: { text: 'text-accent-green', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Claimed' },
  contested: { text: 'text-accent-amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Contested' },
  available: { text: 'text-accent-cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Available' },
}

export default function ZipCodeClaimer() {
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Territory | null>(null)
  const [claimed, setClaimed] = useState<Set<string>>(new Set(['terr-1', 'terr-2']))
  const [claiming, setClaiming] = useState<string | null>(null)

  const handleSearch = (val: string) => {
    setSearch(val)
    if (val.length >= 3) {
      const match = territories.find(t =>
        t.zipCode.includes(val) || t.city.toLowerCase().includes(val.toLowerCase())
      )
      setPreview(match || null)
    } else {
      setPreview(null)
    }
  }

  const claimTerritory = (territory: Territory) => {
    setClaiming(territory.id)
    setTimeout(() => {
      setClaimed(prev => { const s = new Set(prev); s.add(territory.id); return s })
      setClaiming(null)
    }, 1500)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <MapPin size={14} className="text-accent-green" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Territory Claimer</h3>
          <p className="text-xs text-gray-500">Search & claim zip codes as your territory</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Enter zip code or city name..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-green-500/30 transition-colors"
        />
      </div>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">{preview.zipCode}</span>
                  <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[preview.status].bg} ${statusColors[preview.status].border} ${statusColors[preview.status].text}`}>
                    {statusColors[preview.status].label}
                  </div>
                </div>
                <p className="text-sm text-gray-400">{preview.city}, {preview.state}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-accent-green">{preview.opportunityScore}</div>
                <div className="text-[10px] text-gray-500">opportunity score</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Properties', value: preview.properties.toLocaleString(), icon: Building },
                { label: 'Owners', value: preview.ownerCount.toLocaleString(), icon: Users },
                { label: 'Avg Age', value: `${preview.avgHomeAge}yr`, icon: TrendingUp },
              ].map(stat => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                    <Icon size={11} className="text-gray-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">{stat.value}</div>
                    <div className="text-[9px] text-gray-500">{stat.label}</div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${preview.movementScore}%` }}
                  className="h-full rounded-full bg-accent-green"
                />
              </div>
              <span className="text-xs font-bold text-accent-green">{preview.movementScore}% movement</span>
            </div>

            {claimed.has(preview.id) ? (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-accent-green text-sm font-bold">
                <CheckCircle size={15} />
                Territory Claimed
              </div>
            ) : (
              <button
                onClick={() => claimTerritory(preview)}
                disabled={claiming === preview.id}
                className="w-full py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-accent-green text-sm font-bold hover:bg-green-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {claiming === preview.id ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Claim Territory
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Your territories */}
      <div>
        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Your Territories ({claimed.size})</p>
        <div className="space-y-1.5">
          {territories.filter(t => claimed.has(t.id)).map(t => (
            <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-green-500/5 border border-green-500/15 hover:bg-green-500/10 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MapPin size={12} className="text-accent-green" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">{t.zipCode} — {t.city}</div>
                <div className="text-[10px] text-gray-500">{t.leadDensity} leads/mo • {t.properties.toLocaleString()} properties</div>
              </div>
              <div className="text-xs font-bold text-accent-green">{t.opportunityScore}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
