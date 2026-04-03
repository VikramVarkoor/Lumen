# ✦ Lumen

**Multi-provider AI aggregator** — Claude, GPT-4o, and Gemini answer in parallel, then a judge model synthesizes the best response.

**[→ Live Demo](https://lumen-ten-psi.vercel.app/dashboard)**

---

## Features

- **Parallel streaming** — All selected models stream token-by-token simultaneously
- **Judge synthesis** — Claude Sonnet evaluates and synthesizes the best answer
- **Agreement score** — Measures semantic similarity between model responses (0–100%)
- **Model selector** — Toggle Claude / GPT-4o / Gemini per query
- **Query history** — Saved to Supabase, per-user with auth
- **Auth** — Supabase email/password, anonymous queries also saved

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Custom CSS (no Tailwind) |
| AI — Claude | `@anthropic-ai/sdk` |
| AI — GPT-4o | `openai` |
| AI — Gemini | `@google/generative-ai` |
| Database | Supabase (Postgres + Auth) |
| Streaming | `ReadableStream` + SSE |

## Models Used

| Role | Model |
|------|-------|
| Respondent 1 | `claude-sonnet-4-20250514` |
| Respondent 2 | `gpt-4o` |
| Respondent 3 | `gemini-2.0-flash` |
| Judge | `claude-sonnet-4-20250514` |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/lumen
cd lumen
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com)
- `GOOGLE_API_KEY` — [aistudio.google.com](https://aistudio.google.com)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` — Supabase project settings

### 3. Set up Supabase

1. Create a new Supabase project
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
│   ├── query/route.ts      ← Main SSE stream: runs all models in parallel
│   └── history/route.ts    ← CRUD for query history (auth-gated)
├── dashboard/page.tsx      ← Main UI
├── history/page.tsx        ← History browser
└── layout.tsx              ← Root layout + Navbar

lib/
├── ai/
│   ├── anthropic.ts        ← Claude streaming + judge
│   ├── openai.ts           ← GPT-4o streaming
│   └── gemini.ts           ← Gemini streaming
├── db/
│   └── supabase.ts         ← DB helpers
├── hooks/
│   ├── useQuery.ts         ← Main streaming state hook
│   └── useAuth.ts          ← Supabase auth hook
└── utils/
    └── agreement.ts        ← Text similarity score

components/
├── query/
│   ├── QueryInput.tsx      ← Textarea + model selector
│   └── ModelSelector.tsx   ← Toggle pills
├── results/
│   ├── ModelCard.tsx       ← Per-model streaming card
│   ├── SynthesisPanel.tsx  ← Judge output + agreement
│   └── AgreementBadge.tsx  ← Score visualization
├── layout/
│   └── Navbar.tsx
└── ui/
    └── AuthModal.tsx
```

## Streaming Protocol

The `/api/query` route emits SSE events in this sequence:

```
data: {"type":"response_chunk","modelId":"claude-sonnet-4-20250514","content":"Hello"}
data: {"type":"response_chunk","modelId":"gpt-4o","content":"Hi"}
data: {"type":"response_chunk","modelId":"gemini-2.0-flash","content":"Hey"}
... (interleaved as models stream)
data: {"type":"agreement","agreement":{"score":72,"label":"high","breakdown":[...]}}
data: {"type":"synthesis_chunk","content":"Based on all responses..."}
... (synthesis streams)
data: {"type":"done","queryId":"uuid-..."}
```

All models stream concurrently via `Promise.all`. The `useQuery` hook on the client updates each model's state independently as chunks arrive.

## Agreement Score

Computed using word-overlap (Jaccard similarity) between all model response pairs:

- **High** (60–100%): Models substantially agree
- **Medium** (35–59%): Partial agreement, mixed perspectives  
- **Low** (0–34%): Models diverged significantly

The judge model also independently scores agreement in its synthesis prompt.

---

## Deployment

### Vercel (recommended)

```bash
npx vercel
```

Add all environment variables in the Vercel dashboard. Set `maxDuration = 120` for the query route (already configured).

### Self-hosted

```bash
npm run build
npm start
```
