'use client'

import { useState } from 'react'
import { Plus, FolderOpen, Trash2, MessageCircle } from 'lucide-react'
import { NeuralProject } from '@/lib/neural-link/types'
import { getPersona } from '@/lib/neural-link/personas'

interface ProjectVaultProps {
  projects: NeuralProject[]
  activeProjectId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onDelete: (id: string) => void
}

export default function ProjectVault({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
  onDelete,
}: ProjectVaultProps) {
  const [newName, setNewName] = useState('')

  const submit = () => {
    if (!newName.trim()) return
    onCreate(newName)
    setNewName('')
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen size={14} className="text-cyan-400" />
        <h3 className="text-xs font-bold text-white tracking-wider uppercase">Project Vault</h3>
        <span className="ml-auto text-[10px] font-mono text-gray-500">
          {projects.length} saved
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="New project name..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40"
        />
        <button
          onClick={submit}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
          aria-label="Create project"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 min-h-0">
        {projects.length === 0 && (
          <div className="text-center py-8 text-[11px] text-gray-600 font-mono">
            No projects yet.<br />Initiate one above.
          </div>
        )}
        {projects.map((project) => {
          const persona = getPersona(project.personaId)
          const active = project.id === activeProjectId
          const lastMsg = project.messages[project.messages.length - 1]
          return (
            <div
              key={project.id}
              onClick={() => onSelect(project.id)}
              className={`group relative p-2.5 rounded-lg border cursor-pointer transition-all ${
                active
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: persona.color }}
                />
                <span className="text-xs font-semibold text-gray-200 truncate flex-1">
                  {project.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                      onDelete(project.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                  aria-label="Delete project"
                >
                  <Trash2 size={11} className="text-red-400" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                <MessageCircle size={9} />
                <span>{project.messages.length} msgs</span>
                <span>·</span>
                <span style={{ color: persona.color }}>{persona.name}</span>
              </div>
              {lastMsg && (
                <div className="text-[10px] text-gray-500 truncate mt-1 italic">
                  {lastMsg.content.slice(0, 80)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
