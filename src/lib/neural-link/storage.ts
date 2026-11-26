import { NeuralProject, NeuralVaultState, NeuralMessage } from './types'
import { DEFAULT_PERSONA, getPersona } from './personas'

const STORAGE_KEY = 'welloff.neural-link.vault.v1'

const isBrowser = () => typeof window !== 'undefined'

function emptyVault(): NeuralVaultState {
  return { activeProjectId: null, projects: [] }
}

export function loadVault(): NeuralVaultState {
  if (!isBrowser()) return emptyVault()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyVault()
    const parsed = JSON.parse(raw) as NeuralVaultState
    if (!parsed || !Array.isArray(parsed.projects)) return emptyVault()
    return parsed
  } catch {
    return emptyVault()
  }
}

export function saveVault(state: NeuralVaultState): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota or serialization error — swallow, persistence is best-effort.
  }
}

export function createProject(name: string): NeuralProject {
  const now = Date.now()
  const persona = getPersona(DEFAULT_PERSONA)
  const greeting: NeuralMessage = {
    id: `msg-${now}-greet`,
    role: 'assistant',
    personaId: DEFAULT_PERSONA,
    content: persona.greeting,
    source: 'voice',
    timestamp: now,
  }
  return {
    id: `proj-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'Untitled Project',
    spec: '',
    material: [],
    personaId: DEFAULT_PERSONA,
    messages: [greeting],
    createdAt: now,
    updatedAt: now,
  }
}

export function upsertProject(state: NeuralVaultState, project: NeuralProject): NeuralVaultState {
  const idx = state.projects.findIndex((p) => p.id === project.id)
  const next = { ...project, updatedAt: Date.now() }
  const projects =
    idx === -1 ? [next, ...state.projects] : state.projects.map((p) => (p.id === next.id ? next : p))
  return { ...state, projects }
}

export function removeProject(state: NeuralVaultState, projectId: string): NeuralVaultState {
  const projects = state.projects.filter((p) => p.id !== projectId)
  const activeProjectId =
    state.activeProjectId === projectId ? projects[0]?.id ?? null : state.activeProjectId
  return { projects, activeProjectId }
}
