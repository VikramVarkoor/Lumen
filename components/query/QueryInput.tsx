'use client'

import { useState, useRef, useEffect } from 'react'
import { ModelSelector } from './ModelSelector'
import type { ModelId } from '@/types'

interface QueryInputProps {
  onSubmit: (query: string, models: ModelId[]) => void
  isLoading: boolean
}

const DEFAULT_MODELS = new Set<ModelId>([
  'claude-sonnet-4-20250514',
  'gpt-4o',
  'gemini-2.0-flash',
])

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<ModelId>>(DEFAULT_MODELS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [query])

  const toggleModel = (id: ModelId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = () => {
    if (!query.trim() || isLoading) return
    onSubmit(query.trim(), [...selected])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="query-input-container">
      <div className="query-box">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything — all models answer in parallel…"
          className="query-textarea"
          rows={1}
          disabled={isLoading}
        />
        <div className="query-footer">
          <ModelSelector selected={selected} onChange={toggleModel} disabled={isLoading} />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading || selected.size === 0}
            className="submit-btn"
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
              </span>
            ) : (
              <>
                <span>Ask</span>
                <kbd>⌘↵</kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
