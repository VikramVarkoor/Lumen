'use client'

import { MODELS } from '@/types'
import type { AgreementScore } from '@/types'

interface AgreementBadgeProps {
  score: AgreementScore
}

const LABEL_CONFIG = {
  low: { color: '#E88080', label: 'Low agreement', icon: '◇' },
  medium: { color: '#E8C880', label: 'Partial agreement', icon: '◈' },
  high: { color: '#80C880', label: 'High agreement', icon: '◆' },
}

export function AgreementBadge({ score }: AgreementBadgeProps) {
  const config = LABEL_CONFIG[score.label]

  return (
    <div className="agreement-container">
      <div className="agreement-header">
        <span className="agreement-icon" style={{ color: config.color }}>
          {config.icon}
        </span>
        <span className="agreement-label">{config.label}</span>
        <span className="agreement-score" style={{ color: config.color }}>
          {score.score}%
        </span>
      </div>

      <div className="agreement-bar-track">
        <div
          className="agreement-bar-fill"
          style={{
            width: `${score.score}%`,
            background: `linear-gradient(90deg, ${config.color}44, ${config.color})`,
          }}
        />
      </div>

      {score.breakdown.length > 0 && (
        <div className="agreement-breakdown">
          {score.breakdown.map((pair, i) => {
            const modelA = MODELS.find((m) => m.id === pair.modelA)
            const modelB = MODELS.find((m) => m.id === pair.modelB)
            return (
              <div key={i} className="breakdown-row">
                <span style={{ color: modelA?.color }}>
                  {modelA?.name.split(' ')[0]}
                </span>
                <span className="breakdown-sep">↔</span>
                <span style={{ color: modelB?.color }}>
                  {modelB?.name.split(' ')[0]}
                </span>
                <span className="breakdown-pct">{pair.similarity}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
