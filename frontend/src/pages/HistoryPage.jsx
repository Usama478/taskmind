import { useEffect, useMemo, useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { getTaskHistory } from '../services/api'
import { formatPKT, formatPKTDate } from '../utils/time'

const ACTION_STYLES = {
  CREATED: { label: 'Created', color: '#2ED573', bg: 'rgba(46, 213, 115, 0.12)' },
  UPDATED: { label: 'Updated', color: '#FFA502', bg: 'rgba(255, 165, 2, 0.12)' },
  COMPLETED: { label: 'Completed', color: '#C4B5FD', bg: 'rgba(147, 112, 219, 0.16)' },
  DELETED: { label: 'Deleted', color: '#FF4757', bg: 'rgba(255, 71, 87, 0.12)' },
}

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] || {
    label: action,
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.14)',
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {style.label}
    </span>
  )
}

function groupByDate(entries) {
  const groups = new Map()
  for (const entry of entries) {
    const dayKey = formatPKTDate(entry.created_at)
    if (!groups.has(dayKey)) {
      groups.set(dayKey, [])
    }
    groups.get(dayKey).push(entry)
  }
  return Array.from(groups.entries())
}

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      try {
        const data = await getTaskHistory()
        if (cancelled) return
        setHistory(data.history || [])
        setTotal(data.total || 0)
      } catch {
        if (!cancelled) setError('Could not load task history. Please try again.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredHistory = useMemo(() => {
    if (filter === 'ALL') return history
    return history.filter((entry) => entry.action === filter)
  }, [filter, history])

  const groupedHistory = useMemo(() => groupByDate(filteredHistory), [filteredHistory])

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#08080F]/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CBF]/15 text-[#C4B5FD]">
            <Activity size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Task history</h1>
            <p className="text-xs text-gray-500">
              {total} {total === 1 ? 'event' : 'events'} · times shown in PKT
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {['ALL', 'CREATED', 'UPDATED', 'COMPLETED', 'DELETED'].map((option) => {
              const isActive = filter === option
              const label = option === 'ALL' ? 'All' : ACTION_STYLES[option].label
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? 'border-[#7C5CBF] bg-[#7C5CBF]/15 text-white'
                      : 'border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin text-[#9370DB]" />
              Loading history...
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : filteredHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <p className="text-sm text-gray-400">
                No history yet. Once you start creating or updating tasks, you'll see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedHistory.map(([day, entries]) => (
                <section key={day}>
                  <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                    {day}
                  </h2>
                  <ul className="space-y-3">
                    {entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/15"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <ActionBadge action={entry.action} />
                              <p className="truncate text-sm font-semibold text-white">
                                {entry.task_title}
                              </p>
                            </div>
                            {entry.details && (
                              <p className="mt-2 text-sm text-gray-400">{entry.details}</p>
                            )}
                          </div>
                          <span className="whitespace-nowrap text-xs text-gray-500">
                            {formatPKT(entry.created_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
