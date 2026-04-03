'use client'

import { MODELS } from '@/types'
import type { ModelId } from '@/types'

interface ModelSelectorProps {
  selected: Set<ModelId>
  onChange: (id: ModelId) => void
  disabled?: boolean
}

export function ModelSelector({ selected, onChange, disabled }: ModelSelectorProps) {
  return (
    <div className="model-selector">
      <p className="selector-label">Models</p>
      <div className="model-pills">
        {MODELS.map((model) => {
          const isOn = selected.has(model.id)
          return (
            <button
              key={model.id}
              onClick={() => onChange(model.id)}
              disabled={disabled}
              className={`model-pill ${isOn ? 'active' : ''}`}
              style={
                isOn
                  ? {
                      '--pill-color': model.color,
                      '--pill-accent': model.accentColor,
                    } as React.CSSProperties
                  : {}
              }
            >
              <span className="pill-dot" />
              {model.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
