import { NextRequest, NextResponse } from 'next/server'
import { kimiChat, KimiConfig, KimiMessage } from '@/lib/providers/kimi'

/**
 * POST /api/kimi
 *
 * Proxies a chat-completion request to the Moonshot AI (Kimi) API.
 *
 * Request body:
 * ```json
 * {
 *   "messages": [{ "role": "user", "content": "Hello, Kimi!" }],
 *   "model": "kimi-k2",          // optional, defaults to KIMI_MODEL env var
 *   "temperature": 0.7,          // optional
 *   "maxTokens": 1024,           // optional
 *   "baseUrl": "https://api.moonshot.cn/v1"  // optional
 * }
 * ```
 *
 * Response:
 * ```json
 * { "reply": "..." }
 * ```
 *
 * The API key is read server-side from MOONSHOT_API_KEY (or OPENAI_API_KEY).
 * Never expose the key to the client.
 */
export async function POST(req: NextRequest) {
  let body: {
    messages?: KimiMessage[]
    model?: string
    temperature?: number
    maxTokens?: number
    baseUrl?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: '`messages` must be a non-empty array.' },
      { status: 400 },
    )
  }

  const config: KimiConfig = {
    model: body.model,
    temperature: body.temperature,
    maxTokens: body.maxTokens,
    baseUrl: body.baseUrl,
  }

  try {
    const reply = await kimiChat(body.messages, config)
    return NextResponse.json({ reply })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
