export type PersonaId = 'NOVA' | 'SAGE' | 'SPARK' | 'CYBER'

export type LinkStatus = 'offline' | 'connecting' | 'active' | 'error'

export type AudioActivity = 'idle' | 'listening' | 'speaking'

export interface Persona {
  id: PersonaId
  name: string
  title: string
  color: string
  voice: string
  tagline: string
  systemPrompt: string
  greeting: string
}

export interface NeuralMessage {
  id: string
  role: 'user' | 'assistant'
  personaId: PersonaId
  content: string
  source: 'text' | 'voice'
  timestamp: number
}

export interface MaterialProperty {
  key: string
  value: string
}

export interface NeuralProject {
  id: string
  name: string
  spec: string
  material: MaterialProperty[]
  personaId: PersonaId
  messages: NeuralMessage[]
  createdAt: number
  updatedAt: number
}

export interface NeuralVaultState {
  activeProjectId: string | null
  projects: NeuralProject[]
}
