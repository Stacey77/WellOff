/**
 * Kimi (Moonshot AI) inference provider.
 *
 * Moonshot AI exposes an OpenAI-compatible Chat Completions API at
 *   https://api.moonshot.cn/v1
 *
 * Configuration (all optional, with env-var fallbacks):
 *   baseUrl  – defaults to KIMI_BASE_URL → "https://api.moonshot.cn/v1"
 *   apiKey   – defaults to MOONSHOT_API_KEY → OPENAI_API_KEY
 *   model    – defaults to KIMI_MODEL → "kimi-k2"
 */

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface KimiConfig {
  /** Moonshot AI base URL (OpenAI-compatible). */
  baseUrl?: string
  /** API key – MOONSHOT_API_KEY or OPENAI_API_KEY env vars are also checked. */
  apiKey?: string
  /** Model identifier, e.g. "kimi-k2", "moonshot-v1-8k", "moonshot-v1-128k". */
  model?: string
  /** Sampling temperature (0–2). */
  temperature?: number
  /** Maximum tokens to generate. */
  maxTokens?: number
}

export interface KimiChoice {
  index: number
  message: KimiMessage
  finish_reason: string
}

export interface KimiResponse {
  id: string
  object: string
  created: number
  model: string
  choices: KimiChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1'
const DEFAULT_MODEL = 'kimi-k2'

/**
 * Allowed URL prefixes for the Kimi/Moonshot API base URL.
 * Restrict outbound requests to known Moonshot AI endpoints to prevent SSRF.
 */
const ALLOWED_BASE_URL_PREFIXES = [
  'https://api.moonshot.cn/',
  'https://api.moonshot.cn',
]

function validateBaseUrl(url: string): void {
  const isAllowed = ALLOWED_BASE_URL_PREFIXES.some((prefix) =>
    url.startsWith(prefix),
  )
  if (!isAllowed) {
    throw new Error(
      `Kimi provider: baseUrl "${url}" is not in the list of allowed Moonshot AI endpoints. ` +
        `Allowed prefixes: ${ALLOWED_BASE_URL_PREFIXES.join(', ')}`,
    )
  }
}

function resolveApiKey(explicit?: string): string {
  const key =
    explicit ??
    process.env.MOONSHOT_API_KEY ??
    process.env.OPENAI_API_KEY ??
    ''
  if (!key) {
    throw new Error(
      'Kimi provider: no API key found. ' +
        'Set MOONSHOT_API_KEY (or OPENAI_API_KEY) in your environment, ' +
        'or pass apiKey in KimiConfig.',
    )
  }
  return key
}

function resolveBaseUrl(explicit?: string): string {
  return (
    explicit ??
    process.env.KIMI_BASE_URL ??
    DEFAULT_BASE_URL
  )
}

function resolveModel(explicit?: string): string {
  return explicit ?? process.env.KIMI_MODEL ?? DEFAULT_MODEL
}

/**
 * Send a chat-completion request to the Moonshot AI (Kimi) API.
 *
 * @example
 * ```ts
 * import { kimiChat } from '@/lib/providers/kimi'
 *
 * const reply = await kimiChat(
 *   [{ role: 'user', content: 'Hello, Kimi!' }],
 *   { model: 'kimi-k2', temperature: 0.7 },
 * )
 * console.log(reply)
 * ```
 */
export async function kimiChat(
  messages: KimiMessage[],
  config: KimiConfig = {},
): Promise<string> {
  const apiKey = resolveApiKey(config.apiKey)
  const baseUrl = resolveBaseUrl(config.baseUrl)
  const model = resolveModel(config.model)

  validateBaseUrl(baseUrl)

  const body = {
    model,
    messages,
    temperature: config.temperature ?? 0.7,
    ...(config.maxTokens != null ? { max_tokens: config.maxTokens } : {}),
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Kimi API error ${response.status} ${response.statusText}: ${errorText}`,
    )
  }

  const data = (await response.json()) as KimiResponse

  const content = data.choices?.[0]?.message?.content
  if (content == null) {
    throw new Error('Kimi API returned an unexpected response shape.')
  }
  return content
}

/**
 * Lightweight provider object for use in agent orchestration or MCP tools.
 */
export function createKimiProvider(config: KimiConfig = {}) {
  const baseUrl = resolveBaseUrl(config.baseUrl)
  validateBaseUrl(baseUrl)
  return {
    name: 'kimi' as const,
    model: resolveModel(config.model),
    baseUrl,

    chat: (messages: KimiMessage[], overrides: Partial<KimiConfig> = {}) =>
      kimiChat(messages, { ...config, ...overrides }),
  }
}
