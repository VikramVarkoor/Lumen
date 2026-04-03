'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import type { QueryResult } from '@/types'
import { MODELS } from '@/types'

export default function HistoryPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<QueryResult[]>([])
  const [selected, setSelected] = useState<QueryResult | null>(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (!session) return
    setFetching(true)
    fetch('/api/history', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .finally(() => setFetching(false))
  }, [session])

  if (loading || !user) return null

  return (
    <div className="history-layout">
      <aside className="history-sidebar">
        <h2 className="sidebar-title">Query History</h2>
        {fetching ? (
          <div className="sidebar-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="sidebar-empty">No queries yet. Ask something!</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  className={`history-item ${selected?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelected(item)}
                >
                  <span className="history-query">{item.query}</span>
                  <span className="history-meta">
                    <span className="history-models">
                      {item.selectedModels.map((m) => {
                        const model = MODELS.find((x) => x.id === m)
                        return (
                          <span
                            key={m}
                            className="history-dot"
                            style={{ background: model?.color }}
                          />
                        )
                      })}
                    </span>
                    <span className="history-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="history-main">
        {selected ? (
          <HistoryDetail item={selected} />
        ) : (
          <div className="history-empty-state">
            <span className="empty-icon">✦</span>
            <p>Select a query to view results</p>
          </div>
        )}
      </main>
    </div>
  )
}

function HistoryDetail({ item }: { item: QueryResult }) {
  return (
    <div className="history-detail">
      <div className="detail-query">
        <p className="detail-query-label">Query</p>
        <h2>{item.query}</h2>
        <p className="detail-date">{new Date(item.createdAt).toLocaleString()}</p>
      </div>

      <div className="detail-agreement">
        <span
          className="agreement-chip"
          style={{
            color: item.agreementScore.label === 'high'
              ? '#80C880'
              : item.agreementScore.label === 'medium'
              ? '#E8C880'
              : '#E88080',
          }}
        >
          {item.agreementScore.score}% agreement · {item.agreementScore.label}
        </span>
      </div>

      <div className="detail-responses">
        {item.responses.map((r) => {
          const model = MODELS.find((m) => m.id === r.modelId)
          return (
            <div
              key={r.modelId}
              className="detail-card"
              style={{ '--card-color': model?.color } as React.CSSProperties}
            >
              <div className="detail-card-header">
                <span className="detail-model-name">{model?.name}</span>
                {r.durationMs && (
                  <span className="detail-duration">{(r.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
              <div className="detail-card-body">
                {r.error ? (
                  <p className="card-error">⚠ {r.error}</p>
                ) : (
                  <p>{r.content}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {item.synthesis && (
        <div className="detail-synthesis">
          <div className="synthesis-title">
            <span className="synthesis-icon">✦</span>
            <span>Synthesis</span>
          </div>
          <div className="detail-synthesis-body">{item.synthesis}</div>
        </div>
      )}
    </div>
  )
}
