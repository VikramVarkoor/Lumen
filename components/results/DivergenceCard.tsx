'use client'

import { MODELS } from '@/types'
import type { ModelId, AgreementScore } from '@/types'
import type { ModelState } from '@/lib/hooks/useQuery'

interface DivergenceCardProps {
  modelStates: Record<ModelId, ModelState>
  agreementScore: AgreementScore
}

export function DivergenceCard({ modelStates, agreementScore }: DivergenceCardProps) {
  if (!agreementScore || agreementScore.breakdown.length === 0) return null

  const mostDivergent = [...agreementScore.breakdown].sort((a, b) => a.similarity - b.similarity)[0]
  const mostAligned = [...agreementScore.breakdown].sort((a, b) => b.similarity - a.similarity)[0]
  const modelA = MODELS.find(m => m.id === mostDivergent.modelA)
  const modelB = MODELS.find(m => m.id === mostDivergent.modelB)

  const getSnippet = (modelId: ModelId) => {
    const content = modelStates[modelId]?.content || ''
    const clean = content.replace(/[#*`\-]/g, '').trim()
    const sentence = clean.split(/[.!?]/)[0]
    return (sentence.length > 140 ? sentence.slice(0, 140) + '…' : sentence + '.').trim()
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span style={{ color: '#E88080', fontSize: 14 }}>⟡</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          flex: 1,
        }}>
          Where they diverged most
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: '#E88080',
          fontWeight: 500,
        }}>
          {mostDivergent.similarity}% overlap
        </span>
      </div>

      {/* Quotes side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'stretch',
      }}>
        {/* Model A */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 500,
            color: modelA?.color,
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: modelA?.color,
              flexShrink: 0,
              display: 'inline-block',
            }} />
            {modelA?.name}
          </div>
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{getSnippet(mostDivergent.modelA)}"
          </p>
        </div>

        {/* VS divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          borderLeft: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-faint)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>
          vs
        </div>

        {/* Model B */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 500,
            color: modelB?.color,
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: modelB?.color,
              flexShrink: 0,
              display: 'inline-block',
            }} />
            {modelB?.name}
          </div>
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{getSnippet(mostDivergent.modelB)}"
          </p>
        </div>
      </div>

      {/* Footer */}
      {mostAligned && mostAligned.similarity !== mostDivergent.similarity && (
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-faint)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>Most aligned:</span>
          <span style={{ color: MODELS.find(m => m.id === mostAligned.modelA)?.color }}>
            {MODELS.find(m => m.id === mostAligned.modelA)?.name}
          </span>
          <span>&</span>
          <span style={{ color: MODELS.find(m => m.id === mostAligned.modelB)?.color }}>
            {MODELS.find(m => m.id === mostAligned.modelB)?.name}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#80C880', marginLeft: 4 }}>
            {mostAligned.similarity}% overlap
          </span>
        </div>
      )}
    </div>
  )
}