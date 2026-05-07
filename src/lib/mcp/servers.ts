import { AgentId } from '@/types'

// ─── MCP Protocol Types (aligned with MCP spec) ────────────────────────────

export interface JSONSchema {
  type: string
  properties?: Record<string, JSONSchemaProperty>
  required?: string[]
  items?: JSONSchema
  enum?: string[]
  description?: string
}

export interface JSONSchemaProperty {
  type: string
  description?: string
  enum?: string[]
  minimum?: number
  maximum?: number
  items?: JSONSchema
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: JSONSchema
  agentId: AgentId
}

export interface MCPResource {
  uri: string
  name: string
  description: string
  mimeType: string
}

export interface MCPPrompt {
  name: string
  description: string
  arguments: { name: string; description: string; required: boolean }[]
}

export interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  transport: 'stdio' | 'sse' | 'http'
  endpoint?: string
  color: string
  agentId: AgentId
  tools: MCPTool[]
  resources: MCPResource[]
  prompts: MCPPrompt[]
  status: 'connected' | 'connecting' | 'error'
  callsToday: number
  avgLatencyMs: number
}

export interface ToolCall {
  id: string
  serverId: string
  toolName: string
  agentId: AgentId
  params: Record<string, unknown>
  result: Record<string, unknown>
  latencyMs: number
  timestamp: Date
  status: 'success' | 'error' | 'pending'
}

// ─── MCP Servers ────────────────────────────────────────────────────────────

