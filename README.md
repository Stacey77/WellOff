# WellOff

AI-powered real estate intelligence platform.

---

## Kimi (Moonshot AI) inference backend

WellOff ships a thin provider wrapper that calls the
[Moonshot AI](https://www.moonshot.cn/) OpenAI-compatible API, letting you use
**Kimi** models (e.g. `kimi-k2`, `moonshot-v1-128k`) for AI tasks inside the
platform.

### Quick start

1. **Set your API key** (one of the two env vars is enough):

   ```bash
   export MOONSHOT_API_KEY="sk-..."
   # or
   export OPENAI_API_KEY="sk-..."
   ```

2. **Optional overrides:**

   ```bash
   export KIMI_MODEL="kimi-k2"                        # default
   export KIMI_BASE_URL="https://api.moonshot.cn/v1"  # default
   ```

3. **Use the provider in TypeScript:**

   ```ts
   import { kimiChat } from '@/lib/providers/kimi'

   const reply = await kimiChat(
     [{ role: 'user', content: 'Summarise this property listing…' }],
     { model: 'kimi-k2', temperature: 0.7 },
   )
   console.log(reply)
   ```

4. **Run the example script:**

   ```bash
   export MOONSHOT_API_KEY="sk-..."
   npx ts-node examples/kimi_chat.ts
   ```

5. **Use the REST API route** (Next.js server-side, key never exposed to client):

   ```bash
   curl -X POST http://localhost:3000/api/kimi \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello, Kimi!"}]}'
   ```

### Supported models

| Model ID | Context | Best for |
|---|---|---|
| `kimi-k2` | long | Agentic tasks, reasoning, tool use |
| `moonshot-v1-8k` | 8 K | Fast Q&A, short documents |
| `moonshot-v1-32k` | 32 K | Medium-length documents |
| `moonshot-v1-128k` | 128 K | Long documents, full codebases |

### Architecture presets (OpenMythos)

See [`docs/open_mythos.md`](docs/open_mythos.md) for the full `MythosConfig`
reference including the **Kimi-2.5** and **Kimi-2.6** model-config presets.

---

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```