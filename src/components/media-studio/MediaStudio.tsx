'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2, Image, Video, PenTool, Palette,
  Play, Upload, Sparkles, Check, Download,
  Instagram, Mail, FileText, Star
} from 'lucide-react'
import AgentBot, { AGENTS } from '@/components/agents/AgentBot'

const ariaAgent = AGENTS.find(a => a.id === 'ARIA')!

const videoTemplates = [
  'Property Walkthrough',
  'Neighborhood Highlights',
  'Just Listed Announcement',
  'Market Update',
  'Client Testimonial',
  'Investment Analysis',
]

const aiScripts: Record<string, string> = {
  'Property Walkthrough': "Welcome to this stunning 4-bedroom home at 4821 Sunset Blvd. Step inside to discover an open-concept living space bathed in natural light, a chef's kitchen with marble countertops, and a master suite with breathtaking city views. The backyard oasis features a heated pool and entertainment area perfect for California living. Priced at $1.25M — this won't last. Call today.",
  'Neighborhood Highlights': "Welcome to the heart of Hollywood Hills, where world-class dining, entertainment, and culture are just minutes from your front door. This iconic neighborhood blends old Hollywood glamour with modern luxury living. Walk scores in the 90s, top-rated schools, and some of LA's most spectacular views — this is where you want to be.",
  'Just Listed Announcement': "JUST LISTED! 4821 Sunset Blvd, Los Angeles. 4 beds, 3 baths. 2,400 sqft. Listed at $1,250,000. Rare opportunity in one of LA's most sought-after neighborhoods. Open house this Sunday 1-4pm. DM me or visit WellOffRealty.com to schedule a private showing.",
  'Market Update': "The Hollywood Hills market is HOT right now. Average days on market dropped to 18 this month — down from 31 last quarter. Median price per square foot up 4.2%. If you've been thinking about selling, NOW is the moment. I have 12 pre-qualified buyers actively looking in 90028. Call me today.",
  'Client Testimonial': "Working with WellOff was the best decision we made. They had our home under contract in just 9 days — $80K above asking. Their AI-powered marketing reached buyers we never could have found through traditional methods. The whole process was seamless. We're recommending them to everyone.",
  'Investment Analysis': "This 8-unit multifamily in Houston presents a compelling investment case. Current gross rents: $12,400/month. Cap rate: 6.8%. Cash-on-cash return with 25% down: 11.2%. Rents are 15% below market, giving you immediate upside opportunity. With the industrial corridor expansion, appreciation potential is significant.",
}

const socialTemplates = [
  { type: 'Instagram Post', icon: Instagram, color: '#e1306c', size: '1080x1080' },
  { type: 'Story Template', icon: Instagram, color: '#8b5cf6', size: '1080x1920' },
  { type: 'Email Campaign', icon: Mail, color: '#00d4ff', size: 'Full width' },
  { type: 'Property Flyer', icon: FileText, color: '#f59e0b', size: '8.5x11"' },
]

const galleryItems = [
  { id: 1, title: 'Sunset Blvd Listing', type: 'Staged Photo', color: '#8b5cf6', date: '2h ago' },
  { id: 2, title: 'Market Update Video', type: 'Property Video', color: '#f59e0b', date: '4h ago' },
  { id: 3, title: 'Just Listed Post', type: 'Social Post', color: '#00d4ff', date: '1d ago' },
  { id: 4, title: 'Q1 Market Report', type: 'Email Campaign', color: '#10b981', date: '1d ago' },
  { id: 5, title: 'Ocean Drive Flyer', type: 'Property Flyer', color: '#ef4444', date: '2d ago' },
  { id: 6, title: 'WellOff Logo V2', type: 'Brand Asset', color: '#3b82f6', date: '3d ago' },
]

function GeneratingBar({ label, duration = 3000 }: { label: string; duration?: number }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(interval)
        setTimeout(() => setDone(true), 200)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [duration])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{label}</span>
        {done
          ? <Check size={11} className="text-accent-green" />
          : <span className="text-[10px] text-accent-cyan font-mono">{Math.round(progress)}%</span>
        }
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          className={`h-full rounded-full ${done ? 'bg-accent-green' : 'bg-accent-cyan'}`}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  )
}

