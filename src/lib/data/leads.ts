import { Lead, SignalType, SignalSource, AgentId } from '@/types'

const signalTypes: SignalType[] = [
  'FSBO Detected',
  'Pre-foreclosure Alert',
  'Relocation Signal',
  'Divorce Record',
  'Estate Sale',
  'Tax Delinquent',
  'Vacant Property',
  'New Development Permit',
  'Zoning Change',
  'CAP Rate Opportunity',
]

const signalSources: SignalSource[] = [
  'Twitter/X',
  'LinkedIn',
  'Reddit',
  'Public Records',
  'MLS',
  'News',
  'County Records',
  'Probate Records',
  'Municipal Records',
  'Market Analysis',
]

const firstNames = ['James', 'Sarah', 'Michael', 'Linda', 'Robert', 'Patricia', 'William', 'Barbara', 'David', 'Jennifer', 'Richard', 'Maria', 'Joseph', 'Susan', 'Thomas', 'Margaret', 'Charles', 'Dorothy', 'Christopher', 'Lisa']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']

const streets = ['Oak Ave', 'Maple St', 'Cedar Blvd', 'Pine Dr', 'Elm Way', 'Birch Ct', 'Walnut Ln', 'Sycamore Rd', 'Hickory Pl', 'Chestnut Ave']
const cities = ['Los Angeles', 'Miami', 'Dallas', 'Phoenix', 'Chicago', 'Houston', 'Atlanta', 'Denver', 'Seattle', 'Austin']
const agents: AgentId[] = ['ARIA', 'DEVX', 'TERRA', 'CAPITA', 'NOVA', 'TON']

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateLead(index: number): Lead {
  const firstName = randomFrom(firstNames)
  const lastName = randomFrom(lastNames)
  const signalType = randomFrom(signalTypes)
  const source = randomFrom(signalSources)
  const houseNum = randomBetween(100, 9999)
  const street = randomFrom(streets)
  const city = randomFrom(cities)
  const state = 'CA'
  const zip = `9${randomBetween(1000, 9999)}`
  const value = randomBetween(250000, 2500000)
  const minutesAgo = randomBetween(1, 120)
  const lastActivityOptions = [
    `${minutesAgo}m ago`,
    `${randomBetween(1, 24)}h ago`,
    `${randomBetween(1, 7)}d ago`,
  ]
  const enrichStatuses: Lead['enrichmentStatus'][] = ['pending', 'enriched', 'contacted']

  return {
    id: `lead-${index}-${Date.now()}`,
    name: `${firstName} ${lastName}`,
    signalType,
    signalSource: source,
    confidence: randomBetween(62, 98),
    propertyInterest: `${houseNum} ${street}, ${city}, ${state} ${zip}`,
    propertyAddress: `${houseNum} ${street}, ${city}, ${state} ${zip}`,
    estimatedValue: value,
    lastActivity: randomFrom(lastActivityOptions),
    enrichmentStatus: randomFrom(enrichStatuses),
    phone: `(${randomBetween(200, 999)}) ${randomBetween(200, 999)}-${randomBetween(1000, 9999)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    followUpQueued: Math.random() > 0.5,
    timestamp: new Date(Date.now() - randomBetween(0, 7200000)),
    agentAssigned: randomFrom(agents),
  }
}

export const initialLeads: Lead[] = Array.from({ length: 12 }, (_, i) => generateLead(i))

export function generateNewLead(): Lead {
  return generateLead(Date.now())
}

export const signalTypeColors: Record<SignalType, string> = {
  'FSBO Detected': 'text-accent-purple bg-purple-500/10 border-purple-500/30',
  'Pre-foreclosure Alert': 'text-accent-red bg-red-500/10 border-red-500/30',
  'Relocation Signal': 'text-accent-blue bg-blue-500/10 border-blue-500/30',
  'Divorce Record': 'text-accent-amber bg-amber-500/10 border-amber-500/30',
  'Estate Sale': 'text-accent-cyan bg-cyan-500/10 border-cyan-500/30',
  'Tax Delinquent': 'text-accent-red bg-red-500/10 border-red-500/30',
  'Vacant Property': 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  'New Development Permit': 'text-accent-amber bg-amber-500/10 border-amber-500/30',
  'Zoning Change': 'text-accent-green bg-green-500/10 border-green-500/30',
  'CAP Rate Opportunity': 'text-accent-cyan bg-cyan-500/10 border-cyan-500/30',
}

export const signalSourceIcons: Record<string, string> = {
  'Twitter/X': '🐦',
  'LinkedIn': '💼',
  'Reddit': '📱',
  'Public Records': '📋',
  'MLS': '🏠',
  'News': '📰',
  'County Records': '🏛️',
  'Probate Records': '⚖️',
  'Municipal Records': '🏗️',
  'Market Analysis': '📊',
}