export const MCP_SERVERS: MCPServer[] = [
  // ── 1. Lead Intelligence ──────────────────────────────────────────────────
  {
    id: 'welloff-leads',
    name: 'welloff-leads',
    description: 'AI lead generation and enrichment — TonRadar signal scanning, lead scoring, and automated follow-up orchestration',
    version: '1.4.2',
    transport: 'sse',
    endpoint: 'https://mcp.welloff.ai/leads/sse',
    color: '#8b5cf6',
    agentId: 'ARIA',
    status: 'connected',
    callsToday: 1847,
    avgLatencyMs: 312,
    tools: [
      {
        name: 'search_leads',
        description: 'Search and filter leads by signal type, confidence score, zip code, enrichment status, and agent assignment',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          properties: {
            signalType: {
              type: 'string',
              enum: ['FSBO Detected', 'Pre-foreclosure Alert', 'Relocation Signal', 'Divorce Record', 'Estate Sale', 'Tax Delinquent', 'Vacant Property', 'New Development Permit', 'Zoning Change', 'CAP Rate Opportunity'],
              description: 'Filter by signal type',
            },
            minConfidence: { type: 'number', minimum: 0, maximum: 100, description: 'Minimum confidence score (0-100)' },
            zipCode: { type: 'string', description: '5-digit US zip code to filter by location' },
            enrichmentStatus: { type: 'string', enum: ['pending', 'enriched', 'contacted'], description: 'Lead enrichment status' },
            limit: { type: 'number', minimum: 1, maximum: 100, description: 'Max results to return (default: 20)' },
          },
        },
      },
      {
        name: 'enrich_lead',
        description: 'Auto-enrich a lead with public records, social profiles, property data, and financial signals',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          required: ['leadId'],
          properties: {
            leadId: { type: 'string', description: 'Lead ID to enrich' },
            sources: {
              type: 'array',
              items: { type: 'string', enum: ['public_records', 'social', 'mls', 'county', 'probate'] },
              description: 'Data sources to pull from (default: all)',
            },
          },
        },
      },
      {
        name: 'run_signal_scan',
        description: 'Trigger a TonRadar signal scan across specified data sources for a geographic area',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          required: ['zipCodes'],
          properties: {
            zipCodes: { type: 'array', items: { type: 'string' }, description: 'List of zip codes to scan' },
            sources: { type: 'array', items: { type: 'string' }, description: 'Data sources to scan' },
            signalTypes: { type: 'array', items: { type: 'string' }, description: 'Signal types to look for' },
          },
        },
      },
      {
        name: 'score_lead',
        description: 'Calculate AI confidence score for a lead based on signal strength, property data, and behavioral signals',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          required: ['leadId'],
          properties: {
            leadId: { type: 'string', description: 'Lead ID to score' },
            recalculate: { type: 'string', enum: ['true', 'false'], description: 'Force recalculation even if score exists' },
          },
        },
      },
      {
        name: 'schedule_followup',
        description: 'Create and schedule an AI-powered multi-step follow-up sequence for a lead',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          required: ['leadId', 'sequenceType'],
          properties: {
            leadId: { type: 'string', description: 'Lead ID' },
            sequenceType: {
              type: 'string',
              enum: ['motivated_seller', 'foreclosure', 'relocation', 'estate', 'investor_outreach'],
              description: 'Sequence template to use',
            },
            steps: { type: 'number', minimum: 1, maximum: 12, description: 'Number of follow-up steps (default: 5)' },
            startDelay: { type: 'string', description: 'Delay before first message (e.g., "now", "1h", "1d")' },
          },
        },
      },
    ],
    resources: [
      { uri: 'leads://all', name: 'All Leads', description: 'Complete lead database with signal data', mimeType: 'application/json' },
      { uri: 'leads://hot', name: 'Hot Leads', description: 'Leads with confidence > 80 and no follow-up', mimeType: 'application/json' },
      { uri: 'leads://today', name: "Today's Leads", description: 'Leads found in the last 24 hours', mimeType: 'application/json' },
      { uri: 'signals://stream', name: 'Signal Stream', description: 'Real-time signal event stream (SSE)', mimeType: 'text/event-stream' },
    ],
    prompts: [
      {
        name: 'draft_outreach',
        description: 'Generate a personalized outreach message for a lead based on their signal type',
        arguments: [
          { name: 'leadId', description: 'Lead to write for', required: true },
          { name: 'channel', description: 'Channel: sms, email, or voicemail', required: true },
          { name: 'tone', description: 'Tone: empathetic, professional, or urgent', required: false },
        ],
      },
      {
        name: 'analyze_lead_signals',
        description: 'Deep analysis of all signals associated with a lead to determine motivation level',
        arguments: [
          { name: 'leadId', description: 'Lead ID to analyze', required: true },
        ],
      },
    ],
  },

  // ── 2. Property Data ──────────────────────────────────────────────────────
  {
    id: 'welloff-property',
    name: 'welloff-property',
    description: 'Property intelligence — valuations, ownership history, tax records, comparables, and movement likelihood scoring',
    version: '2.1.0',
    transport: 'sse',
    endpoint: 'https://mcp.welloff.ai/property/sse',
    color: '#10b981',
    agentId: 'TERRA',
    status: 'connected',
    callsToday: 2341,
    avgLatencyMs: 198,
    tools: [
      {
        name: 'get_property_details',
        description: 'Fetch full property data: valuation, ownership, structure, lot, tax status, and utility signals',
        agentId: 'TERRA',
        inputSchema: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string', description: 'Full property address' },
            includeHistory: { type: 'string', enum: ['true', 'false'], description: 'Include sale and ownership history' },
          },
        },
      },
      {
        name: 'calculate_movement_score',
        description: 'Calculate the seller movement likelihood score (0-100) for a property using weighted AI factors',
        agentId: 'TERRA',
        inputSchema: {
          type: 'object',
          required: ['propertyId'],
          properties: {
            propertyId: { type: 'string', description: 'Property ID' },
            factors: {
              type: 'array',
              items: { type: 'string', enum: ['life_events', 'tax_delinquency', 'vacancy', 'listing_history', 'ownership_duration'] },
              description: 'Factors to include in scoring',
            },
          },
        },
      },
      {
        name: 'get_comparable_sales',
        description: 'Retrieve recent comparable sales (comps) for a property within a radius and time period',
        agentId: 'CAPITA',
        inputSchema: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string', description: 'Subject property address' },
            radiusMiles: { type: 'number', minimum: 0.1, maximum: 10, description: 'Search radius in miles' },
            monthsBack: { type: 'number', minimum: 1, maximum: 36, description: 'How many months of sales history' },
            minSqft: { type: 'number', description: 'Minimum square footage filter' },
            maxSqft: { type: 'number', description: 'Maximum square footage filter' },
          },
        },
      },
      {
        name: 'get_tax_records',
        description: 'Retrieve property tax records, delinquency status, assessed value, and exemptions',
        agentId: 'TERRA',
        inputSchema: {
          type: 'object',
          required: ['propertyId'],
          properties: {
            propertyId: { type: 'string', description: 'Property ID' },
            years: { type: 'number', minimum: 1, maximum: 10, description: 'Years of tax history to retrieve' },
          },
        },
      },
      {
        name: 'search_properties',
        description: 'Search properties in a territory by status, value range, movement score, and owner characteristics',
        agentId: 'TERRA',
        inputSchema: {
          type: 'object',
          properties: {
            zipCode: { type: 'string', description: 'Zip code to search in' },
            minValue: { type: 'number', description: 'Minimum estimated value' },
            maxValue: { type: 'number', description: 'Maximum estimated value' },
            minMovementScore: { type: 'number', minimum: 0, maximum: 100, description: 'Minimum movement likelihood score' },
            taxDelinquent: { type: 'string', enum: ['true', 'false'], description: 'Filter to tax delinquent only' },
            vacantOnly: { type: 'string', enum: ['true', 'false'], description: 'Filter to vacant properties only' },
            limit: { type: 'number', minimum: 1, maximum: 200, description: 'Max results' },
          },
        },
      },
    ],
    resources: [
      { uri: 'properties://all', name: 'All Properties', description: 'Full property database', mimeType: 'application/json' },
      { uri: 'properties://high-movement', name: 'High Movement', description: 'Properties with movement score > 70', mimeType: 'application/json' },
      { uri: 'properties://vacant', name: 'Vacant Properties', description: 'Properties with vacancy signals', mimeType: 'application/json' },
      { uri: 'properties://tax-delinquent', name: 'Tax Delinquent', description: 'Properties with delinquent tax records', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'generate_comp_report',
        description: 'Generate a full comparative market analysis report for a property',
        arguments: [
          { name: 'propertyId', description: 'Subject property ID', required: true },
          { name: 'format', description: 'Output format: pdf, markdown, or json', required: false },
        ],
      },
      {
        name: 'explain_movement_score',
        description: 'Generate a plain-language explanation of a property\'s movement likelihood score and factors',
        arguments: [
          { name: 'propertyId', description: 'Property ID', required: true },
        ],
      },
    ],
  },

  // ── 3. Communications ─────────────────────────────────────────────────────
  {
    id: 'welloff-comms',
    name: 'welloff-comms',
    description: 'AI-powered communications — SMS, email, document generation, and follow-up sequence management',
    version: '1.8.5',
    transport: 'sse',
    endpoint: 'https://mcp.welloff.ai/comms/sse',
    color: '#00d4ff',
    agentId: 'TON',
    status: 'connected',
    callsToday: 3102,
    avgLatencyMs: 445,
    tools: [
      {
        name: 'send_sms',
        description: 'Send an SMS message to a contact, with optional AI draft generation',
        agentId: 'TON',
        inputSchema: {
          type: 'object',
          required: ['contactId', 'message'],
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            message: { type: 'string', description: 'Message body (max 1600 chars)' },
            scheduledAt: { type: 'string', description: 'ISO 8601 datetime to send (omit to send now)' },
          },
        },
      },
      {
        name: 'generate_document',
        description: 'Generate a real estate document from a template with AI-filled fields',
        agentId: 'TON',
        inputSchema: {
          type: 'object',
          required: ['documentType'],
          properties: {
            documentType: {
              type: 'string',
              enum: ['offer_letter', 'loi', 'nda', 'lease', 'comp_report', 'purchase_contract', 'assignment_agreement', 'subject_to_agreement'],
              description: 'Type of document to generate',
            },
            propertyId: { type: 'string', description: 'Property the document relates to' },
            contactId: { type: 'string', description: 'Contact (buyer/seller) for the document' },
            offerAmount: { type: 'number', description: 'Offer price for offer letters and purchase contracts' },
            customFields: { type: 'object', description: 'Additional custom fields to inject', properties: {} },
          },
        },
      },
      {
        name: 'draft_sms',
        description: 'Generate an AI-drafted SMS message personalized to a contact and their signal type',
        agentId: 'TON',
        inputSchema: {
          type: 'object',
          required: ['contactId'],
          properties: {
            contactId: { type: 'string', description: 'Contact to draft for' },
            objective: {
              type: 'string',
              enum: ['initial_outreach', 'follow_up', 'offer_presentation', 'appointment_booking', 'value_add'],
              description: 'Goal of the message',
            },
            tone: { type: 'string', enum: ['empathetic', 'professional', 'urgent', 'friendly'], description: 'Message tone' },
          },
        },
      },
      {
        name: 'get_conversation_history',
        description: 'Retrieve the full SMS conversation thread with a contact',
        agentId: 'TON',
        inputSchema: {
          type: 'object',
          required: ['contactId'],
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            limit: { type: 'number', minimum: 1, maximum: 200, description: 'Max messages to return' },
          },
        },
      },
    ],
    resources: [
      { uri: 'contacts://all', name: 'All Contacts', description: 'Full CRM contact list with AI scores', mimeType: 'application/json' },
      { uri: 'contacts://hot', name: 'Hot Contacts', description: 'Contacts with AI score > 80', mimeType: 'application/json' },
      { uri: 'messages://unread', name: 'Unread Messages', description: 'Unread inbound messages', mimeType: 'application/json' },
      { uri: 'documents://templates', name: 'Doc Templates', description: 'Available document templates', mimeType: 'application/json' },
      { uri: 'sequences://active', name: 'Active Sequences', description: 'Running follow-up sequences', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'create_followup_sequence',
        description: 'Design a complete multi-step outreach sequence tailored to a lead\'s signal type and situation',
        arguments: [
          { name: 'contactId', description: 'Contact to build sequence for', required: true },
          { name: 'signalType', description: 'Signal type detected for this lead', required: true },
          { name: 'steps', description: 'Number of sequence steps', required: false },
        ],
      },
      {
        name: 'respond_to_inquiry',
        description: 'Generate the best AI response to an inbound message based on conversation context',
        arguments: [
          { name: 'messageId', description: 'Inbound message ID to respond to', required: true },
          { name: 'responseStyle', description: 'How to respond: answer, qualify, or schedule', required: false },
        ],
      },
    ],
  },

  // ── 4. Territory Intelligence ─────────────────────────────────────────────
  {
    id: 'welloff-territory',
    name: 'welloff-territory',
    description: 'Territory intelligence — zip code claiming, competitor analysis, market opportunity scoring, and zoning data',
    version: '1.2.1',
    transport: 'sse',
    endpoint: 'https://mcp.welloff.ai/territory/sse',
    color: '#f59e0b',
    agentId: 'DEVX',
    status: 'connected',
    callsToday: 891,
    avgLatencyMs: 267,
    tools: [
      {
        name: 'claim_territory',
        description: 'Claim a zip code as your exclusive territory and begin automated monitoring',
        agentId: 'TERRA',
        inputSchema: {
          type: 'object',
          required: ['zipCode'],
          properties: {
            zipCode: { type: 'string', description: '5-digit zip code to claim' },
            autoScan: { type: 'string', enum: ['true', 'false'], description: 'Enable automatic signal scanning' },
            scanFrequency: { type: 'string', enum: ['hourly', 'daily', 'weekly'], description: 'Scan frequency if autoScan enabled' },
          },
        },
      },
      {
        name: 'get_territory_intel',
        description: 'Get full intelligence report for a zip code: ownership stats, movement scores, lead density, and competitor activity',
        agentId: 'DEVX',
        inputSchema: {
          type: 'object',
          required: ['zipCode'],
          properties: {
            zipCode: { type: 'string', description: 'Zip code to analyze' },
            includeCompetitors: { type: 'string', enum: ['true', 'false'], description: 'Include competitor territory data' },
          },
        },
      },
      {
        name: 'find_opportunity_zips',
        description: 'Find high-opportunity zip codes matching criteria: high movement, low competition, specific value ranges',
        agentId: 'DEVX',
        inputSchema: {
          type: 'object',
          properties: {
            state: { type: 'string', description: '2-letter state code (e.g., CA, TX)' },
            minOpportunityScore: { type: 'number', minimum: 0, maximum: 100, description: 'Min opportunity score' },
            maxCompetitors: { type: 'number', minimum: 0, maximum: 20, description: 'Max competitor count' },
            minLeadDensity: { type: 'number', description: 'Min leads per month' },
            limit: { type: 'number', minimum: 1, maximum: 50, description: 'Max results' },
          },
        },
      },
      {
        name: 'scan_zoning_changes',
        description: 'Scan for recent zoning changes, variance applications, and development permits in a territory',
        agentId: 'DEVX',
        inputSchema: {
          type: 'object',
          required: ['zipCode'],
          properties: {
            zipCode: { type: 'string', description: 'Zip code to scan' },
            daysBack: { type: 'number', minimum: 1, maximum: 365, description: 'Days of history to scan' },
            changeTypes: { type: 'array', items: { type: 'string' }, description: 'Types of changes to look for' },
          },
        },
      },
    ],
    resources: [
      { uri: 'territories://claimed', name: 'Claimed Territories', description: 'Your claimed zip codes with stats', mimeType: 'application/json' },
      { uri: 'territories://available', name: 'Available Territories', description: 'High-opportunity unclaimed zip codes', mimeType: 'application/json' },
      { uri: 'territories://contested', name: 'Contested Territories', description: 'Zip codes with competitor activity', mimeType: 'application/json' },
      { uri: 'zoning://recent-changes', name: 'Recent Zoning Changes', description: 'Zoning changes in last 30 days', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'territory_expansion_plan',
        description: 'Generate an AI-recommended territory expansion plan based on your current claims and market data',
        arguments: [
          { name: 'budget', description: 'Monthly budget for territory management', required: false },
          { name: 'targetState', description: 'State to expand into', required: false },
        ],
      },
    ],
  },

  // ── 5. Media Studio ───────────────────────────────────────────────────────
  {
    id: 'welloff-media',
    name: 'welloff-media',
    description: 'AI media generation — virtual staging, property videos, social content, flyers, and brand assets',
    version: '3.0.1',
    transport: 'sse',
    endpoint: 'https://mcp.welloff.ai/media/sse',
    color: '#ef4444',
    agentId: 'NOVA',
    status: 'connected',
    callsToday: 412,
    avgLatencyMs: 2840,
    tools: [
      {
        name: 'generate_virtual_staging',
        description: 'Generate AI virtual staging for a property photo in a specified style',
        agentId: 'NOVA',
        inputSchema: {
          type: 'object',
          required: ['imageUrl'],
          properties: {
            imageUrl: { type: 'string', description: 'URL of the source property photo' },
            style: { type: 'string', enum: ['modern', 'luxury', 'minimalist', 'cozy', 'scandinavian', 'industrial'], description: 'Staging style' },
            room: { type: 'string', enum: ['living_room', 'bedroom', 'kitchen', 'bathroom', 'office', 'outdoor'], description: 'Room type' },
          },
        },
      },
      {
        name: 'create_property_video',
        description: 'Generate an AI property video from photos with voiceover script and background music',
        agentId: 'NOVA',
        inputSchema: {
          type: 'object',
          required: ['propertyId', 'template'],
          properties: {
            propertyId: { type: 'string', description: 'Property to create video for' },
            template: { type: 'string', enum: ['walkthrough', 'neighborhood', 'just_listed', 'market_update', 'testimonial', 'investment'], description: 'Video template' },
            voiceover: { type: 'string', enum: ['ai_generated', 'custom_script'], description: 'Voiceover type' },
            customScript: { type: 'string', description: 'Custom script text if voiceover is custom_script' },
            durationSeconds: { type: 'number', minimum: 15, maximum: 120, description: 'Target video duration' },
          },
        },
      },
      {
        name: 'generate_social_content',
        description: 'Generate social media content (post + image) for a property or market update',
        agentId: 'NOVA',
        inputSchema: {
          type: 'object',
          required: ['contentType', 'platform'],
          properties: {
            contentType: { type: 'string', enum: ['just_listed', 'just_sold', 'price_reduction', 'market_update', 'tips', 'testimonial'], description: 'Content type' },
            platform: { type: 'string', enum: ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'], description: 'Target platform' },
            propertyId: { type: 'string', description: 'Property ID (for listing posts)' },
            includeCaption: { type: 'string', enum: ['true', 'false'], description: 'Generate caption text' },
          },
        },
      },
      {
        name: 'create_property_flyer',
        description: 'Generate a print-ready property marketing flyer as a PDF',
        agentId: 'NOVA',
        inputSchema: {
          type: 'object',
          required: ['propertyId'],
          properties: {
            propertyId: { type: 'string', description: 'Property ID' },
            template: { type: 'string', enum: ['modern', 'luxury', 'minimal', 'bold'], description: 'Flyer template' },
            format: { type: 'string', enum: ['letter', 'half_letter', 'postcard'], description: 'Paper format' },
            includeQR: { type: 'string', enum: ['true', 'false'], description: 'Include QR code linking to listing' },
          },
        },
      },
    ],
    resources: [
      { uri: 'media://gallery', name: 'Media Gallery', description: 'All generated media assets', mimeType: 'application/json' },
      { uri: 'media://templates', name: 'Templates', description: 'Available media templates', mimeType: 'application/json' },
      { uri: 'brand://kit', name: 'Brand Kit', description: 'Brand colors, fonts, and logos', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'create_listing_campaign',
        description: 'Generate a complete marketing campaign for a new listing: flyer, social posts, email, and video script',
        arguments: [
          { name: 'propertyId', description: 'Property to market', required: true },
          { name: 'budget', description: 'Marketing budget tier: basic, standard, or premium', required: false },
        ],
      },
    ],
  },
]

