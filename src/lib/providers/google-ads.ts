interface GoogleAdsConfig {
  developerToken?: string
  clientId?: string
  clientSecret?: string
  refreshToken?: string
  customerId?: string
  loginCustomerId?: string
}

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const BASE_URL = 'https://googleads.googleapis.com/v18'

function resolveDeveloperToken(explicit?: string): string {
  const t = explicit ?? process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''
  if (!t) throw new Error('Google Ads: no developer token. Set GOOGLE_ADS_DEVELOPER_TOKEN.')
  return t
}

function resolveClientId(explicit?: string): string {
  const t = explicit ?? process.env.GOOGLE_ADS_CLIENT_ID ?? ''
  if (!t) throw new Error('Google Ads: no client ID. Set GOOGLE_ADS_CLIENT_ID.')
  return t
}

function resolveClientSecret(explicit?: string): string {
  const t = explicit ?? process.env.GOOGLE_ADS_CLIENT_SECRET ?? ''
  if (!t) throw new Error('Google Ads: no client secret. Set GOOGLE_ADS_CLIENT_SECRET.')
  return t
}

function resolveRefreshToken(explicit?: string): string {
  const t = explicit ?? process.env.GOOGLE_ADS_REFRESH_TOKEN ?? ''
  if (!t) throw new Error('Google Ads: no refresh token. Set GOOGLE_ADS_REFRESH_TOKEN.')
  return t
}

function resolveCustomerId(explicit?: string): string {
  const id = explicit ?? process.env.GOOGLE_ADS_CUSTOMER_ID ?? ''
  if (!id) throw new Error('Google Ads: no customer ID. Set GOOGLE_ADS_CUSTOMER_ID.')
  return id.replace(/-/g, '')
}

async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: resolveRefreshToken(config.refreshToken),
    client_id: resolveClientId(config.clientId),
    client_secret: resolveClientSecret(config.clientSecret),
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Ads token refresh failed ${res.status}: ${text}`)
  }
  const data = (await res.json()) as TokenResponse
  return data.access_token
}

async function googleAdsFetch<T>(
  path: string,
  config: GoogleAdsConfig,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getAccessToken(config)
  const devToken = resolveDeveloperToken(config.developerToken)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  const loginCustomerId = config.loginCustomerId ?? process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId.replace(/-/g, '')
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Ads API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function listCampaigns(config: GoogleAdsConfig = {}): Promise<unknown> {
  const customerId = resolveCustomerId(config.customerId)
  return googleAdsFetch<unknown>(`/customers/${customerId}/googleAds:searchStream`, config, {
    method: 'POST',
    body: JSON.stringify({
      query: 'SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign ORDER BY campaign.id',
    }),
  })
}

export async function createCampaign(
  params: {
    name: string
    advertisingChannelType?: string
    biddingStrategyType?: string
    targetCpa?: number
    budgetMicros?: number
  },
  config: GoogleAdsConfig = {},
): Promise<unknown> {
  const customerId = resolveCustomerId(config.customerId)
  const operation = {
    create: {
      name: params.name,
      advertisingChannelType: params.advertisingChannelType ?? 'SEARCH',
      biddingStrategyType: params.biddingStrategyType ?? 'TARGET_CPA',
      ...(params.targetCpa != null ? { targetCpa: { targetCpaMicros: String(Math.round(params.targetCpa * 1_000_000)) } } : {}),
      ...(params.budgetMicros != null ? { campaignBudget: `customers/${customerId}/campaignBudgets/~${params.budgetMicros}` } : {}),
    },
  }
  return googleAdsFetch<unknown>(`/customers/${customerId}/campaigns:mutate`, config, {
    method: 'POST',
    body: JSON.stringify({ operations: [operation] }),
  })
}

export async function getCampaignPerformance(
  campaignId: string,
  params: { dateRange?: string } = {},
  config: GoogleAdsConfig = {},
): Promise<unknown> {
  const customerId = resolveCustomerId(config.customerId)
  const dateClause = params.dateRange ? ` AND segments.date DURING ${params.dateRange}` : ''
  return googleAdsFetch<unknown>(`/customers/${customerId}/googleAds:searchStream`, config, {
    method: 'POST',
    body: JSON.stringify({
      query: `SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId}${dateClause}`,
    }),
  })
}

export async function getKeywordIdeas(
  params: {
    keywords: string[]
    geoTargetConstants?: string[]
    language?: string
  },
  config: GoogleAdsConfig = {},
): Promise<unknown> {
  const customerId = resolveCustomerId(config.customerId)
  return googleAdsFetch<unknown>(`/customers/${customerId}:generateKeywordIdeas`, config, {
    method: 'POST',
    body: JSON.stringify({
      keywordSeed: { keywords: params.keywords },
      ...(params.geoTargetConstants ? { geoTargetConstants: params.geoTargetConstants } : {}),
      ...(params.language ? { language: params.language } : {}),
    }),
  })
}

export async function createAdGroup(
  params: { campaignId: string; name: string; cpcBidMicros?: number },
  config: GoogleAdsConfig = {},
): Promise<unknown> {
  const customerId = resolveCustomerId(config.customerId)
  const operation = {
    create: {
      name: params.name,
      campaign: `customers/${customerId}/campaigns/${params.campaignId}`,
      ...(params.cpcBidMicros != null ? { cpcBidMicros: String(params.cpcBidMicros) } : {}),
    },
  }
  return googleAdsFetch<unknown>(`/customers/${customerId}/adGroups:mutate`, config, {
    method: 'POST',
    body: JSON.stringify({ operations: [operation] }),
  })
}

export async function smokeTest(config: GoogleAdsConfig = {}): Promise<{ ok: boolean; customerId: string }> {
  const customerId = resolveCustomerId(config.customerId)
  resolveDeveloperToken(config.developerToken)
  resolveClientId(config.clientId)
  resolveClientSecret(config.clientSecret)
  resolveRefreshToken(config.refreshToken)
  return { ok: true, customerId }
}
