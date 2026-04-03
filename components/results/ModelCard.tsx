'use client'

import { useState } from 'react'
import { MODELS } from '@/types'
import type { ModelId } from '@/types'
import type { ModelState } from '@/lib/hooks/useQuery'

interface ModelCardProps {
  modelId: ModelId
  state: ModelState
  isLoading?: boolean
}

export function ModelCard({ modelId, state, isLoading }: ModelCardProps) {
  const model = MODELS.find((m) => m.id === modelId)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  if (!model) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(state.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasContent = !!state.content && !state.isStreaming
  const showPreview = hasContent && !expanded

  return (
    <div
      className={`model-card ${state.isStreaming ? 'streaming' : ''} ${state.error ? 'error' : ''}`}
      style={{ '--card-color': model.color, '--card-accent': model.accentColor } as React.CSSProperties}
    >
      <div className="card-header">
        <div className="model-badge">
          <span className="badge-dot" />
          <span className="badge-name">{model.name}</span>
        </div>
        <div className="card-header-right">
          {state.durationMs && !state.isStreaming && (
            <span className="card-duration">{(state.durationMs / 1000).toFixed(1)}s</span>
          )}
          {state.isStreaming && <span className="streaming-indicator">streaming</span>}
          {hasContent && (
            <>
              <button className="copy-btn" onClick={handleCopy} title="Copy">
                {copied ? '✓' : '⎘'}
              </button>
              <button className="card-collapse-btn" onClick={() => setExpanded(!expanded)}>
                {expanded ? '↑ collapse' : '↓ expand'}
              </button>
            </>
          )}
        </div>
      </div>

      {showPreview ? (
        <div className="card-preview" onClick={() => setExpanded(true)}>
          {state.content.slice(0, 200).replace(/[#*`]/g, '')}…
        </div>
      ) : (
        <div className={`card-body ${hasContent ? 'card-body-scroll' : ''}`}>
          {state.error ? (
            <p className="card-error">⚠ {state.error}</p>
          ) : (
            <div className="card-content">
              <MarkdownText text={state.content} />
              {state.isStreaming && <span className="cursor-blink" />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MarkdownText({ text }: { text: string }) {
  if (!text) return <p className="card-placeholder">Waiting for response…</p>
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3).split('\n')
          const lang = lines[0]
          const code = lines.slice(1).join('\n').replace(/```$/, '')
          return (
            <pre key={i} className="code-block">
              {lang && <span className="code-lang">{lang}</span>}
              <code>{code}</code>
            </pre>
          )
        }
        return (
          <div key={i} className="prose-content">
            {part.split('\n').map((line, j) => {
              if (line.startsWith('### ')) return <h3 key={j}>{inlineFormat(line.slice(4))}</h3>
              if (line.startsWith('## ')) return <h2 key={j}>{inlineFormat(line.slice(3))}</h2>
              if (line.startsWith('# ')) return <h1 key={j}>{inlineFormat(line.slice(2))}</h1>
              if (line.startsWith('- ') || line.startsWith('* '))
                return <li key={j}>{inlineFormat(line.slice(2))}</li>
              if (/^\d+\.\s/.test(line))
                return <li key={j}>{inlineFormat(line.replace(/^\d+\.\s/, ''))}</li>
              if (!line.trim()) return <br key={j} />
              return <p key={j}>{inlineFormat(line)}</p>
            })}
          </div>
        )
      })}
    </>
  )
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>
    return part
  })
}