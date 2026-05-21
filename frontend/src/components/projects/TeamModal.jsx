import { useEffect, useState } from 'react'
import { Crown, Loader2, Search, Trash2, UserPlus } from 'lucide-react'
import { colors } from '../../constants/colors'
import {
  addProjectMember,
  getProjectMembers,
  lookupUserByEmail,
  removeProjectMember,
} from '../../services/api'

function Avatar({ user }) {
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name}
        className="h-9 w-9 rounded-full border border-[#2E2E4E] object-cover"
      />
    )
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C5CBF] text-sm font-bold text-white">
      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
    </div>
  )
}

export default function TeamModal({ project, currentUserId, onClose }) {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [lookup, setLookup] = useState({ state: 'idle', user: null, error: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [feedback, setFeedback] = useState('')

  const isOwner = project?.role === 'OWNER'

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const list = await getProjectMembers(project.id)
      setMembers(list)
    } catch (err) {
      console.error('Failed to load members:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!project?.id) return
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  // Debounced lookup as the user types an email.
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

  const notifyMembersChanged = () => {
    window.dispatchEvent(
      new CustomEvent('project-members-changed', {
        detail: { projectId: project.id },
      }),
    )
  }

  const handleAdd = async () => {
    if (lookup.state !== 'found' || !lookup.user) return
    setIsAdding(true)
    setFeedback('')
    try {
      await addProjectMember(project.id, lookup.user.email)
      setFeedback(`Added ${lookup.user.name} to ${project.name}.`)
      setEmail('')
      setLookup({ state: 'idle', user: null, error: '' })
      await loadMembers()
      notifyMembersChanged()
    } catch (err) {
      setFeedback(
        err.response?.data?.detail || 'Could not add that user. Try again.',
      )
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this project?`)) return
    try {
      await removeProjectMember(project.id, member.user_id)
      await loadMembers()
      notifyMembersChanged()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not remove member.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#2E2E4E] shadow-2xl"
        style={{ backgroundColor: colors.headerBackground }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#2E2E4E] px-6 py-4">
          <h2 className="text-lg font-bold text-white">Team</h2>
          <p className="mt-1 text-xs text-gray-400">
            {project?.name} · {members.length}{' '}
            {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>

        {isOwner && (
          <div className="border-b border-[#2E2E4E] px-6 py-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Invite a teammate
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
                className="w-full rounded-lg border border-[#2E2E4E] bg-[#16162A] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#7C5CBF]"
              />
              {lookup.state === 'loading' && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-500"
                />
              )}
            </div>

            {lookup.state === 'found' && lookup.user && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#2E2E4E] bg-[#16162A] p-3">
                <div className="flex items-center gap-3">
                  <Avatar user={lookup.user} />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {lookup.user.name}
                    </p>
                    <p className="text-xs text-gray-400">{lookup.user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="flex items-center gap-1 rounded-lg bg-[#7C5CBF] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#6b4da8] disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
              </div>
            )}
            {lookup.state === 'not_found' && (
              <p className="mt-2 text-xs text-amber-400">
                {lookup.error} They need to sign in once before you can invite them.
              </p>
            )}
            {lookup.state === 'error' && (
              <p className="mt-2 text-xs text-red-400">{lookup.error}</p>
            )}
            {feedback && (
              <p className="mt-2 text-xs text-gray-300">{feedback}</p>
            )}
          </div>
        )}

        <div className="max-h-80 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet.</p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-[#2E2E4E] bg-[#16162A] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={member} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-white">
                        <span className="truncate">{member.name}</span>
                        {member.role === 'OWNER' && (
                          <span className="flex items-center gap-1 rounded-full bg-[#7C5CBF]/20 px-2 py-0.5 text-[10px] font-semibold text-[#9370DB]">
                            <Crown size={10} /> Owner
                          </span>
                        )}
                        {member.user_id === currentUserId &&
                          member.role !== 'OWNER' && (
                            <span className="rounded-full bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
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
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#2E2E4E] px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#2E2E4E] px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
