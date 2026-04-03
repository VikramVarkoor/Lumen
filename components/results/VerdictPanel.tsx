'use client'

import { MODELS } from '@/types'
import type { JudgeVerdict, ModelId } from '@/types'

interface VerdictPanelProps {
  verdict: JudgeVerdict
}

export function VerdictPanel({ verdict }: VerdictPanelProps) {
  const bestModel = MODELS.find(m => m.id === verdict.best)
  const sortedScores = [...verdict.scores].sort((a, b) => b.score - a.score)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${bestModel?.color}66, transparent)`,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 14, color: bestModel?.color }}>⚖</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          flex: 1,
        }}>
          Judge's Verdict
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: `${bestModel?.color}15`,
          border: `1px solid ${bestModel?.color}44`,
          borderRadius: 100,
          padding: '4px 12px',
        }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: bestModel?.color,
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: bestModel?.color,
            fontWeight: 500,
          }}>
            {bestModel?.name} wins
          </span>
        </div>
      </div>

      {/* Scores */}
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 0,
      }}>
        {sortedScores.map((s, i) => {
          const model = MODELS.find(m => m.id === s.modelId)
          const isWinner = s.modelId === verdict.best
          const pct = (s.score / 10) * 100

          return (
            <div
              key={s.modelId}
              style={{
                padding: '14px 20px',
                borderBottom: i < sortedScores.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: isWinner ? `${model?.color}06` : 'transparent',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}>
                {/* Rank */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-faint)',
                  width: 16,
                  flexShrink: 0,
                }}>
                  #{i + 1}
                </span>

                {/* Model name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flex: 1,
                }}>
                  <span style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: model?.color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: model?.color,
                    fontWeight: 500,
                  }}>
                    {model?.name}
                  </span>
                  {isWinner && (
                    <span style={{
                      fontSize: 10,
                      background: `${model?.color}22`,
                      color: model?.color,
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      best
                    </span>
                  )}
                </div>

                {/* Score */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: model?.color,
                }}>
                  {s.score}/10
                </span>
              </div>

              {/* Score bar */}
              <div style={{
                height: 3,
                background: 'var(--bg-raised)',
                borderRadius: 100,
                overflow: 'hidden',
                marginBottom: 8,
                marginLeft: 26,
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${model?.color}66, ${model?.color})`,
                  borderRadius: 100,
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>

              {/* Critique */}
              <p style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                margin: 0,
                marginLeft: 26,
                fontStyle: 'italic',
              }}>
                {s.critique}
              </p>
            </div>
          )
        })}
      </div>

      {/* Reasoning footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-raised)',
      }}>
        <p style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-faint)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            marginRight: 8,
          }}>
            Why
          </span>
          {verdict.reasoning}
        </p>
      </div>
    </div>
  )
}