'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map, TrendingUp, Building, Users, AlertTriangle, Star, Shield } from 'lucide-react'
import { territories, getTerritoryStatusColor, getOpportunityColor } from '@/lib/data/territories'
import { properties, formatCurrency, getMovementScoreColor, getMovementScoreBg } from '@/lib/data/properties'
import { Territory, Property } from '@/types'
import ZipCodeClaimer from './ZipCodeClaimer'
import MovementScorer from './MovementScorer'
import AgentBot, { AGENTS } from '@/components/agents/AgentBot'

const terraAgent = AGENTS.find(a => a.id === 'TERRA')!

export default function TerritoryDashboard() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'claimed' | 'available'>('all')

  const filtered = territories.filter(t => {
    if (activeTab === 'claimed') return t.status === 'claimed'
    if (activeTab === 'available') return t.status !== 'claimed'
    return true
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Map size={18} className="text-accent-green" />
            </div>
            <h1 className="text-xl font-black text-white">Territory Intelligence</h1>
          </div>
          <p className="text-sm text-gray-500">AI-mapped territory zones with movement analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'claimed', 'available'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-green-500/20 border border-green-500/30 text-accent-green'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left column */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <ZipCodeClaimer />
          <AgentBot agent={terraAgent} showLog={true} />
        </div>

        {/* Center: Territories + Properties */}
        <div className="col-span-6 flex flex-col gap-4 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Territory Grid */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={13} className="text-accent-green" />
              Territory Map
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((territory, i) => (
                <TerritoryCard key={territory.id} territory={territory} index={i} />
              ))}
            </div>
          </div>

          {/* Properties Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Building size={13} className="text-accent-cyan" />
              Property Intelligence
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Address', 'Owner', 'Est. Value', 'Owned', 'Move Score', 'Flags'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop, i) => (
                    <motion.tr
                      key={prop.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedProperty(prev => prev?.id === prop.id ? null : prop)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                    >
                      <td className="py-2 pr-3">
                        <div className="text-xs text-gray-300 truncate max-w-[130px]">{prop.address}</div>
                        <div className="text-[10px] text-gray-600">{prop.city}, {prop.state}</div>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-400 truncate max-w-[100px]">{prop.owner}</td>
                      <td className="py-2 pr-3 text-xs font-semibold text-accent-cyan">{formatCurrency(prop.estimatedValue)}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500">{prop.timeOwned}yr</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getMovementScoreBg(prop.movementScore)}`}
                              style={{ width: `${prop.movementScore}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${getMovementScoreColor(prop.movementScore)}`}>
                            {prop.movementScore}
                          </span>
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {prop.taxDelinquent && (
                            <div className="px-1 py-0.5 rounded text-[9px] bg-red-500/10 border border-red-500/20 text-accent-red font-bold">TAX</div>
                          )}
                          {prop.vacancySignal && (
                            <div className="px-1 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/20 text-accent-amber font-bold">VAC</div>
                          )}
                          {prop.status === 'vacant' && (
                            <div className="px-1 py-0.5 rounded text-[9px] bg-gray-500/10 border border-gray-500/20 text-gray-400 font-bold">VACANT</div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Scorer + unclaimed */}
        <div className="col-span-3 flex flex-col gap-4">
          {selectedProperty ? (
            <MovementScorer property={selectedProperty} />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-4 flex flex-col items-center justify-center text-center">
              <TrendingUp size={24} className="text-gray-600 mb-2" />
              <p className="text-xs text-gray-500">Click a property row to view Movement Likelihood Score breakdown</p>
            </div>
          )}

          {/* Unclaimed suggestions */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Star size={13} className="text-accent-amber" />
              AI Opportunity Picks
            </h3>
            <div className="space-y-2">
              {territories
                .filter(t => t.status !== 'claimed')
                .sort((a, b) => b.opportunityScore - a.opportunityScore)
                .slice(0, 4)
                .map(t => (
                  <div key={t.id} className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{t.zipCode}</span>
                      <span className={`text-xs font-bold ${getOpportunityColor(t.opportunityScore)}`}>
                        {t.opportunityScore}/100
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">{t.city}, {t.state}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent-green"
                          style={{ width: `${t.opportunityScore}%` }}
                        />
                      </div>
                      {t.competitorCount === 0 ? (
                        <span className="text-[9px] text-accent-green font-bold">UNCLAIMED</span>
                      ) : (
                        <span className="text-[9px] text-accent-amber">{t.competitorCount} rivals</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TerritoryCard({ territory, index }: { territory: Territory; index: number }) {
  const sc = getTerritoryStatusColor(territory.status)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-black text-white">{territory.zipCode}</span>
          <p className="text-[10px] text-gray-500">{territory.city}</p>
        </div>
        <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${sc}`}>
          {territory.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-xs font-bold text-white">{territory.ownerCount.toLocaleString()}</div>
          <div className="text-[9px] text-gray-500">owners</div>
        </div>
        <div className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-xs font-bold text-white">{territory.leadDensity}/mo</div>
          <div className="text-[9px] text-gray-500">leads</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-green"
            style={{ width: `${territory.movementScore}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-accent-green">{territory.movementScore}%</span>
      </div>

      {territory.claimedBy && (
        <div className="mt-1.5 flex items-center gap-1">
          <Shield size={9} className="text-accent-green" />
          <span className="text-[9px] text-accent-green font-bold">YOURS</span>
        </div>
      )}
    </motion.div>
  )
}
