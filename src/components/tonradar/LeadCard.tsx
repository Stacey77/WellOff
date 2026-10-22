'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Phone, Mail, Clock, Zap, CheckCircle, Circle } from 'lucide-react'
import { Lead } from '@/types'
import { signalTypeColors, signalSourceIcons } from '@/lib/data/leads'
import { formatCurrency } from '@/lib/data/properties'

interface LeadCardProps {
  lead: Lead
  index: number
  isNew?: boolean
}

const enrichmentConfig = {
  pending: { label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  enriched: { label: 'Enriched', color: 'text-accent-green', bg: 'bg-green-500/10 border-green-500/20' },
  contacted: { label: 'Contacted', color: 'text-accent-cyan', bg: 'bg-cyan-500/10 border-cyan-500/20' },
}

export default function LeadCard({ lead, index, isNew = false }: LeadCardProps) {
  const enrichConfig = enrichmentConfig[lead.enrichmentStatus]
  const signalColor = signalTypeColors[lead.signalType]

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -30, scale: 0.95 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ delay: isNew ? 0 : index * 0.04 }}
      className="group relative rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm p-3.5 transition-all duration-200 hover:border-white/20"
    >
      {isNew && (
        <div className="absolute top-2 right-2">
          <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse">
            NEW
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #ffffff15, #ffffff05)',
            border: '1px solid #ffffff15',
          }}>
          {lead.name.split(' ').map(n => n[0]).join('')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{lead.name}</span>
            <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${enrichConfig.bg} ${enrichConfig.color}`}>
              {enrichConfig.label}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-gray-500">
              {signalSourceIcons[lead.signalSource]} {lead.signalSource}
            </span>
          </div>
        </div>
      </div>

      {/* Signal Type */}
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold mb-3 ${signalColor}`}>
        <Zap size={9} />
        {lead.signalType}
      </div>

      {/* Confidence */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 font-medium">Signal Strength</span>
          <span className="text-[10px] font-bold text-white">{lead.confidence}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${lead.confidence}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            className="h-full rounded-full"
            style={{
              background: lead.confidence >= 80
                ? 'linear-gradient(90deg, #10b981, #00d4ff)'
                : lead.confidence >= 65
                  ? 'linear-gradient(90deg, #f59e0b, #10b981)'
                  : 'linear-gradient(90deg, #ef4444, #f59e0b)',
            }}
          />
        </div>
      </div>

      {/* Property */}
      <div className="text-[11px] text-gray-400 mb-2 flex items-center gap-1.5">
        <TrendingUp size={10} className="text-gray-600" />
        <span className="truncate">{lead.propertyAddress}</span>
        <span className="text-accent-cyan font-semibold ml-auto flex-shrink-0">
          {formatCurrency(lead.estimatedValue)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/5">
        {lead.phone && (
          <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-accent-cyan transition-colors">
            <Phone size={10} />
            <span>{lead.phone}</span>
          </button>
        )}

        <div className="flex items-center gap-1 text-[10px] text-gray-600 ml-auto">
          <Clock size={9} />
          <span>{lead.lastActivity}</span>
        </div>

        {lead.followUpQueued ? (
          <div className="flex items-center gap-1 text-[10px] text-accent-green">
            <CheckCircle size={10} />
            <span>Queued</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <Circle size={10} />
            <span>No follow-up</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
