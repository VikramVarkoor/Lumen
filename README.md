# ✦ Lumen

**Multi-model AI aggregator** — Llama 3.3 70B, Qwen 3 32B, and Kimi K2 answer your question in parallel, a judge synthesizes the best response, and a verdict panel ranks each model's performance.

**[→ Live Demo](https://lumen-ten-psi.vercel.app/dashboard)**

---

## What it does

You type one question. Lumen sends it to three different AI models simultaneously, streams their responses token by token, then runs a judge model that synthesizes the best answer from all three. An agreement score (0–100%) shows how much the models aligned, a divergence card highlights where they disagreed most, and a verdict panel ranks each model with scores and critiques.

## Features

- **Parallel streaming** — All selected models stream token-by-token simultaneously via SSE
- **Judge synthesis** — Synthesizes the best answer combining insights from all responses
- **Judge's verdict** — Ranks each model 1-10 with per-model critiques and a winner
- **Agreement score** — Measures semantic similarity between model responses (0–100%)
- **Divergence card** — Shows where models disagreed most, side by side
- **Collapsible model cards** — Preview mode by default, expand to read full response
- **Prompt templates** — Quick-start buttons for common query types
- **Model selector** — Toggle which models to include per query
- **Query history** — Saved to Supabase, per-user with auth
- **Auth** — Supabase email/password, anonymous queries also saved
- **Share** — Copy a link to any query result
- **Export** — Download synthesis as a markdown file

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Custom CSS |
| AI | Groq SDK (free tier) |
| Database | Supabase (Postgres + Auth) |
| Streaming | `ReadableStream` + SSE |

## Models

| Role | Model | Provider |
|------|-------|----------|
| Respondent 1 | `llama-3.3-70b-versatile` | Meta via Groq |
| Respondent 2 | `qwen/qwen3-32b` | Alibaba via Groq |
| Respondent 3 | `moonshotai/kimi-k2-instruct-0905` | Moonshot via Groq |
| Judge | `llama-3.3-70b-versatile` | Meta via Groq |

---

## Quick Start

### 1. Clone & install
```bash
git clone https://github.com/VikramVarkoor/Lumen
cd Lumen
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Fill in your keys:
- `GROQ_API_KEY` — [console.groq.com](https://console.groq.com) (free, no credit card)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL editor
3. Run the contents of `supabase/schema.sql`
4. Enable **Email Auth** under Authentication → Providers

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture
```
app/
├── api/
│   ├── query/route.ts      ← SSE stream: runs all models in parallel
│   └── history/route.ts    ← Query history (auth-gated)
├── dashboard/page.tsx      ← Main UI
├── history/page.tsx        ← History browser
└── layout.tsx

lib/
├── ai/
│   ├── anthropic.ts        ← Llama 3.3 70B streaming + judge + verdict
│   ├── openai.ts           ← Qwen 3 32B streaming
│   └── gemini.ts           ← Kimi K2 streaming
├── db/supabase.ts          ← DB helpers
├── hooks/
│   ├── useQuery.ts         ← Streaming state hook
│   └── useAuth.ts          ← Auth hook
└── utils/agreement.ts      ← Text similarity score

components/
├── query/
│   ├── QueryInput.tsx      ← Textarea + model selector
│   └── ModelSelector.tsx   ← Toggle pills
├── results/
│   ├── ModelCard.tsx       ← Per-model streaming card (collapsible)
│   ├── SynthesisPanel.tsx  ← Judge output + share + export
│   ├── AgreementBadge.tsx  ← Score visualization
│   ├── DivergenceCard.tsx  ← Side-by-side divergence view
│   └── VerdictPanel.tsx    ← Model rankings + critiques
├── layout/Navbar.tsx
└── ui/AuthModal.tsx
```

## Streaming Protocol

The `/api/query` route emits SSE events in this sequence:
```
data: {"type":"response_chunk","modelId":"claude-sonnet-4-20250514","content":"..."}
data: {"type":"response_chunk","modelId":"gpt-4o","content":"..."}
data: {"type":"response_chunk","modelId":"gemini-2.0-flash","content":"..."}
... (interleaved as models stream in parallel)
data: {"type":"agreement","agreement":{"score":22,"label":"low","breakdown":[...]}}
data: {"type":"synthesis_chunk","content":"..."}
... (synthesis streams token by token)
data: {"type":"verdict","verdict":{"best":"...","scores":[...],"reasoning":"..."}}
data: {"type":"done","queryId":"uuid-..."}
```

All models stream concurrently via `Promise.all`. The `useQuery` hook updates each model's state independently as chunks arrive.

## Agreement Score

Computed using word-overlap (Jaccard similarity) between all model response pairs:

- **High** (60–100%): Models substantially agree
- **Medium** (35–59%): Partial agreement, mixed perspectives
- **Low** (0–34%): Models diverged significantly

## Deployment

Deployed on Vercel. Set the following environment variables in your Vercel project settings:
```env
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```