import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Crown,
  Loader2,
  Search,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import {
  addProjectMember,
  getProjectMembers,
  lookupUserByEmail,
  removeProjectMember,
} from '../services/api'

function Avatar({ user, size = 'md' }) {
  const dim = size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name}
        className={`${dim} rounded-full border border-white/10 object-cover`}
      />
    )
  }
  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] font-bold text-white`}
    >
      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
    </div>
  )
}

function notifyMembersChanged(projectId) {
  window.dispatchEvent(
    new CustomEvent('project-members-changed', {
      detail: { projectId },
    }),
  )
}

export default function TeamPage() {
  const { user } = useAuth()
  const { currentProject, projects, isLoading: projectsLoading } = useProject()

  const [members, setMembers] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [lookup, setLookup] = useState({ state: 'idle', user: null, error: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [feedback, setFeedback] = useState('')

  const projectId = currentProject?.id
  const isOwner = currentProject?.role === 'OWNER'

  const loadMembers = useCallback(async () => {
    if (!projectId) return
    setIsLoadingMembers(true)
    setError('')
    try {
      const list = await getProjectMembers(projectId)
      setMembers(list)
    } catch (err) {
      console.error('Failed to load members:', err)
      setError('Could not load team. Please try again.')
    } finally {
      setIsLoadingMembers(false)
    }
  }, [projectId])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  useEffect(() => {
    setFeedback('')
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setLookup({ state: 'idle', user: null, error: '' })
      return
    }
    setLookup({ state: 'loading', user: null, error: '' })
    const t = setTimeout(async () => {
      try {
        const res = await lookupUserByEmail(trimmed)
        if (res.found) {
          setLookup({ state: 'found', user: res.user, error: '' })
        } else {
          setLookup({
            state: 'not_found',
            user: null,
            error: 'No registered user with that email.',
          })
        }
      } catch {
        setLookup({
          state: 'error',
          user: null,
          error: 'Could not look up that email.',
        })
      }
    }, 350)
    return () => clearTimeout(t)
  }, [email])

  const handleAdd = async () => {
    if (!projectId || lookup.state !== 'found' || !lookup.user) return
    setIsAdding(true)
    setFeedback('')
    try {
      await addProjectMember(projectId, lookup.user.email)
      setFeedback(`Added ${lookup.user.name} to ${currentProject.name}.`)
      setEmail('')
      setLookup({ state: 'idle', user: null, error: '' })
      await loadMembers()
      notifyMembersChanged(projectId)
    } catch (err) {
      setFeedback(
        err.response?.data?.detail || 'Could not add that user. Try again.',
      )
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (member) => {
    if (!projectId) return
    if (!window.confirm(`Remove ${member.name} from this project?`)) return
    try {
      await removeProjectMember(projectId, member.user_id)
      await loadMembers()
      notifyMembersChanged(projectId)
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not remove member.')
    }
  }

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === 'OWNER' && b.role !== 'OWNER') return -1
      if (a.role !== 'OWNER' && b.role === 'OWNER') return 1
      return a.name.localeCompare(b.name)
    })
  }, [members])

  if (projectsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080F] text-gray-400">
        <Loader2 size={18} className="animate-spin text-[#9370DB]" />
      </div>
    )
  }

  if (!currentProject || projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#08080F]/80 px-6 py-4 backdrop-blur-xl">
          <h1 className="text-xl font-bold">Team</h1>
        </header>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <UsersIcon size={32} className="mx-auto mb-4 text-gray-500" />
          <p className="text-sm text-gray-400">
            Create or open a project from the sidebar to manage its team.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#08080F]/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CBF]/15 text-[#C4B5FD]">
            <UsersIcon size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">Team</h1>
            <p className="truncate text-xs text-gray-500">
              {currentProject.name} · {members.length}{' '}
              {members.length === 1 ? 'member' : 'members'}
              {isOwner ? ' · You are the owner' : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {isOwner ? (
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-[#C4B5FD]" />
              <h2 className="text-base font-semibold">Invite a teammate</h2>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Enter the email of someone who has already signed in to TaskMind.
              They'll instantly get access to <strong>{currentProject.name}</strong>.
            </p>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-9 pr-10 text-sm text-white outline-none transition focus:border-[#7C5CBF] focus:bg-white/[0.05]"
              />
              {lookup.state === 'loading' && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-500"
                />
              )}
            </div>

            {lookup.state === 'found' && lookup.user && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={lookup.user} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {lookup.user.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {lookup.user.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#7C5CBF]/30 transition hover:opacity-90 disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  {isAdding ? 'Adding...' : 'Add to project'}
                </button>
              </div>
            )}
            {lookup.state === 'not_found' && (
              <p className="mt-3 text-xs text-amber-400">
                {lookup.error} They need to sign in once before you can invite them.
              </p>
            )}
            {lookup.state === 'error' && (
              <p className="mt-3 text-xs text-red-400">{lookup.error}</p>
            )}
            {feedback && (
              <p className="mt-3 text-xs text-emerald-300">{feedback}</p>
            )}
          </section>
        ) : (
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-sm text-gray-400">
              You're a member of <strong>{currentProject.name}</strong>. Only the
              project owner can invite or remove teammates.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Members</h2>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-gray-400">
              {members.length}{' '}
              {members.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          {isLoadingMembers ? (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin text-[#9370DB]" />
              Loading members...
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : sortedMembers.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet.</p>
          ) : (
            <ul className="space-y-3">
              {sortedMembers.map((member) => {
                const isMe = member.user_id === user?.id
                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/15"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar user={member} size="lg" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-white">
                          <span className="truncate">{member.name}</span>
                          {member.role === 'OWNER' && (
                            <span className="flex items-center gap-1 rounded-full bg-[#7C5CBF]/20 px-2 py-0.5 text-[10px] font-semibold text-[#C4B5FD]">
                              <Crown size={10} /> Owner
                            </span>
                          )}
                          {isMe && member.role !== 'OWNER' && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              You
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {isOwner && member.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(member)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
