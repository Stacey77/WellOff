import { NextRequest, NextResponse } from 'next/server'
import { MCP_SERVERS } from '@/lib/mcp/servers'
import * as MetaAds from '@/lib/providers/meta-ads'
import * as GoogleAds from '@/lib/providers/google-ads'

// ─── MCP JSON-RPC 2.0 Types ───────────────────────────────────────────────────

interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: unknown
}

interface MCPSuccessResponse {
  jsonrpc: '2.0'
  id: string | number
  result: unknown
}

interface MCPErrorResponse {
  jsonrpc: '2.0'
  id: string | number
  error: { code: number; message: string }
}

type MCPResponse = MCPSuccessResponse | MCPErrorResponse

interface ToolCallParams {
  name: string
  arguments: Record<string, unknown>
}

// ─── Inline Ad Server Tool Definitions ───────────────────────────────────────

const META_ADS_TOOLS = [
  {
    name: 'list_meta_campaigns',
    description: 'List all Meta (Facebook) ad campaigns for the configured ad account',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_meta_campaign',
    description: 'Create a new Meta (Facebook) ad campaign',
    inputSchema: {
      type: 'object',
      required: ['name', 'objective'],
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        objective: {
          type: 'string',
          enum: ['OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS', 'OUTCOME_ENGAGEMENT'],
          description: 'Campaign objective',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED'],
          description: 'Initial campaign status (default: PAUSED)',
        },
        special_ad_categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Special ad categories (e.g. HOUSING, EMPLOYMENT, CREDIT)',
        },
      },
    },
  },
  {
    name: 'create_meta_ad_set',
    description: 'Create an ad set within a Meta campaign with targeting and budget settings',
    inputSchema: {
      type: 'object',
      required: ['campaign_id', 'name'],
      properties: {
        campaign_id: { type: 'string', description: 'Parent campaign ID' },
        name: { type: 'string', description: 'Ad set name' },
        targeting: { type: 'object', description: 'Targeting spec object', properties: {} },
        billing_event: {
          type: 'string',
          enum: ['IMPRESSIONS', 'LINK_CLICKS', 'PAGE_LIKES'],
          description: 'Billing event',
        },
        optimization_goal: {
          type: 'string',
          enum: ['LEAD_GENERATION', 'CONVERSIONS', 'REACH', 'LINK_CLICKS'],
          description: 'Optimization goal',
        },
        bid_amount: { type: 'number', description: 'Bid amount in cents' },
        daily_budget: { type: 'number', description: 'Daily budget in cents' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'Ad set status' },
      },
    },
  },
  {
    name: 'get_meta_campaign_insights',
    description: 'Retrieve performance insights for a Meta campaign',
    inputSchema: {
      type: 'object',
      required: ['campaignId'],
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID to get insights for' },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'last_90d', 'this_month', 'last_month'],
          description: 'Predefined date range',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Insight fields to return (e.g. impressions, clicks, spend)',
        },
      },
    },
  },
  {
    name: 'create_lead_form',
    description: 'Create a Meta lead generation form on a Facebook Page',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Lead form name' },
        page_id: { type: 'string', description: 'Facebook Page ID to attach the form to' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Question type (e.g. EMAIL, PHONE, FULL_NAME, CUSTOM)' },
              label: { type: 'string', description: 'Custom question label' },
            },
          },
          description: 'Questions to include on the form',
        },
        privacy_policy: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Privacy policy URL' },
            link_text: { type: 'string', description: 'Link text for privacy policy' },
          },
          description: 'Privacy policy link',
        },
      },
    },
  },
  {
    name: 'get_lead_form_submissions',
    description: 'Retrieve submissions from a Meta lead generation form',
    inputSchema: {
      type: 'object',
      required: ['formId'],
      properties: {
        formId: { type: 'string', description: 'Lead form ID' },
      },
    },
  },
  {
    name: 'update_meta_campaign_status',
    description: 'Update the status of a Meta campaign (pause, activate, archive, or delete)',
    inputSchema: {
      type: 'object',
      required: ['campaignId', 'status'],
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID to update' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED'],
          description: 'New campaign status',
        },
      },
    },
  },
  {
    name: 'kill_meta_campaigns',
    description: 'Pause multiple Meta campaigns in bulk',
    inputSchema: {
      type: 'object',
      required: ['campaignIds'],
      properties: {
        campaignIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of campaign IDs to pause',
        },
      },
    },
  },
]

