'use client'

import { useState } from 'react'
import { AgreementBadge } from './AgreementBadge'
import type { AgreementScore } from '@/types'

interface SynthesisPanelProps {
  synthesis: string
  isSynthesizing: boolean
  agreementScore: AgreementScore | null
  queryId: string | null
}

function cleanSynthesis(raw: string): string {
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*\{[\s\S]*?"synthesis"\s*:\s*["']?/m, '')
    .replace(/["']?\s*,?\s*"agreementScore"[\s\S]*/m, '')
    .replace(/^\s*[",]\s*/m, '')
    .trim()
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

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />
    if (line.startsWith('### ')) return <h3 key={i}>{inlineFormat(line.slice(4))}</h3>
    if (line.startsWith('## ')) return <h2 key={i}>{inlineFormat(line.slice(3))}</h2>
    if (line.startsWith('# ')) return <h1 key={i}>{inlineFormat(line.slice(2))}</h1>
    if (line.startsWith('- ') || line.startsWith('* '))
      return <li key={i}>{inlineFormat(line.slice(2))}</li>
    if (/^\d+\.\s/.test(line))
      return <li key={i}>{inlineFormat(line.replace(/^\d+\.\s/, ''))}</li>
    return <p key={i}>{inlineFormat(line)}</p>
  })
}

export function SynthesisPanel({
  synthesis,
  isSynthesizing,
  agreementScore,
  queryId,
}: SynthesisPanelProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  if (!synthesis && !isSynthesizing && !agreementScore) return null

  const cleaned = cleanSynthesis(synthesis)

  const handleCopy = () => {
    navigator.clipboard.writeText(cleaned)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (queryId) {
      const url = `${window.location.origin}/history?id=${queryId}`
      navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const handleExport = () => {
    const blob = new Blob([cleaned], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumen-synthesis-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="synthesis-panel" id="synthesis-panel">
      <div className="synthesis-header">
        <div className="synthesis-title">
          <span className="synthesis-icon">✦</span>
          <span>Synthesis</span>
          {isSynthesizing && <span className="synth-streaming">generating…</span>}
        </div>
        <div className="synthesis-header-right">
          {agreementScore && <AgreementBadge score={agreementScore} />}
          {!isSynthesizing && cleaned && (
            <button className="copy-btn" onClick={handleCopy} title="Copy synthesis">
              {copied ? '✓' : '⎘'}
            </button>
          )}
        </div>
      </div>

      <div className="synthesis-body">
        {synthesis ? (
          <div className="synthesis-content">
            {renderMarkdown(cleaned)}
            {isSynthesizing && <span className="cursor-blink" />}
          </div>
        ) : (
          <div className="synthesis-waiting">
            <div className="thinking-dots">
              <span /><span /><span />
            </div>
            <span>Synthesizing responses…</span>
          </div>
        )}
      </div>

      {!isSynthesizing && cleaned && (
        <div className="synthesis-actions">
          <div className="synthesis-actions-left">
            {queryId && (
              <button className={`action-btn ${shared ? 'success' : ''}`} onClick={handleShare}>
                {shared ? '✓ Link copied!' : '↗ Share link'}
              </button>
            )}
            <button className="action-btn" onClick={handleExport}>
              ↓ Export .md
            </button>
          </div>
          {queryId && (
            <a href={`/history?id=${queryId}`} className="history-link">
              View in history →
            </a>
          )}
        </div>
      )}
    </div>
  )
}