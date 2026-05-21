import { useEffect, useState } from 'react'
import {
  Crown,
  FolderKanban,
  ListChecks,
  Mail,
  PencilLine,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getAssignedTasks, getProjects } from '../services/api'

const PRIORITY_COLOR = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
}

function StatusPill({ status }) {
  const styles = {
    TODO: { bg: 'rgba(156, 163, 175, 0.18)', color: '#9CA3AF', label: 'To do' },
    IN_PROGRESS: { bg: 'rgba(59, 130, 246, 0.18)', color: '#3B82F6', label: 'In progress' },
    DONE: { bg: 'rgba(46, 213, 115, 0.18)', color: '#10B981', label: 'Done' },
  }
  const s = styles[status] || styles.TODO
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className="mt-2 text-2xl font-bold"
        style={{ color: accent || 'white' }}
      >
        {value}
      </p>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children, action }) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C5CBF]/15 text-[#C4B5FD]">
            <Icon size={16} />
          </div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function ProfilePage() {
  const { user, saveProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')

  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getProjects(), getAssignedTasks()])
      .then(([projectList, assigned]) => {
        if (cancelled) return
        setProjects(projectList)
        setTasks(assigned.tasks || [])
      })
      .catch((err) => console.error('Failed to load profile data:', err))
      .finally(() => {
        if (cancelled) return
        setIsLoadingProjects(false)
        setIsLoadingTasks(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setStatus('')

    try {
      await saveProfile({ name })
      setStatus('Profile updated.')
    } catch {
      setStatus('Could not update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const ownedProjects = projects.filter((p) => p.role === 'OWNER')
  const memberProjects = projects.filter((p) => p.role !== 'OWNER')
  const openTasks = tasks.filter((t) => t.status !== 'DONE').length

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#08080F]/80 px-6 py-4 backdrop-blur-xl">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-sm text-gray-500">Your account, projects, and assigned tasks.</p>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7C5CBF]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#3B82F6]/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-24 w-24 rounded-2xl border border-white/15 object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] text-3xl font-bold shadow-xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#08080F] bg-emerald-500 text-white">
                <UserRound size={12} />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold">{user?.name || 'You'}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} />
                <span className="truncate">{user?.email}</span>
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
                <StatTile label="Projects" value={projects.length} accent="#C4B5FD" />
                <StatTile label="Open tasks" value={openTasks} accent="#FBBF24" />
                <StatTile label="Done" value={tasks.length - openTasks} accent="#34D399" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SectionCard icon={PencilLine} title="Edit profile">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Display name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#7C5CBF] focus:bg-white/[0.05]"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </span>
                <input
                  value={user?.email || ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-gray-400 outline-none"
                />
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7C5CBF]/30 transition hover:opacity-90 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
                {status && <p className="text-sm text-gray-400">{status}</p>}
              </div>
            </form>
          </SectionCard>

          <SectionCard icon={FolderKanban} title="Projects">
            {isLoadingProjects ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-gray-400">
                You don't have any projects yet.
              </p>
            ) : (
              <div className="space-y-5">
                {ownedProjects.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                      Owned by you
                    </p>
                    <ul className="space-y-2">
                      {ownedProjects.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            {p.description && (
                              <p className="truncate text-xs text-gray-500">
                                {p.description}
                              </p>
                            )}
                          </div>
                          <span className="flex items-center gap-1 rounded-full bg-[#7C5CBF]/20 px-2 py-0.5 text-[10px] font-semibold text-[#C4B5FD]">
                            <Crown size={10} /> Owner
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {memberProjects.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                      Where you're a member
                    </p>
                    <ul className="space-y-2">
                      {memberProjects.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            {p.description && (
                              <p className="truncate text-xs text-gray-500">
                                {p.description}
                              </p>
                            )}
                          </div>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Member
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="mt-6">
          <SectionCard icon={ListChecks} title="Tasks assigned to you">
            {isLoadingTasks ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-gray-400">
                No tasks assigned to you yet. Once a project owner assigns one,
                it'll show up here.
              </p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                    style={{
                      borderLeft: `3px solid ${
                        task.status === 'DONE'
                          ? '#6B7280'
                          : PRIORITY_COLOR[task.priority] || '#6B7280'
                      }`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-semibold ${
                            task.status === 'DONE' ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {task.project_name || 'Project'}
                          {task.deadline && ` · Due ${task.deadline}`}
                        </p>
                      </div>
                      <StatusPill status={task.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
