'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const BENEFITS = ['No credit card', '14-day full access', 'Cancel anytime']

const AGENT_TAGS = ['ARIA', 'DEVX', 'TERRA', 'CAPITA', 'NOVA', 'TON']
const AGENT_COLORS = [
  'text-purple-400 border-purple-500/40 bg-purple-500/10',
  'text-amber-400 border-amber-500/40 bg-amber-500/10',
  'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  'text-red-400 border-red-500/40 bg-red-500/10',
  'text-blue-400 border-blue-500/40 bg-blue-500/10',
  'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
]

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'initial' | 'email-sent'>('initial')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(email)) {
      setError('Please enter a valid work email address.')
      return
    }
    setError('')
    setLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    setStep('email-sent')
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setGoogleLoading(false)
    // In production: redirect to OAuth
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Ambient glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md px-4">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)', color: '#fff' }}>
                W
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 animate-pulse"
                style={{ borderColor: 'var(--bg-primary)' }} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight"
              style={{ background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WellOff
            </span>
          </Link>
          {/* Agent tags */}
          <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
            {AGENT_TAGS.map((tag, i) => (
              <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${AGENT_COLORS[i]} tracking-widest`}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border p-8"
          style={{
            background: 'rgba(13,21,38,0.85)',
            backdropFilter: 'blur(24px)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 0 60px rgba(0,212,255,0.06), 0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <AnimatePresence mode="wait">
            {step === 'initial' ? (
              <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Heading */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-extrabold text-white mb-1">Start your free trial</h1>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    No credit card required.{' '}
                    <span className="text-cyan-400 font-semibold">Full access for 14 days.</span>
                  </p>
                </div>

                {/* Google Button */}
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 font-semibold text-sm transition-all duration-200 mb-4 relative overflow-hidden group"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f1f5f9',
                  }}
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                  {googleLoading ? (
                    <LoadingSpinner color="#94a3b8" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="relative">
                    {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                  </span>
                </button>

                <p className="text-[11px] text-center mb-4" style={{ color: '#475569' }}>
                  Fastest way in — no password needed
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs font-medium" style={{ color: '#475569' }}>Or continue with email</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} noValidate>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@yourbrokerage.com"
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 mb-1"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                      color: '#f1f5f9',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#00d4ff'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.1)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 mb-2 mt-1"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-bold text-sm mt-3 transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: email && !loading
                        ? 'linear-gradient(135deg, #00d4ff, #0ea5e9)'
                        : 'rgba(0,212,255,0.2)',
                      color: email && !loading ? '#080d1a' : 'rgba(0,212,255,0.4)',
                      cursor: !email || loading ? 'not-allowed' : 'pointer',
                      boxShadow: email && !loading ? '0 0 20px rgba(0,212,255,0.3)' : 'none',
                    }}
                  >
                    {loading ? <LoadingSpinner color="#0ea5e9" /> : null}
                    {loading ? 'Sending magic link…' : 'Continue with Email'}
                  </button>
                </form>

                {/* Benefits */}
                <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
                  {BENEFITS.map(b => (
                    <div key={b} className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span className="text-[11px] font-medium" style={{ color: '#64748b' }}>{b}</span>
                    </div>
                  ))}
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(0,212,255,0.3)' }}>
                    <MailIcon />
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">Check your inbox</h2>
                <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>
                  We sent a magic link to
                </p>
                <p className="text-sm font-semibold text-cyan-400 mb-5">{email}</p>
                <p className="text-xs" style={{ color: '#475569' }}>
                  Click the link in the email to activate your free trial. No password needed.
                </p>
                <button
                  onClick={() => { setStep('initial'); setEmail('') }}
                  className="mt-6 text-xs font-semibold transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00d4ff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  ← Use a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs mt-6"
          style={{ color: '#334155' }}
        >
          Already have an account?{' '}
          <Link href="/" className="font-semibold transition-colors"
            style={{ color: '#00d4ff' }}
          >
            Sign in
          </Link>
          {' · '}
          <Link href="/" className="transition-colors hover:text-slate-400" style={{ color: '#334155' }}>
            Privacy
          </Link>
          {' · '}
          <Link href="/" className="transition-colors hover:text-slate-400" style={{ color: '#334155' }}>
            Terms
          </Link>
        </motion.p>
      </div>
    </div>
  )
}

/* ── Small SVG / icon helpers ── */

function LoadingSpinner({ color }: { color: string }) {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6.5" fill="rgba(16,185,129,0.15)" />
      <path d="M4 6.5l1.8 1.8L9 4.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.705A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.963L3.964 7.295C4.672 5.169 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
