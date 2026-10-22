export type UserRole = 'agent' | 'developer' | 'land-dev' | 'commercial' | 'non-commercial'

export type AgentId = 'ARIA' | 'DEVX' | 'TERRA' | 'CAPITA' | 'NOVA' | 'TON'

export type AgentStatus = 'active' | 'thinking' | 'idle' | 'error'

export interface Agent {
  id: AgentId
  name: string
  role: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  assignedTo: UserRole[]
  status: AgentStatus
  currentTask: string
  tasks: string[]
}

export type SignalType =
  | 'FSBO Detected'
  | 'Pre-foreclosure Alert'
  | 'Relocation Signal'
  | 'Divorce Record'
  | 'Estate Sale'
  | 'Tax Delinquent'
  | 'Vacant Property'
  | 'New Development Permit'
  | 'Zoning Change'
  | 'CAP Rate Opportunity'

export type SignalSource =
  | 'Twitter/X'
  | 'LinkedIn'
  | 'Reddit'
  | 'Public Records'
  | 'MLS'
  | 'News'
  | 'County Records'
  | 'Probate Records'
  | 'Municipal Records'
  | 'Market Analysis'

export interface Lead {
  id: string
  name: string
  signalType: SignalType
  signalSource: SignalSource
  confidence: number
  propertyInterest: string
  propertyAddress: string
  estimatedValue: number
  lastActivity: string
  enrichmentStatus: 'pending' | 'enriched' | 'contacted'
  phone?: string
  email?: string
  followUpQueued: boolean
  timestamp: Date
  agentAssigned: AgentId
}

export interface Contact {
  id: string
  name: string
  phone: string
  email: string
  type: 'lead' | 'client' | 'prospect'
  aiScore: number
  lastContact: string
  tags: string[]
  propertyInterest?: string
  notes?: string
}

export interface Message {
  id: string
  contactId: string
  contactName: string
  content: string
  direction: 'inbound' | 'outbound'
  timestamp: Date
  aiDraft?: string
  status: 'sent' | 'delivered' | 'read' | 'pending'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentId?: AgentId
  isTyping?: boolean
}

export interface Property {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  owner: string
  estimatedValue: number
  yearBuilt: number
  squareFeet: number
  bedrooms: number
  bathrooms: number
  lotSize: number
  timeOwned: number
  movementScore: number
  movementFactors: MovementFactors
  status: 'owned' | 'listed' | 'sold' | 'vacant'
  lastSalePrice?: number
  taxDelinquent: boolean
  vacancySignal: boolean
}

export interface MovementFactors {
  lifeEvents: number
  taxDelinquency: number
  vacancySignals: number
  listingHistory: number
  ownershipDuration: number
}

export interface Territory {
  id: string
  zipCode: string
  city: string
  state: string
  ownerCount: number
  avgHomeAge: number
  movementScore: number
  claimedBy?: string
  opportunityScore: number
  properties: number
  medianValue: number
  leadDensity: number
  competitorCount: number
  status: 'claimed' | 'available' | 'contested'
}

export interface MediaItem {
  id: string
  type: 'staging' | 'video' | 'social' | 'flyer' | 'email' | 'logo'
  title: string
  thumbnail: string
  createdAt: Date
  agentId: AgentId
  status: 'generating' | 'complete' | 'draft'
}

export interface ActivityEvent {
  id: string
  agentId: AgentId
  action: string
  target: string
  timestamp: Date
  result?: string
}

export interface DashboardMetrics {
  leadsToday: number
  territoriesClaimed: number
  messagesSent: number
  mediaCreated: number
  signalsScanned: number
  enrichmentRate: number
  followUpRate: number
}
