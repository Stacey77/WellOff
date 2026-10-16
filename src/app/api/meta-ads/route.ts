import { NextRequest, NextResponse } from 'next/server'
import {
  listCampaigns,
  createCampaign,
  createAdSet,
  getCampaignInsights,
  createLeadForm,
  getLeadFormSubmissions,
  updateCampaignStatus,
  killCampaigns,
} from '@/lib/providers/meta-ads'

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

      case 'createAdSet':
        return NextResponse.json(
          await createAdSet(params as Parameters<typeof createAdSet>[0]),
        )

      case 'getCampaignInsights': {
        const { campaignId, ...insightParams } = params as {
          campaignId: string
          date_preset?: string
          fields?: string[]
        }
        return NextResponse.json(await getCampaignInsights(campaignId, insightParams))
      }

      case 'createLeadForm':
        return NextResponse.json(
          await createLeadForm(params as Parameters<typeof createLeadForm>[0]),
        )

      case 'getLeadFormSubmissions': {
        const { formId } = params as { formId: string }
        return NextResponse.json(await getLeadFormSubmissions(formId))
      }

      case 'updateCampaignStatus': {
        const { campaignId, status } = params as { campaignId: string; status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' }
        return NextResponse.json(await updateCampaignStatus(campaignId, status))
      }

      case 'killCampaigns': {
        const { campaignIds } = params as { campaignIds: string[] }
        return NextResponse.json(await killCampaigns(campaignIds))
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${String(action)}` }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