// ─── Simulated Tool Call Templates ───────────────────────────────────────────

export const SIMULATED_CALLS: Omit<ToolCall, 'id' | 'timestamp'>[] = [
  {
    serverId: 'welloff-leads',
    toolName: 'search_leads',
    agentId: 'ARIA',
    params: { signalType: 'FSBO Detected', minConfidence: 80, zipCode: '90028' },
    result: { leads: 8, topLead: 'Marcus Thompson', avgConfidence: 87, newSinceLastScan: 3 },
    latencyMs: 289,
    status: 'success',
  },
  {
    serverId: 'welloff-property',
    toolName: 'calculate_movement_score',
    agentId: 'TERRA',
    params: { propertyId: 'prop-7', factors: ['tax_delinquency', 'vacancy', 'ownership_duration'] },
    result: { score: 92, label: 'HIGHLY MOTIVATED', topFactor: 'ownershipDuration', recommendation: 'Contact immediately' },
    latencyMs: 156,
    status: 'success',
  },
  {
    serverId: 'welloff-comms',
    toolName: 'send_sms',
    agentId: 'TON',
    params: { contactId: 'contact-1', message: 'Hi Marcus, I pulled recent comps for your area — values up 4.2%. Would love to share the full report. Available this week?' },
    result: { messageId: 'msg-2841', status: 'delivered', deliveredAt: '2026-03-27T14:32:11Z' },
    latencyMs: 512,
    status: 'success',
  },
  {
    serverId: 'welloff-territory',
    toolName: 'find_opportunity_zips',
    agentId: 'DEVX',
    params: { state: 'GA', minOpportunityScore: 85, maxCompetitors: 2 },
    result: { found: 3, topZip: '31401', topScore: 94, avgMovement: 86 },
    latencyMs: 341,
    status: 'success',
  },
  {
    serverId: 'welloff-leads',
    toolName: 'enrich_lead',
    agentId: 'ARIA',
    params: { leadId: 'lead-004', sources: ['public_records', 'social', 'county'] },
    result: { phone: '(912) 555-0774', email: 'ewhitfield@savannah.net', enriched: true, fieldsAdded: 7 },
    latencyMs: 1240,
    status: 'success',
  },
  {
    serverId: 'welloff-property',
    toolName: 'get_comparable_sales',
    agentId: 'CAPITA',
    params: { address: '4821 Sunset Blvd, LA', radiusMiles: 0.5, monthsBack: 6 },
    result: { compsFound: 7, medianSalePrice: 1310000, avgDaysOnMarket: 18, pricePerSqft: 546 },
    latencyMs: 421,
    status: 'success',
  },
  {
    serverId: 'welloff-media',
    toolName: 'generate_virtual_staging',
    agentId: 'NOVA',
    params: { imageUrl: 'property-photo.jpg', style: 'modern', room: 'living_room' },
    result: { outputUrl: 'staged-result.jpg', processingTime: 2.8, style: 'modern', confidence: 0.94 },
    latencyMs: 2810,
    status: 'success',
  },
  {
    serverId: 'welloff-comms',
    toolName: 'generate_document',
    agentId: 'TON',
    params: { documentType: 'offer_letter', propertyId: 'prop-1', offerAmount: 1180000 },
    result: { documentId: 'doc-7721', pages: 4, status: 'ready', downloadUrl: '/docs/offer-letter-7721.pdf' },
    latencyMs: 891,
    status: 'success',
  },
  {
    serverId: 'welloff-territory',
    toolName: 'scan_zoning_changes',
    agentId: 'DEVX',
    params: { zipCode: '31401', daysBack: 30, changeTypes: ['rezoning', 'variance', 'development_permit'] },
    result: { changesFound: 4, developmentPermits: 2, rezonings: 1, variances: 1 },
    latencyMs: 334,
    status: 'success',
  },
  {
    serverId: 'welloff-leads',
    toolName: 'schedule_followup',
    agentId: 'ARIA',
    params: { leadId: 'lead-002', sequenceType: 'foreclosure', steps: 5, startDelay: 'now' },
    result: { sequenceId: 'seq-8812', steps: 5, firstMessageAt: '2026-03-27T15:00:00Z', channel: 'sms' },
    latencyMs: 203,
    status: 'success',
  },
  {
    serverId: 'welloff-kimi',
    toolName: 'kimi_chat',
    agentId: 'ARIA',
    params: { model: 'kimi-k2', prompt: 'Draft a personalized outreach email for a distressed-property lead in zip 90028', temperature: 0.7 },
    result: { reply: 'Subject: Your Sunset Blvd Property — Let\'s Talk\n\nHi [Owner], I noticed your property at...', tokensUsed: 312 },
    latencyMs: 1380,
    status: 'success',
  },
]

export function getTotalTools(): number {
  return MCP_SERVERS.reduce((acc, s) => acc + s.tools.length, 0)
}

export function getTotalResources(): number {
  return MCP_SERVERS.reduce((acc, s) => acc + s.resources.length, 0)
}

export function getTotalCallsToday(): number {
  return MCP_SERVERS.reduce((acc, s) => acc + s.callsToday, 0)
}