export default function MediaStudio() {
  const [selectedScript, setSelectedScript] = useState('Property Walkthrough')
  const [generatingStaging, setGeneratingStaging] = useState(false)
  const [stagingDone, setStagingDone] = useState(false)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoDone, setVideoDone] = useState(false)
  const [generatingSocial, setGeneratingSocial] = useState<string | null>(null)
  const [socialDone, setSocialDone] = useState<Set<string>>(new Set())

  const handleGenerateStaging = () => {
    setGeneratingStaging(true)
    setTimeout(() => { setGeneratingStaging(false); setStagingDone(true) }, 3500)
  }

  const handleGenerateVideo = () => {
    setGeneratingVideo(true)
    setTimeout(() => { setGeneratingVideo(false); setVideoDone(true) }, 4000)
  }

  const handleGenerateSocial = (type: string) => {
    setGeneratingSocial(type)
    setTimeout(() => {
      setGeneratingSocial(null)
      setSocialDone(prev => { const s = new Set(prev); s.add(type); return s })
    }, 2500)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Wand2 size={18} className="text-accent-amber" />
            </div>
            <h1 className="text-xl font-black text-white">Media Studio</h1>
          </div>
          <p className="text-sm text-gray-500">AI-generated visuals, videos, and marketing content</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left: Agent + Gallery */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <AgentBot agent={ariaAgent} showLog />

          {/* Gallery */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Star size={13} className="text-accent-amber" />
              Recently Generated
            </h3>
            <div className="space-y-2">
              {galleryItems.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}20`, border: `1px solid ${item.color}33` }}>
                    <Sparkles size={11} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-300 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-600">{item.type} · {item.date}</p>
                  </div>
                  <Download size={11} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main 3 sections */}
        <div className="col-span-9 grid grid-cols-3 gap-4 overflow-y-auto custom-scrollbar">
          {/* Virtual Staging */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Image size={13} className="text-accent-purple" />
              </div>
              <h3 className="text-sm font-bold text-white">Virtual Staging</h3>
            </div>

            {/* Upload area */}
            <div className="border-2 border-dashed border-white/10 rounded-xl p-4 mb-3 flex flex-col items-center justify-center min-h-[100px] hover:border-white/20 transition-colors cursor-pointer group">
              <Upload size={20} className="text-gray-600 mb-2 group-hover:text-gray-400 transition-colors" />
              <p className="text-xs text-gray-500 text-center">Drop photo here or click to upload</p>
              <p className="text-[10px] text-gray-600 mt-1">JPG, PNG up to 20MB</p>
            </div>

            {/* Style options */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {['Modern', 'Luxury', 'Minimalist', 'Cozy'].map(style => (
                <button key={style} className="py-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-gray-400 hover:bg-white/[0.05] hover:text-white transition-colors">
                  {style}
                </button>
              ))}
            </div>

            {stagingDone ? (
              <div className="flex-1 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex flex-col items-center justify-center gap-2 min-h-[100px]">
                <Check size={20} className="text-accent-green" />
                <p className="text-xs text-accent-green font-bold">Staging Complete!</p>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs text-gray-300 hover:bg-white/15 transition-colors">
                  <Download size={11} />
                  Download
                </button>
              </div>
            ) : generatingStaging ? (
              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/10 p-3 space-y-2">
                <GeneratingBar label="Analyzing room layout..." duration={1000} />
                <GeneratingBar label="Applying Modern staging..." duration={2000} />
                <GeneratingBar label="Final render..." duration={3200} />
              </div>
            ) : (
              <button
                onClick={handleGenerateStaging}
                className="w-full py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-accent-purple text-sm font-bold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                Generate Staging
              </button>
            )}
          </div>

          {/* Property Video Creator */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Video size={13} className="text-accent-amber" />
              </div>
              <h3 className="text-sm font-bold text-white">Property Video</h3>
            </div>

            {/* Template selector */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Template</p>
              <div className="space-y-1">
                {videoTemplates.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedScript(t)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                      selectedScript === t
                        ? 'bg-amber-500/20 border border-amber-500/30 text-accent-amber'
                        : 'bg-white/[0.02] border border-white/5 text-gray-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Script */}
            <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-3 mb-3 overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={10} className="text-accent-amber" />
                <span className="text-[10px] font-bold text-accent-amber uppercase tracking-wider">AI Script</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">{aiScripts[selectedScript]}</p>
            </div>

            {videoDone ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-accent-amber" />
                  <span className="text-xs text-accent-amber font-bold">Video Ready!</span>
                </div>
                <div className="flex gap-1.5">
                  <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <Play size={11} className="text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <Download size={11} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ) : generatingVideo ? (
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3 space-y-2">
                <GeneratingBar label="Compiling scenes..." duration={1200} />
                <GeneratingBar label="Adding voiceover..." duration={2400} />
                <GeneratingBar label="Rendering video..." duration={3800} />
              </div>
            ) : (
              <button
                onClick={handleGenerateVideo}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-accent-amber text-sm font-bold hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Video size={14} />
                Generate Video
              </button>
            )}
          </div>

          {/* Marketing Creatives + Brand Kit combined */}
          <div className="flex flex-col gap-4">
            {/* Marketing Creatives */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <PenTool size={13} className="text-accent-cyan" />
                </div>
                <h3 className="text-sm font-bold text-white">Marketing Creatives</h3>
              </div>

              <div className="space-y-2">
                {socialTemplates.map(template => {
                  const Icon = template.icon
                  const isDone = socialDone.has(template.type)
                  const isGenerating = generatingSocial === template.type

                  return (
                    <div key={template.type} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
                      <Icon size={14} style={{ color: template.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-300">{template.type}</p>
                        <p className="text-[10px] text-gray-600">{template.size}</p>
                        {isGenerating && (
                          <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 2.5 }}
                              className="h-full rounded-full"
                              style={{ background: template.color }}
                            />
                          </div>
                        )}
                      </div>
                      {isDone ? (
                        <div className="flex gap-1">
                          <button className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
                            <Download size={10} className="text-gray-400" />
                          </button>
                          <Check size={14} className="text-accent-green" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateSocial(template.type)}
                          disabled={!!isGenerating}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          style={{
                            background: `${template.color}15`,
                            border: `1px solid ${template.color}33`,
                            color: template.color,
                          }}
                        >
                          {isGenerating ? '...' : 'Create'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Brand Kit */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Palette size={13} className="text-accent-green" />
                </div>
                <h3 className="text-sm font-bold text-white">Brand Kit</h3>
              </div>

              <div className="flex gap-1.5 mb-3">
                {['#00d4ff', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'].map(color => (
                  <div
                    key={color}
                    className="w-7 h-7 rounded-lg cursor-pointer hover:scale-110 transition-transform"
                    style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
                  />
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black text-cyan-400" style={{ background: 'linear-gradient(135deg, #00d4ff22, #8b5cf622)', border: '1px solid #00d4ff33' }}>W</div>
                  <span className="text-xs text-gray-300">WellOff Logo</span>
                  <Download size={10} className="text-gray-600 ml-auto" />
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-gray-500 mb-1">Typography</p>
                  <p className="text-xs text-white font-black">Inter Black</p>
                  <p className="text-[10px] text-gray-500 font-mono">JetBrains Mono</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
