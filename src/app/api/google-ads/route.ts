import { NextRequest, NextResponse } from 'next/server'
import {
  listCampaigns,
  createCampaign,
  getCampaignPerformance,
  getKeywordIdeas,
  createAdGroup,
} from '@/lib/providers/google-ads'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { action, ...params } = body

  try {
    switch (action) {
      case 'listCampaigns':
        return NextResponse.json(await listCampaigns())

      case 'createCampaign':
        return NextResponse.json(
          await createCampaign(params as Parameters<typeof createCampaign>[0]),
        )

      case 'getCampaignPerformance': {
        const { campaignId, ...perfParams } = params as {
          campaignId: string
          dateRange?: string
        }
        return NextResponse.json(await getCampaignPerformance(campaignId, perfParams))
      }

      case 'getKeywordIdeas':
        return NextResponse.json(
          await getKeywordIdeas(params as Parameters<typeof getKeywordIdeas>[0]),
        )

      case 'createAdGroup':
        return NextResponse.json(
          await createAdGroup(params as Parameters<typeof createAdGroup>[0]),
        )

      default:
        return NextResponse.json({ error: `Unknown action: ${String(action)}` }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
