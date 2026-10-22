'use client'

import { motion } from 'framer-motion'
import { Property, MovementFactors } from '@/types'
import { getMovementScoreColor, getMovementScoreBg } from '@/lib/data/properties'

interface MovementScorerProps {
  property: Property
  compact?: boolean
}

const factorLabels: Record<keyof MovementFactors, string> = {
  lifeEvents: 'Life Events',
  taxDelinquency: 'Tax Delinquency',
  vacancySignals: 'Vacancy Signals',
  listingHistory: 'Listing History',
  ownershipDuration: 'Ownership Duration',
}

const factorWeights: Record<keyof MovementFactors, number> = {
  lifeEvents: 0.25,
  taxDelinquency: 0.25,
  vacancySignals: 0.20,
  listingHistory: 0.15,
  ownershipDuration: 0.15,
}

export default function MovementScorer({ property, compact = false }: MovementScorerProps) {
  const score = property.movementScore
  const scoreColor = getMovementScoreColor(score)
  const scoreBg = getMovementScoreBg(score)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${scoreBg}`}
          />
        </div>
        <span className={`text-xs font-bold min-w-[2rem] text-right ${scoreColor}`}>{score}</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
      {/* Score header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Movement Likelihood</h3>
          <p className="text-xs text-gray-500 truncate">{property.address}</p>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={score >= 61 ? '#10b981' : score >= 31 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: `${score} 100` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeDashoffset="0"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-black ${scoreColor}`}>{score}</span>
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2.5">
        {(Object.entries(property.movementFactors) as [keyof MovementFactors, number][]).map(([key, val]) => {
          const weight = factorWeights[key]
          const contribution = Math.round(val * weight)

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{factorLabels[key]}</span>
                  <span className="text-[10px] text-gray-600">({Math.round(weight * 100)}% weight)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">+{contribution}</span>
                  <span className={`text-xs font-bold ${getMovementScoreColor(val)}`}>{val}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className={`h-full rounded-full ${getMovementScoreBg(val)}`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Verdict */}
      <div className={`mt-4 p-3 rounded-xl ${
        score >= 61
          ? 'bg-green-500/10 border border-green-500/20'
          : score >= 31
            ? 'bg-amber-500/10 border border-amber-500/20'
            : 'bg-red-500/10 border border-red-500/20'
      }`}>
        <p className={`text-xs font-semibold ${scoreColor}`}>
          {score >= 80
            ? 'HIGHLY MOTIVATED — Contact immediately'
            : score >= 61
              ? 'LIKELY TO MOVE — Nurture sequence recommended'
              : score >= 31
                ? 'WATCHING — Monitor for changes'
                : 'LOW PROBABILITY — Keep on radar'
          }
        </p>
      </div>
    </div>
  )
}