const GOOGLE_ADS_TOOLS = [
  {
    name: 'list_google_campaigns',
    description: 'List all Google Ads campaigns for the configured customer account',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_google_campaign',
    description: 'Create a new Google Ads campaign',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        advertisingChannelType: {
          type: 'string',
          enum: ['SEARCH', 'DISPLAY', 'SHOPPING', 'VIDEO', 'PERFORMANCE_MAX'],
          description: 'Advertising channel type (default: SEARCH)',
        },
        biddingStrategyType: {
          type: 'string',
          enum: ['TARGET_CPA', 'TARGET_ROAS', 'MAXIMIZE_CONVERSIONS', 'MANUAL_CPC'],
          description: 'Bidding strategy (default: TARGET_CPA)',
        },
        targetCpa: { type: 'number', description: 'Target cost per acquisition in dollars' },
        budgetMicros: { type: 'number', description: 'Campaign budget in micros (1,000,000 = $1)' },
      },
    },
  },
  {
    name: 'get_campaign_performance',
    description: 'Retrieve performance metrics for a Google Ads campaign',
    inputSchema: {
      type: 'object',
      required: ['campaignId'],
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID to get performance for' },
        dateRange: {
          type: 'string',
          enum: ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH'],
          description: 'Date range for performance data',
        },
      },
    },
  },
  {
    name: 'get_keyword_ideas',
    description: 'Generate keyword ideas and search volume estimates for Google Ads',
    inputSchema: {
      type: 'object',
      required: ['keywords'],
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Seed keywords to generate ideas from',
        },
        geoTargetConstants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Geo target constant resource names',
        },
        language: { type: 'string', description: 'Language resource name (e.g. languageConstants/1000 for English)' },
      },
    },
  },
  {
    name: 'create_ad_group',
    description: 'Create a new ad group within a Google Ads campaign',
    inputSchema: {
      type: 'object',
      required: ['campaignId', 'name'],
      properties: {
        campaignId: { type: 'string', description: 'Parent campaign ID' },
        name: { type: 'string', description: 'Ad group name' },
        cpcBidMicros: { type: 'number', description: 'Max CPC bid in micros (1,000,000 = $1)' },
      },
    },
  },
]

// ─── Aggregate tools list ─────────────────────────────────────────────────────

function getAllTools() {
  const serverTools = MCP_SERVERS.flatMap((server) =>
    server.tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  )
  return [...serverTools, ...META_ADS_TOOLS, ...GOOGLE_ADS_TOOLS]
}

// ─── Tool dispatcher ──────────────────────────────────────────────────────────

async function dispatchTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    // Meta Ads
    case 'list_meta_campaigns':
      return MetaAds.listCampaigns()
    case 'create_meta_campaign':
      return MetaAds.createCampaign(args as Parameters<typeof MetaAds.createCampaign>[0])
    case 'create_meta_ad_set':
      return MetaAds.createAdSet(args as Parameters<typeof MetaAds.createAdSet>[0])
    case 'get_meta_campaign_insights':
      return MetaAds.getCampaignInsights(
        args['campaignId'] as string,
        args as { date_preset?: string; fields?: string[] },
      )
    case 'create_lead_form':
      return MetaAds.createLeadForm(args as Parameters<typeof MetaAds.createLeadForm>[0])
    case 'get_lead_form_submissions':
      return MetaAds.getLeadFormSubmissions(args['formId'] as string)
    case 'update_meta_campaign_status':
      return MetaAds.updateCampaignStatus(
        args['campaignId'] as string,
        args['status'] as Parameters<typeof MetaAds.updateCampaignStatus>[1],
      )
    case 'kill_meta_campaigns':
      return MetaAds.killCampaigns(args['campaignIds'] as string[])

    // Google Ads
    case 'list_google_campaigns':
      return GoogleAds.listCampaigns()
    case 'create_google_campaign':
      return GoogleAds.createCampaign(args as Parameters<typeof GoogleAds.createCampaign>[0])
    case 'get_campaign_performance':
      return GoogleAds.getCampaignPerformance(
        args['campaignId'] as string,
        args as { dateRange?: string },
      )
    case 'get_keyword_ideas':
      return GoogleAds.getKeywordIdeas(args as Parameters<typeof GoogleAds.getKeywordIdeas>[0])
    case 'create_ad_group':
      return GoogleAds.createAdGroup(args as Parameters<typeof GoogleAds.createAdGroup>[0])

    // All other tools — backend not yet connected
    default:
      return {
        simulated: true,
        tool: name,
        message: 'Backend not yet connected — returning placeholder data',
      }
  }
}

// ─── Method handlers ──────────────────────────────────────────────────────────

function handleInitialize(): unknown {
  return {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    serverInfo: { name: 'welloff-mcp', version: '1.0.0' },
  }
}

function handleToolsList(): unknown {
  return { tools: getAllTools() }
}

async function handleToolsCall(params: unknown): Promise<unknown> {
  const { name, arguments: args } = params as ToolCallParams
  const result = await dispatchTool(name, args ?? {})
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let rpc: MCPRequest
  try {
    rpc = (await req.json()) as MCPRequest
  } catch {
    const err: MCPErrorResponse = {
      jsonrpc: '2.0',
      id: 0,
      error: { code: -32700, message: 'Parse error: invalid JSON' },
    }
    return NextResponse.json(err, { status: 400 })
  }

  const respond = (result: unknown): NextResponse<MCPResponse> =>
    NextResponse.json({ jsonrpc: '2.0', id: rpc.id, result } as MCPSuccessResponse)

  const respondError = (code: number, message: string, status = 400): NextResponse<MCPResponse> =>
    NextResponse.json(
      { jsonrpc: '2.0', id: rpc.id, error: { code, message } } as MCPErrorResponse,
      { status },
    )

  try {
    switch (rpc.method) {
      case 'initialize':
        return respond(handleInitialize())

      case 'tools/list':
        return respond(handleToolsList())

      case 'tools/call':
        return respond(await handleToolsCall(rpc.params))

      default:
        return respondError(-32601, `Method not found: ${rpc.method}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return respondError(-32603, `Internal error: ${message}`, 502)
  }
}
