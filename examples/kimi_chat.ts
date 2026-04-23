/**
 * examples/kimi_chat.ts
 *
 * Minimal runnable example — send a message to Kimi (Moonshot AI) using the
 * WellOff Kimi provider wrapper.
 *
 * Usage
 * -----
 *   export MOONSHOT_API_KEY="sk-..."
 *   npx ts-node examples/kimi_chat.ts
 *
 * Or override model / base URL:
 *   KIMI_MODEL=moonshot-v1-128k \
 *   KIMI_BASE_URL=https://api.moonshot.cn/v1 \
 *   npx ts-node examples/kimi_chat.ts
 *
 * Environment variables
 * ---------------------
 *   MOONSHOT_API_KEY  – Moonshot AI secret key (required unless OPENAI_API_KEY set)
 *   OPENAI_API_KEY    – fallback key if MOONSHOT_API_KEY is unset
 *   KIMI_MODEL        – model ID (default: kimi-k2)
 *   KIMI_BASE_URL     – API base URL (default: https://api.moonshot.cn/v1)
 */

import { kimiChat, createKimiProvider, KimiMessage } from '../src/lib/providers/kimi'

async function main() {
  // ── 1. Basic one-shot chat ────────────────────────────────────────────────
  console.log('=== Basic kimiChat ===')

  const messages: KimiMessage[] = [
    {
      role: 'system',
      content: 'You are Kimi, a helpful AI assistant made by Moonshot AI.',
    },
    {
      role: 'user',
      content: 'What is the capital of France? Answer in one sentence.',
    },
  ]

  const reply = await kimiChat(messages, {
    // model, baseUrl and apiKey are picked up from env vars if not specified here
    temperature: 0.3,
    maxTokens: 128,
  })

  console.log('Reply:', reply)
  console.log()

  // ── 2. Provider object (useful for agent orchestration) ───────────────────
  console.log('=== createKimiProvider ===')

  const kimi = createKimiProvider({
    model: process.env.KIMI_MODEL ?? 'kimi-k2',
    temperature: 0.7,
  })

  console.log(`Provider: ${kimi.name}, model: ${kimi.model}, base: ${kimi.baseUrl}`)

  const agentReply = await kimi.chat([
    { role: 'user', content: 'Write a haiku about real estate.' },
  ])

  console.log('Agent reply:', agentReply)
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
