type MetaAdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'

interface MetaAdsConfig {
  accessToken?: string
  adAccountId?: string
  apiVersion?: string
}

interface MetaTokenRefreshResponse {
  error?: { message: string }
}

const DEFAULT_API_VERSION = 'v21.0'
const BASE_URL = 'https://graph.facebook.com'

function resolveToken(explicit?: string): string {
  const t = explicit ?? process.env.META_ADS_ACCESS_TOKEN ?? process.env.FB_ACCESS_TOKEN ?? ''
  if (!t) throw new Error('Meta Ads: no access token. Set META_ADS_ACCESS_TOKEN or FB_ACCESS_TOKEN.')
  return t
}

function resolveAccountId(explicit?: string): string {
  const id = explicit ?? process.env.META_AD_ACCOUNT_ID ?? ''
  if (!id) throw new Error('Meta Ads: no ad account ID. Set META_AD_ACCOUNT_ID.')
  return id
}

function resolveVersion(explicit?: string): string {
  return explicit ?? process.env.META_ADS_API_VERSION ?? DEFAULT_API_VERSION
}

async function metaFetch<T>(
  path: string,
  config: MetaAdsConfig,
  init?: RequestInit,
  extra?: Record<string, string>,
): Promise<T> {
  const token = resolveToken(config.accessToken)
  const version = resolveVersion(config.apiVersion)
  const url = new URL(`${BASE_URL}/${version}${path}`)
  url.searchParams.set('access_token', token)
  if (extra) {
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), init)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Meta Ads API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function listCampaigns(config: MetaAdsConfig = {}): Promise<unknown> {
  const accountId = resolveAccountId(config.adAccountId)
  return metaFetch<unknown>(`/act_${accountId}/campaigns`, config, undefined, {
    fields: 'id,name,objective,status,created_time',
  })
}

export async function createCampaign(
  params: {
    name: string
    objective: string
    status?: MetaAdStatus
    special_ad_categories?: string[]
  },
  config: MetaAdsConfig = {},
): Promise<unknown> {
  const accountId = resolveAccountId(config.adAccountId)
  return metaFetch<unknown>(`/act_${accountId}/campaigns`, config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, special_ad_categories: params.special_ad_categories ?? [] }),
  })
}

export async function createAdSet(
  params: {
    campaign_id: string
    name: string
    targeting?: Record<string, unknown>
    billing_event?: string
    optimization_goal?: string
    bid_amount?: number
    daily_budget?: number
    status?: MetaAdStatus
  },
  config: MetaAdsConfig = {},
): Promise<unknown> {
  const accountId = resolveAccountId(config.adAccountId)
  return metaFetch<unknown>(`/act_${accountId}/adsets`, config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
}

export async function getCampaignInsights(
  campaignId: string,
  params: { date_preset?: string; fields?: string[] } = {},
  config: MetaAdsConfig = {},
): Promise<unknown> {
  const extra: Record<string, string> = {}
  if (params.date_preset) extra['date_preset'] = params.date_preset
  if (params.fields?.length) extra['fields'] = params.fields.join(',')
  return metaFetch<unknown>(`/${campaignId}/insights`, config, undefined, extra)
}

export async function createLeadForm(
  params: {
    name: string
    questions?: { type: string; label?: string }[]
    privacy_policy?: { url: string; link_text: string }
    page_id?: string
  },
  config: MetaAdsConfig = {},
): Promise<unknown> {
  const pageId = params.page_id ?? process.env.META_PAGE_ID ?? ''
  if (!pageId) throw new Error('Meta Ads: no page_id. Pass page_id in params or set META_PAGE_ID.')
  const { page_id: _pid, ...rest } = params
  void _pid
  return metaFetch<unknown>(`/${pageId}/leadgen_forms`, config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  })
}

export async function getLeadFormSubmissions(
  formId: string,
  config: MetaAdsConfig = {},
): Promise<unknown> {
  return metaFetch<unknown>(`/${formId}/leads`, config)
}

export async function updateCampaignStatus(
  campaignId: string,
  status: MetaAdStatus,
  config: MetaAdsConfig = {},
): Promise<{ success: boolean }> {
  const result = await metaFetch<MetaTokenRefreshResponse>(`/${campaignId}`, config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return { success: !result.error }
}

export async function killCampaigns(
  campaignIds: string[],
  config: MetaAdsConfig = {},
): Promise<{ killed: string[]; errors: { id: string; error: string }[] }> {
  const killed: string[] = []
  const errors: { id: string; error: string }[] = []
  await Promise.all(
    campaignIds.map(async (id) => {
      try {
        await updateCampaignStatus(id, 'PAUSED', config)
        killed.push(id)
      } catch (err) {
        errors.push({ id, error: err instanceof Error ? err.message : String(err) })
      }
    }),
  )
  return { killed, errors }
}

export async function smokeTest(config: MetaAdsConfig = {}): Promise<{ ok: boolean; adAccountId: string }> {
  const adAccountId = resolveAccountId(config.adAccountId)
  resolveToken(config.accessToken)
  return { ok: true, adAccountId }
}
