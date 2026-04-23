# OpenMythos — Class Reference & Design Document

`open_mythos.main.OpenMythos` is a **PyTorch `nn.Module`** that implements a
**Recurrent-Depth Transformer (RDT)** language model.  Instead of stacking many
unique layers it uses three stages:

```
token IDs → Embedding → Prelude (N blocks)
                             ↓
                     Recurrent Block (1 block, looped T times)
                             ↓
                       Coda (M blocks) → RMSNorm → LM Head → logits
```

---

## `MythosConfig` — configuration dataclass

All model hyper-parameters live in a single `@dataclass`:

| Field | Type | Default | Description |
|---|---|---|---|
| `vocab_size` | `int` | `65536` | Vocabulary size |
| `dim` | `int` | `4096` | Model (hidden) dimension |
| `n_heads` | `int` | `32` | Number of attention heads |
| `n_kv_heads` | `int` | `8` | Key/value heads (GQA) or latent dim divisor (MLA) |
| `max_seq_len` | `int` | `8192` | Maximum context length |
| `prelude_layers` | `int` | `4` | Standard Transformer blocks run **once** before the loop |
| `coda_layers` | `int` | `4` | Standard Transformer blocks run **once** after the loop |
| `max_loop_iters` | `int` | `16` | Max recurrent iterations at inference |
| `attn_type` | `str` | `"gqa"` | `"gqa"` (Grouped Query) or `"mla"` (Multi-Latent) |
| `n_experts` | `int` | `64` | Total MoE experts in the recurrent block |
| `n_experts_per_tok` | `int` | `4` | Active experts per token (top-k routing) |
| `n_shared_experts` | `int` | `2` | Always-active shared experts |
| `ffn_dim` | `int` | `14336` | FFN intermediate dimension |
| `act_threshold` | `float` | `0.99` | ACT halting probability threshold (1.0 = no early exit) |
| `lora_rank` | `int` | `32` | Depth-wise LoRA rank inside the recurrent loop |
| `rope_theta` | `float` | `500000.0` | RoPE frequency base |
| `dropout` | `float` | `0.0` | Dropout rate (training only) |

---

## Full configuration reference

### Default / base configuration

```python
from open_mythos.main import MythosConfig

base_cfg = MythosConfig(
    vocab_size=65536,
    dim=4096,
    n_heads=32,
    n_kv_heads=8,
    max_seq_len=8192,
    prelude_layers=4,
    coda_layers=4,
    max_loop_iters=16,
    attn_type="gqa",
    n_experts=64,
    n_experts_per_tok=4,
    n_shared_experts=2,
    ffn_dim=14336,
    act_threshold=0.99,
    lora_rank=32,
    rope_theta=500000.0,
    dropout=0.0,
)
```

---

## Model variants / presets

The presets below match **Kimi** (Moonshot AI) model families.  They are drop-in
`MythosConfig` values you can pass straight to `OpenMythos(cfg)`.

### Kimi-2.5

A mid-range variant optimised for **long-context reasoning** with moderate
compute.  Uses GQA (Grouped Query Attention) to reduce KV-cache size while
supporting 32 K token contexts.

```python
from open_mythos.main import MythosConfig

kimi_2_5 = MythosConfig(
    vocab_size=65536,
    dim=4096,
    n_heads=32,
    n_kv_heads=8,           # GQA: 4:1 reduction
    max_seq_len=32768,      # 32 K context
    prelude_layers=4,
    coda_layers=4,
    max_loop_iters=24,      # deeper recurrence for reasoning
    attn_type="gqa",
    n_experts=64,
    n_experts_per_tok=6,    # slightly wider routing
    n_shared_experts=2,
    ffn_dim=14336,
    act_threshold=0.98,
    lora_rank=32,
    rope_theta=1000000.0,   # extended RoPE for long context
    dropout=0.0,
)
```

**Key tuning choices for Kimi-2.5:**

- `max_seq_len=32768` — 4× the base context window for long-document tasks.
- `max_loop_iters=24` — extra recurrent depth improves multi-step reasoning.
- `n_experts_per_tok=6` — wider per-token expert selection increases capacity.
- `rope_theta=1000000.0` — higher RoPE base compresses high-frequency
  position encodings, which benefits long-range dependencies.

---

### Kimi-2.6

A high-capacity variant that switches to **MLA** (Multi-Latent Attention) for
maximum KV-cache efficiency and adds a larger hidden dimension.  Intended for
demanding agentic workloads that require both breadth and depth.

```python
from open_mythos.main import MythosConfig

kimi_2_6 = MythosConfig(
    vocab_size=65536,
    dim=7168,               # wider hidden dim
    n_heads=64,
    n_kv_heads=8,           # MLA: latent KV compression
    max_seq_len=131072,     # 128 K context
    prelude_layers=6,
    coda_layers=6,
    max_loop_iters=32,      # maximum recurrent depth
    attn_type="mla",        # Multi-Latent Attention
    n_experts=128,          # double the expert pool
    n_experts_per_tok=8,
    n_shared_experts=4,
    ffn_dim=28672,          # proportionally wider FFN
    act_threshold=0.995,
    lora_rank=64,           # higher-rank LoRA for inter-loop variation
    rope_theta=2000000.0,
    dropout=0.0,
)
```

**Key tuning choices for Kimi-2.6:**

- `dim=7168` / `n_heads=64` — significantly larger hidden dimension and head count.
- `attn_type="mla"` — caches a low-rank latent instead of full K/V tensors;
  critical for 128 K context on constrained hardware.
- `max_loop_iters=32` — deep recurrence for complex agentic chains.
- `n_experts=128`, `n_experts_per_tok=8` — larger mixture for specialised
  skills (coding, math, tool use).
- `lora_rank=64` — wider LoRA keeps per-iteration specialisation despite the
  single shared recurrent block.

---

## Instantiation & forward pass

```python
import torch
from open_mythos.main import OpenMythos, MythosConfig

# pick any preset above, e.g. kimi_2_5
model = OpenMythos(kimi_2_5)

input_ids = torch.randint(0, kimi_2_5.vocab_size, (1, 128))
logits = model(input_ids)        # (1, 128, vocab_size)
```

## Generation

```python
output_ids = model.generate(
    input_ids,
    max_new_tokens=256,
    temperature=0.7,
    top_k=50,
)
```

---

## Architecture summary

| Stage | What it is | Loops? |
|---|---|---|
| **Prelude** | `prelude_layers` standard Transformer blocks | No — runs once |
| **Recurrent Block** | 1 Transformer block + MoE FFN + LTI injection + ACT halting + depth LoRA | Yes — `max_loop_iters` times |
| **Coda** | `coda_layers` standard Transformer blocks | No — runs once |
| **LM Head** | RMSNorm → tied linear projection | — |

### Key design properties

- **Depth extrapolation** — train with N loops, run with N+k loops at test time.
- **Parameter efficiency** — one shared recurrent block replaces many unique layers.
- **Adaptive compute** — ACT halting gives harder tokens more iterations.
- **Stable training** — LTI-stable injection (`spectral radius < 1`) prevents
  runaway recurrence.
- **Memory efficiency** — MLA/GQA reduce KV-cache size.
- **Per-loop specialisation** — depth-wise LoRA lets each iteration behave
  differently without fully separate weights.
