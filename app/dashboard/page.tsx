'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@/lib/hooks/useQuery'
import { QueryInput } from '@/components/query/QueryInput'
import { ModelCard } from '@/components/results/ModelCard'
import { SynthesisPanel } from '@/components/results/SynthesisPanel'
import { DivergenceCard } from '@/components/results/DivergenceCard'
import { VerdictPanel } from '@/components/results/VerdictPanel'
import type { ModelId } from '@/types'

const PROMPT_TEMPLATES = [
  { label: '🔥 Debate this', prompt: 'What are the strongest arguments both for and against universal basic income?' },
  { label: '🧠 Explain simply', prompt: "Explain how large language models work, as if I'm a curious 15-year-old." },
  { label: '🚀 Best stack', prompt: 'What is the best tech stack to build a SaaS product in 2025, and why?' },
  { label: '🎯 Predict', prompt: 'What will the job market look like in 10 years due to AI? Be specific.' },
  { label: '⚖️ Compare', prompt: 'Python vs JavaScript for backend — which should a beginner learn first and why?' },
  { label: '💡 Contrarian', prompt: 'What is a widely held belief about productivity that is actually wrong?' },
]

const ALL_MODELS: ModelId[] = ['claude-sonnet-4-20250514', 'gpt-4o', 'gemini-2.0-flash']

const MODEL_LOGOS = [
  { label: 'Llama', color: '#D4956A', borderColor: '#D4956A44' },
  { label: 'Qwen', color: '#74AA9C', borderColor: '#74AA9C44' },
  { label: 'Kimi', color: '#7B9FE0', borderColor: '#7B9FE044' },
]

export default function DashboardPage() {
  const {
    isLoading,
    modelStates,
    synthesis,
    isSynthesizing,
    agreementScore,
    verdict,
    queryId,
    error,
    runQuery,
    reset,
  } = useQuery()

  const hasResults = Object.keys(modelStates).length > 0
  const synthScrolled = useRef(false)

  useEffect(() => {
    if (synthesis && synthesis.length > 80 && !synthScrolled.current) {
      synthScrolled.current = true
      const el = document.getElementById('synthesis-panel')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [synthesis])

  useEffect(() => {
    if (isLoading) synthScrolled.current = false
  }, [isLoading])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const textarea = document.querySelector('.query-textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <main className="dashboard">
      <div className={`dashboard-hero ${hasResults ? 'hero-compact' : ''}`}>
        {!hasResults && (
          <>
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
          </>
        )}

        {!hasResults && (
          <div className="hero-text animate-slide-up">
            <div className="model-logos">
              {MODEL_LOGOS.map((m) => (
                <div className="model-logo-item" key={m.label}>
                  <div
                    className="model-logo-circle"
                    style={{
                      color: m.color,
                      borderColor: m.borderColor,
                      background: `${m.color}0a`,
                    }}
                  >
                    {m.label[0]}
                  </div>
                  <span className="model-logo-label">{m.label}</span>
                </div>
              ))}
            </div>

            <div className="hero-connector">
              <div className="connector-line" />
              <div className="connector-dot" />
              <div className="connector-line" />
            </div>

            <h1 className="hero-title">
              Ask once.<br />Hear from all.
            </h1>
            <p className="hero-subtitle">
              Three AI models answer in parallel — then a judge synthesizes the best response.
            </p>
          </div>
        )}

        <QueryInput onSubmit={runQuery} isLoading={isLoading} />

        <div className="prompt-templates">
          {PROMPT_TEMPLATES.map((t) => (
            <button
              key={t.label}
              className="template-btn"
              onClick={() => runQuery(t.prompt, ALL_MODELS)}
              disabled={isLoading}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="global-error">
          <span>⚠</span> {error}
        </div>
      )}

      {hasResults && (
        <div className="results-layout">
          <div className="model-grid">
            {(Object.keys(modelStates) as ModelId[]).map((modelId, i) => (
              <div
                key={modelId}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <ModelCard
                  modelId={modelId}
                  state={modelStates[modelId]}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </div>

          {agreementScore && !isLoading && (
            <div className="animate-slide-up-delay-1">
              <DivergenceCard
                modelStates={modelStates}
                agreementScore={agreementScore}
              />
            </div>
          )}

          {verdict && !isLoading && (
            <div className="animate-slide-up-delay-1">
              <VerdictPanel verdict={verdict} />
            </div>
          )}

          <div className={synthesis || isSynthesizing ? 'animate-slide-up-delay-2' : ''}>
            <SynthesisPanel
              synthesis={synthesis}
              isSynthesizing={isSynthesizing}
              agreementScore={agreementScore}
              queryId={queryId}
            />
          </div>
        </div>
      )}

      <div className="kbd-hint">
        <kbd>⌘</kbd><kbd>K</kbd> focus
      </div>
    </main>
  )
}