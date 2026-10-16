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
            customFields: { type: 'object', description: 'Additional custom fields to inject' },
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

  // ── 6. NEXUS — Technology Sector ─────────────────────────────────────────
  {
    id: 'welloff-nexus',
    name: 'welloff-nexus',
    description: 'Technology sector intelligence — funding round tracking, SaaS metrics, acquisition target screening, and talent signal monitoring',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://mcp.welloff.ai/nexus/http',
    color: '#6366f1',
    agentId: 'NEXUS',
    status: 'connected',
    callsToday: 634,
    avgLatencyMs: 287,
    tools: [
      {
        name: 'scan_tech_funding',
        description: 'Scan for funding rounds by stage, sector, and geography',
        agentId: 'NEXUS',
        inputSchema: {
          type: 'object',
          properties: {
            stage: { type: 'string', enum: ['seed', 'series_a', 'series_b', 'series_c', 'growth', 'ipo'], description: 'Funding stage to filter by' },
            sector: { type: 'string', description: 'Technology sector (e.g., AI, SaaS, fintech)' },
            geo: { type: 'string', description: 'Geographic region or country code' },
            daysBack: { type: 'number', minimum: 1, maximum: 90, description: 'Days of history to scan' },
          },
        },
      },
      {
        name: 'track_saas_metrics',
        description: 'Retrieve ARR, churn rate, and NRR for a target company',
        agentId: 'NEXUS',
        inputSchema: {
          type: 'object',
          required: ['company'],
          properties: {
            company: { type: 'string', description: 'Company name or domain' },
            metrics: { type: 'array', items: { type: 'string', enum: ['arr', 'churn', 'nrr', 'cac', 'ltv'] }, description: 'Metrics to retrieve' },
          },
        },
      },
      {
        name: 'find_acquisition_targets',
        description: 'Screen for acquisition targets by revenue, sector, and geography',
        agentId: 'NEXUS',
        inputSchema: {
          type: 'object',
          properties: {
            minRevenue: { type: 'number', description: 'Minimum ARR in USD' },
            maxRevenue: { type: 'number', description: 'Maximum ARR in USD' },
            sector: { type: 'string', description: 'Target sector' },
            geography: { type: 'string', description: 'Target geography' },
            limit: { type: 'number', minimum: 1, maximum: 50, description: 'Max results' },
          },
        },
      },
      {
        name: 'monitor_talent_signals',
        description: 'Detect layoff announcements and hiring surges at target companies',
        agentId: 'NEXUS',
        inputSchema: {
          type: 'object',
          required: ['companies'],
          properties: {
            companies: { type: 'array', items: { type: 'string' }, description: 'List of company names to monitor' },
            signalType: { type: 'string', enum: ['layoffs', 'hiring_surge', 'executive_departure', 'all'], description: 'Signal type to detect' },
          },
        },
      },
      {
        name: 'analyze_tech_stack',
        description: 'Identify the technology stack used by a target company',
        agentId: 'NEXUS',
        inputSchema: {
          type: 'object',
          required: ['company'],
          properties: {
            company: { type: 'string', description: 'Company name or domain' },
            categories: { type: 'array', items: { type: 'string' }, description: 'Tech categories to identify (e.g., crm, analytics, infra)' },
          },
        },
      },
    ],
    resources: [
      { uri: 'nexus://funding-rounds', name: 'Funding Rounds', description: 'Recent funding events filtered by stage and sector', mimeType: 'application/json' },
      { uri: 'nexus://watchlist', name: 'Company Watchlist', description: 'Tracked companies with latest signals', mimeType: 'application/json' },
      { uri: 'nexus://acquisition-targets', name: 'Acquisition Targets', description: 'Screened M&A candidates', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'sector_intelligence_brief',
        description: 'Generate a weekly tech sector intelligence brief with funding, M&A, and talent highlights',
        arguments: [
          { name: 'sectors', description: 'Sectors to cover (comma-separated)', required: true },
          { name: 'format', description: 'Output format: markdown or json', required: false },
        ],
      },
      {
        name: 'competitive_landscape',
        description: 'Produce a competitive landscape analysis for a given product category',
        arguments: [
          { name: 'category', description: 'Product category or market', required: true },
        ],
      },
    ],
  },

  // ── 7. FORGE — AI Robotics Engineer ───────────────────────────────────────
  {
    id: 'welloff-forge',
    name: 'welloff-forge',
    description: 'Robotics fleet management — ROS2 simulation, predictive maintenance, sensor data processing, and path planning optimization',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://mcp.welloff.ai/forge/http',
    color: '#f97316',
    agentId: 'FORGE',
    status: 'connected',
    callsToday: 481,
    avgLatencyMs: 512,
    tools: [
      {
        name: 'get_robot_fleet_status',
        description: 'Retrieve fleet health metrics across all sites or a specific site',
        agentId: 'FORGE',
        inputSchema: {
          type: 'object',
          properties: {
            siteId: { type: 'string', description: 'Site ID to query (omit for all sites)' },
            includeOffline: { type: 'string', enum: ['true', 'false'], description: 'Include offline units in response' },
          },
        },
      },
      {
        name: 'schedule_maintenance',
        description: 'Create a predictive maintenance schedule for a specific robot unit',
        agentId: 'FORGE',
        inputSchema: {
          type: 'object',
          required: ['unitId'],
          properties: {
            unitId: { type: 'string', description: 'Robot unit identifier (e.g., RB-047)' },
            maintenanceType: { type: 'string', enum: ['predictive', 'preventive', 'corrective'], description: 'Maintenance classification' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Scheduling priority' },
          },
        },
      },
      {
        name: 'run_ros_simulation',
        description: 'Execute a ROS2 navigation simulation with a given map and navigation goal',
        agentId: 'FORGE',
        inputSchema: {
          type: 'object',
          required: ['mapUrl', 'goal'],
          properties: {
            mapUrl: { type: 'string', description: 'URL or path to occupancy grid map (.yaml)' },
            goal: { type: 'string', description: 'Navigation goal as JSON pose {x, y, theta}' },
            robot: { type: 'string', description: 'Robot model URDF identifier' },
            algorithm: { type: 'string', enum: ['nav2', 'move_base', 'custom'], description: 'Navigation stack to use' },
          },
        },
      },
      {
        name: 'analyze_sensor_data',
        description: 'Process a raw LiDAR, camera, or IMU sensor stream and return structured analysis',
        agentId: 'FORGE',
        inputSchema: {
          type: 'object',
          required: ['streamUrl', 'sensorType'],
          properties: {
            streamUrl: { type: 'string', description: 'URL of the sensor data stream or file' },
            sensorType: { type: 'string', enum: ['lidar', 'camera', 'imu', 'depth'], description: 'Sensor type' },
            analysisMode: { type: 'string', enum: ['object_detection', 'mapping', 'localization', 'anomaly'], description: 'Analysis task' },
          },
        },
      },
      {
        name: 'optimize_path_planning',
        description: 'Compute an optimized path for a robot arm or mobile platform using A* or RRT',
        agentId: 'FORGE',
        inputSchema: {
          type: 'object',
          required: ['start', 'goal', 'robotType'],
          properties: {
            start: { type: 'string', description: 'Start pose as JSON {x, y, theta}' },
            goal: { type: 'string', description: 'Goal pose as JSON {x, y, theta}' },
            robotType: { type: 'string', enum: ['arm', 'mobile', 'agv'], description: 'Robot platform type' },
            algorithm: { type: 'string', enum: ['astar', 'rrt', 'rrt_star', 'dijkstra'], description: 'Path planning algorithm' },
          },
        },
      },
    ],
    resources: [
      { uri: 'forge://fleet', name: 'Fleet Status', description: 'Live status of all robot units across sites', mimeType: 'application/json' },
      { uri: 'forge://maintenance-schedule', name: 'Maintenance Schedule', description: 'Upcoming and overdue maintenance events', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'fleet_health_report',
        description: 'Generate a comprehensive fleet health report with maintenance recommendations',
        arguments: [
          { name: 'siteId', description: 'Site to report on (omit for all sites)', required: false },
          { name: 'period', description: 'Reporting period: daily, weekly, or monthly', required: false },
        ],
      },
    ],
  },

  // ── 8. ARCH — AI Civil & Structural Engineer ──────────────────────────────
  {
    id: 'welloff-arch',
    name: 'welloff-arch',
    description: 'Civil and structural engineering intelligence — BIM clash detection, permit tracking, structural load calculations, and project cost estimation',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://mcp.welloff.ai/arch/http',
    color: '#84cc16',
    agentId: 'ARCH',
    status: 'connected',
    callsToday: 357,
    avgLatencyMs: 634,
    tools: [
      {
        name: 'run_bim_clash_detection',
        description: 'Run BIM clash detection on a model for specified floor range',
        agentId: 'ARCH',
        inputSchema: {
          type: 'object',
          required: ['modelUrl'],
          properties: {
            modelUrl: { type: 'string', description: 'URL to the BIM model file (.ifc or .rvt)' },
            floors: { type: 'string', description: 'Floor range to check (e.g., "3-7")' },
            disciplines: { type: 'array', items: { type: 'string', enum: ['structural', 'mep', 'architectural', 'civil'] }, description: 'Disciplines to clash-check' },
          },
        },
      },
      {
        name: 'get_permit_status',
        description: 'Retrieve permit status for a project by ID or address',
        agentId: 'ARCH',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Internal project ID' },
            address: { type: 'string', description: 'Property address (alternative to projectId)' },
            jurisdiction: { type: 'string', description: 'Municipal jurisdiction for the query' },
          },
        },
      },
      {
        name: 'calculate_structural_loads',
        description: 'Calculate dead, live, wind, and seismic loads for a building',
        agentId: 'ARCH',
        inputSchema: {
          type: 'object',
          required: ['buildingType', 'heightFt', 'areaSqft'],
          properties: {
            buildingType: { type: 'string', enum: ['residential', 'commercial', 'industrial', 'mixed_use'], description: 'Building occupancy type' },
            heightFt: { type: 'number', description: 'Building height in feet' },
            areaSqft: { type: 'number', description: 'Floor area in square feet' },
            location: { type: 'string', description: 'City/state or coordinates for site-specific loads' },
            codeVersion: { type: 'string', enum: ['IBC_2021', 'IBC_2018', 'ASCE_7_22'], description: 'Building code version' },
          },
        },
      },
      {
        name: 'check_code_compliance',
        description: 'Validate a drawing set against a jurisdiction\'s building code',
        agentId: 'ARCH',
        inputSchema: {
          type: 'object',
          required: ['jurisdiction', 'drawingSetUrl'],
          properties: {
            jurisdiction: { type: 'string', description: 'Jurisdiction name or code (e.g., LA, NYC)' },
            drawingSetUrl: { type: 'string', description: 'URL to the drawing set PDF or package' },
            checkTypes: { type: 'array', items: { type: 'string', enum: ['fire_egress', 'accessibility', 'structural', 'energy', 'zoning'] }, description: 'Compliance areas to check' },
          },
        },
      },
      {
        name: 'estimate_project_cost',
        description: 'Generate a preliminary cost estimate for a construction project',
        agentId: 'ARCH',
        inputSchema: {
          type: 'object',
          required: ['scope', 'location', 'areaSqft'],
          properties: {
            scope: { type: 'string', enum: ['new_construction', 'renovation', 'addition', 'tenant_improvement'], description: 'Project scope type' },
            location: { type: 'string', description: 'City/state for localized cost data' },
            areaSqft: { type: 'number', description: 'Project area in square feet' },
            constructionType: { type: 'string', enum: ['wood_frame', 'steel', 'concrete', 'masonry'], description: 'Primary construction type' },
          },
        },
      },
    ],
    resources: [
      { uri: 'arch://permits', name: 'Active Permits', description: 'All tracked permits with current status', mimeType: 'application/json' },
      { uri: 'arch://projects', name: 'Project Registry', description: 'Active construction projects with BIM links', mimeType: 'application/json' },
      { uri: 'arch://code-library', name: 'Code Library', description: 'Building code references by jurisdiction', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'structural_review_summary',
        description: 'Summarize structural review findings for a project and flag action items',
        arguments: [
          { name: 'projectId', description: 'Project to summarize', required: true },
          { name: 'audience', description: 'Audience: engineer, architect, or client', required: false },
        ],
      },
      {
        name: 'permit_readiness_checklist',
        description: 'Generate a permit submission readiness checklist for a project',
        arguments: [
          { name: 'projectId', description: 'Project ID', required: true },
          { name: 'jurisdiction', description: 'Target jurisdiction', required: true },
        ],
      },
    ],
  },

  // ── 9. VOLT — AI Mechanical Engineer ─────────────────────────────────────
  {
    id: 'welloff-volt',
    name: 'welloff-volt',
    description: 'Mechanical engineering intelligence — FEA, materials selection, fatigue analysis, geometry optimization, and DFMEA generation',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://mcp.welloff.ai/volt/http',
    color: '#eab308',
    agentId: 'VOLT',
    status: 'connected',
    callsToday: 298,
    avgLatencyMs: 748,
    tools: [
      {
        name: 'run_fea_analysis',
        description: 'Execute a finite element analysis on a part geometry under specified load and material',
        agentId: 'VOLT',
        inputSchema: {
          type: 'object',
          required: ['partUrl', 'material', 'loadN'],
          properties: {
            partUrl: { type: 'string', description: 'URL or path to the part geometry file (.step or .stl)' },
            material: { type: 'string', description: 'Material designation (e.g., 4140 steel, 6061-T6 aluminum)' },
            loadN: { type: 'number', description: 'Applied load in Newtons' },
            loadType: { type: 'string', enum: ['static', 'dynamic', 'thermal', 'fatigue'], description: 'Load case type' },
            meshDensity: { type: 'string', enum: ['coarse', 'medium', 'fine'], description: 'FEA mesh density' },
          },
        },
      },
      {
        name: 'select_material',
        description: 'Recommend optimal materials for an application given temperature, load, and environment',
        agentId: 'VOLT',
        inputSchema: {
          type: 'object',
          required: ['application', 'tempRangeC'],
          properties: {
            application: { type: 'string', description: 'Application description (e.g., pump housing, gear shaft)' },
            tempRangeC: { type: 'string', description: 'Operating temperature range in °C (e.g., "-20 to 380")' },
            loadType: { type: 'string', enum: ['static', 'cyclic', 'impact', 'creep'], description: 'Primary load type' },
            environment: { type: 'string', enum: ['dry', 'corrosive', 'high_humidity', 'vacuum', 'high_radiation'], description: 'Operating environment' },
          },
        },
      },
      {
        name: 'analyze_fatigue_failure',
        description: 'Analyze fatigue failure for a component given cycles and stress ratio',
        agentId: 'VOLT',
        inputSchema: {
          type: 'object',
          required: ['component', 'cycles'],
          properties: {
            component: { type: 'string', description: 'Component name or description' },
            cycles: { type: 'number', description: 'Number of load cycles experienced' },
            stressRatio: { type: 'number', minimum: -1, maximum: 1, description: 'Stress ratio R = σ_min / σ_max' },
            material: { type: 'string', description: 'Material designation' },
          },
        },
      },
      {
        name: 'optimize_geometry',
        description: 'Optimize part geometry for minimum weight, maximum stiffness, or thermal performance',
        agentId: 'VOLT',
        inputSchema: {
          type: 'object',
          required: ['partUrl', 'objective'],
          properties: {
            partUrl: { type: 'string', description: 'URL to base geometry file' },
            objective: { type: 'string', enum: ['weight', 'stiffness', 'thermal'], description: 'Optimization objective' },
            constraints: { type: 'string', description: 'Design constraints as JSON string' },
          },
        },
      },
      {
        name: 'generate_dfmea',
        description: 'Generate a Design Failure Mode and Effects Analysis for an assembly',
        agentId: 'VOLT',
        inputSchema: {
          type: 'object',
          required: ['assemblyName', 'components'],
          properties: {
            assemblyName: { type: 'string', description: 'Name of the assembly' },
            components: { type: 'array', items: { type: 'string' }, description: 'List of component names in the assembly' },
            standard: { type: 'string', enum: ['AIAG_VDA_2019', 'MIL_STD_1629', 'FMEA_4'], description: 'DFMEA standard to follow' },
          },
        },
      },
    ],
    resources: [
      { uri: 'volt://parts-library', name: 'Parts Library', description: 'CAD part library with material and FEA history', mimeType: 'application/json' },
      { uri: 'volt://materials-db', name: 'Materials Database', description: 'Searchable materials properties database', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'design_review_report',
        description: 'Generate a formal design review report summarizing FEA results and material choices',
        arguments: [
          { name: 'projectId', description: 'Engineering project ID', required: true },
          { name: 'stage', description: 'Design stage: concept, preliminary, or final', required: false },
        ],
      },
    ],
  },

  // ── 10. MOTOR — AI Automotive Engineer ───────────────────────────────────
  {
    id: 'welloff-motor',
    name: 'welloff-motor',
    description: 'Automotive engineering platform — fleet telemetry, fault diagnostics, EV battery health, ADAS calibration, and emissions compliance',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://mcp.welloff.ai/motor/http',
    color: '#ec4899',
    agentId: 'MOTOR',
    status: 'connected',
    callsToday: 523,
    avgLatencyMs: 391,
    tools: [
      {
        name: 'get_fleet_telemetry',
        description: 'Retrieve fleet telemetry data for a depot over a date range',
        agentId: 'MOTOR',
        inputSchema: {
          type: 'object',
          required: ['depotId'],
          properties: {
            depotId: { type: 'string', description: 'Depot identifier' },
            dateRange: { type: 'string', description: 'Date range as ISO 8601 interval (e.g., "2026-10-01/2026-10-15")' },
            metrics: { type: 'array', items: { type: 'string', enum: ['speed', 'fuel', 'battery_soh', 'mileage', 'idle_time', 'fault_codes'] }, description: 'Telemetry metrics to include' },
          },
        },
      },
      {
        name: 'diagnose_fault_code',
        description: 'Diagnose a DTC fault code for a specific vehicle',
        agentId: 'MOTOR',
        inputSchema: {
          type: 'object',
          required: ['vehicleId', 'dtcCode'],
          properties: {
            vehicleId: { type: 'string', description: 'Vehicle identifier (e.g., VH-2291)' },
            dtcCode: { type: 'string', description: 'OBD-II DTC code (e.g., P0300)' },
            includeRepairGuide: { type: 'string', enum: ['true', 'false'], description: 'Include step-by-step repair procedure' },
          },
        },
      },
      {
        name: 'analyze_battery_health',
        description: 'Analyze EV battery state of health for a vehicle or entire fleet',
        agentId: 'MOTOR',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string', description: 'Single vehicle ID (mutually exclusive with fleetId)' },
            fleetId: { type: 'string', description: 'Fleet ID for aggregate analysis' },
            alertThreshold: { type: 'number', minimum: 0, maximum: 100, description: 'SoH percent below which to flag vehicles' },
          },
        },
      },
      {
        name: 'check_adas_calibration',
        description: 'Verify ADAS sensor calibration status for one or more vehicles',
        agentId: 'MOTOR',
        inputSchema: {
          type: 'object',
          required: ['vehicleIds'],
          properties: {
            vehicleIds: { type: 'array', items: { type: 'string' }, description: 'List of vehicle IDs to check' },
            systems: { type: 'array', items: { type: 'string', enum: ['camera', 'radar', 'lidar', 'ultrasonic', 'all'] }, description: 'ADAS systems to check' },
          },
        },
      },
      {
        name: 'run_emissions_compliance',
        description: 'Run an emissions compliance check for a fleet against a specified regulation',
        agentId: 'MOTOR',
        inputSchema: {
          type: 'object',
          required: ['regulation', 'fleetId'],
          properties: {
            regulation: { type: 'string', enum: ['euro7', 'carb', 'epa_tier3', 'china_6b'], description: 'Emissions standard to check against' },
            fleetId: { type: 'string', description: 'Fleet ID to run compliance check on' },
            reportFormat: { type: 'string', enum: ['summary', 'detailed', 'csv'], description: 'Output format' },
          },
        },
      },
    ],
    resources: [
      { uri: 'motor://fleet-registry', name: 'Fleet Registry', description: 'All registered vehicles with VIN, make, model, and telemetry link', mimeType: 'application/json' },
      { uri: 'motor://fault-history', name: 'Fault History', description: 'Historical DTC codes and resolution records', mimeType: 'application/json' },
      { uri: 'motor://compliance-reports', name: 'Compliance Reports', description: 'Generated emissions compliance reports', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'fleet_health_digest',
        description: 'Generate a fleet health digest highlighting critical faults, battery degradation, and compliance issues',
        arguments: [
          { name: 'fleetId', description: 'Fleet to summarize', required: true },
          { name: 'period', description: 'Reporting period: daily or weekly', required: false },
        ],
      },
      {
        name: 'ev_charging_optimization',
        description: 'Recommend an optimal overnight charging schedule for an EV fleet at a depot',
        arguments: [
          { name: 'depotId', description: 'Depot ID', required: true },
          { name: 'targetSoC', description: 'Target state of charge percent by morning (default 90)', required: false },
        ],
      },
    ],
  },

  // ── 11. MESH — Computer Networking AI ────────────────────────────────────
  {
    id: 'welloff-mesh',
    name: 'welloff-mesh',
    description: 'Network intelligence — topology mapping, anomaly detection, IaC generation, firewall auditing, and vulnerability scanning',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://mcp.welloff.ai/mesh/http',
    color: '#14b8a6',
    agentId: 'MESH',
    status: 'connected',
    callsToday: 712,
    avgLatencyMs: 223,
    tools: [
      {
        name: 'map_network_topology',
        description: 'Discover and map the network topology for a data center',
        agentId: 'MESH',
        inputSchema: {
          type: 'object',
          required: ['datacenterId'],
          properties: {
            datacenterId: { type: 'string', description: 'Data center identifier' },
            depth: { type: 'number', minimum: 1, maximum: 5, description: 'Discovery depth (hops)' },
            includeCloud: { type: 'string', enum: ['true', 'false'], description: 'Include cloud-attached resources' },
          },
        },
      },
      {
        name: 'detect_traffic_anomalies',
        description: 'Detect anomalous traffic patterns above a threshold on a VLAN',
        agentId: 'MESH',
        inputSchema: {
          type: 'object',
          required: ['thresholdGbps'],
          properties: {
            thresholdGbps: { type: 'number', description: 'Traffic spike threshold in Gbps' },
            vlan: { type: 'number', description: 'VLAN ID to monitor (omit for all VLANs)' },
            lookbackMinutes: { type: 'number', minimum: 5, maximum: 1440, description: 'Minutes of traffic history to analyze' },
          },
        },
      },
      {
        name: 'generate_iac',
        description: 'Generate infrastructure-as-code for a cloud networking resource',
        agentId: 'MESH',
        inputSchema: {
          type: 'object',
          required: ['provider', 'resourceType'],
          properties: {
            provider: { type: 'string', enum: ['terraform', 'pulumi', 'cdk'], description: 'IaC provider to target' },
            resourceType: { type: 'string', description: 'Resource type (e.g., vpc, subnet, security_group, load_balancer)' },
            params: { type: 'string', description: 'Resource parameters as JSON string' },
          },
        },
      },
      {
        name: 'audit_firewall_rules',
        description: 'Audit firewall rules on a device and flag deprecated or overly permissive ACL entries',
        agentId: 'MESH',
        inputSchema: {
          type: 'object',
          required: ['deviceId'],
          properties: {
            deviceId: { type: 'string', description: 'Firewall or router device ID' },
            checkDeprecated: { type: 'string', enum: ['true', 'false'], description: 'Flag deprecated ACL rules' },
            checkOverpermissive: { type: 'string', enum: ['true', 'false'], description: 'Flag overly permissive any-any rules' },
          },
        },
      },
      {
        name: 'scan_vulnerabilities',
        description: 'Scan nodes for known CVE exposures across edge, core, or all infrastructure',
        agentId: 'MESH',
        inputSchema: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['edge', 'core', 'all'], description: 'Infrastructure scope to scan' },
            cveIds: { type: 'array', items: { type: 'string' }, description: 'Specific CVE IDs to check (omit for full scan)' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'all'], description: 'Minimum severity to report' },
          },
        },
      },
    ],
    resources: [
      { uri: 'mesh://topology', name: 'Network Topology', description: 'Current network graph across all data centers', mimeType: 'application/json' },
      { uri: 'mesh://alerts', name: 'Active Alerts', description: 'Open network security and performance alerts', mimeType: 'application/json' },
      { uri: 'mesh://iac-templates', name: 'IaC Templates', description: 'Reusable infrastructure-as-code templates', mimeType: 'application/json' },
    ],
    prompts: [
      {
        name: 'network_security_brief',
        description: 'Generate a network security brief summarizing open vulnerabilities and anomalous traffic',
        arguments: [
          { name: 'datacenterId', description: 'Data center to report on (omit for all)', required: false },
          { name: 'severity', description: 'Minimum severity to include: critical, high, or all', required: false },
        ],
      },
    ],
  },

  // ── 12. Kimi (Moonshot AI) ────────────────────────────────────────────────
  {
    id: 'welloff-kimi',
    name: 'welloff-kimi',
    description: 'Moonshot AI (Kimi) inference backend — OpenAI-compatible chat completions via kimi-k2 and moonshot-v1 models',
    version: '1.0.0',
    transport: 'http',
    endpoint: 'https://api.moonshot.cn/v1',
    color: '#06b6d4',
    agentId: 'ARIA',
    status: 'connected',
    callsToday: 214,        // seeded display value — updated by live simulation in MCPDashboard
    avgLatencyMs: 1340,     // seeded display value — p50 observed during initial testing
    tools: [
      {
        name: 'kimi_chat',
        description: 'Send a chat-completion request to the Kimi (Moonshot AI) API and return the assistant reply',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          required: ['messages'],
          properties: {
            messages: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of chat messages ({role, content})',
            },
            model: {
              type: 'string',
              enum: ['kimi-k2', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
              description: 'Model to use (default: kimi-k2)',
            },
            temperature: { type: 'number', minimum: 0, maximum: 2, description: 'Sampling temperature (default: 0.7)' },
            maxTokens: { type: 'number', minimum: 1, description: 'Maximum tokens to generate' },
          },
        },
      },
      {
        name: 'kimi_smoke_test',
        description: 'Validate the Kimi provider configuration (API key, base URL) without making a live inference call',
        agentId: 'ARIA',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'Model ID to validate against (optional)' },
          },
        },
      },
    ],
    resources: [
      { uri: 'kimi://models', name: 'Kimi Models', description: 'Available Moonshot AI model identifiers', mimeType: 'application/json' },
      { uri: 'kimi://docs', name: 'Kimi API Docs', description: 'OpenAI-compatible API reference for Moonshot AI', mimeType: 'text/html' },
    ],
    prompts: [
      {
        name: 'draft_outreach_email',
        description: 'Draft a personalized outreach email for a real estate lead using the Kimi language model',
        arguments: [
          { name: 'leadId', description: 'Lead to write for', required: true },
          { name: 'tone', description: 'Email tone: professional, friendly, or urgent', required: false },
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
  {
    serverId: 'welloff-nexus',
    toolName: 'scan_tech_funding',
    agentId: 'NEXUS',
    params: { stage: 'series_b', sector: 'AI', geo: 'US', daysBack: 7 },
    result: { roundsFound: 14, topDeal: { company: 'SynthMind AI', amount: 62000000, stage: 'Series B', sector: 'AI/ML' }, avgRoundSize: 41000000 },
    latencyMs: 312,
    status: 'success',
  },
  {
    serverId: 'welloff-forge',
    toolName: 'get_robot_fleet_status',
    agentId: 'FORGE',
    params: { siteId: 'site-03', includeOffline: 'false' },
    result: { totalUnits: 12, online: 11, offline: 1, maintenanceDue: 3, avgBatteryPct: 84, alertUnit: 'RB-047' },
    latencyMs: 198,
    status: 'success',
  },
  {
    serverId: 'welloff-arch',
    toolName: 'run_bim_clash_detection',
    agentId: 'ARCH',
    params: { modelUrl: 'bim://tower-c-v4.ifc', floors: '3-7', disciplines: ['structural', 'mep'] },
    result: { clashesFound: 9, critical: 2, minor: 7, topClash: { location: 'Level 4 Column C7', discipline: 'mep/structural', severity: 'critical' } },
    latencyMs: 892,
    status: 'success',
  },
  {
    serverId: 'welloff-volt',
    toolName: 'run_fea_analysis',
    agentId: 'VOLT',
    params: { partUrl: 'cad://bracket-v3.step', material: '4140 steel', loadN: 18500, loadType: 'static', meshDensity: 'fine' },
    result: { maxStressMPa: 312, safetyFactor: 1.84, failureRisk: 'low', criticalRegion: 'fillet radius R2.5', recommendedChange: 'Increase fillet to R4.0' },
    latencyMs: 1240,
    status: 'success',
  },
  {
    serverId: 'welloff-motor',
    toolName: 'diagnose_fault_code',
    agentId: 'MOTOR',
    params: { vehicleId: 'VH-2291', dtcCode: 'P0300', includeRepairGuide: 'true' },
    result: { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'high', likelyCauses: ['spark plugs', 'ignition coil', 'fuel injector'], estimatedRepairHours: 2.5 },
    latencyMs: 287,
    status: 'success',
  },
  {
    serverId: 'welloff-mesh',
    toolName: 'detect_traffic_anomalies',
    agentId: 'MESH',
    params: { thresholdGbps: 2.0, vlan: 40, lookbackMinutes: 60 },
    result: { anomaliesDetected: 1, peakGbps: 2.3, vlan: 40, startTime: '2026-10-16T09:14:00Z', sourceIp: '10.40.22.87', recommendation: 'Block source IP pending investigation' },
    latencyMs: 145,
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
