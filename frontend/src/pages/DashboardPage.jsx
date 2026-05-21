import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  FolderPlus,
  Loader2,
  Plus,
  Sparkles,
  Users as UsersIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import { getAllTasks, getProjectMembers } from '../services/api'
import CreateFirstProjectModal from '../components/projects/CreateFirstProjectModal'
import ProjectModal from '../components/projects/ProjectModal'

const ACCENT_PALETTE = [
  { from: '#9370DB', to: '#5B3FBE', glow: '#7C5CBF' },
  { from: '#3B82F6', to: '#1E40AF', glow: '#2563EB' },
  { from: '#10B981', to: '#047857', glow: '#059669' },
  { from: '#F59E0B', to: '#B45309', glow: '#D97706' },
  { from: '#EC4899', to: '#9D174D', glow: '#DB2777' },
  { from: '#06B6D4', to: '#0E7490', glow: '#0891B2' },
]

function accentFor(projectId) {
  if (!projectId) return ACCENT_PALETTE[0]
  return ACCENT_PALETTE[projectId % ACCENT_PALETTE.length]
}

function computeTaskStats(tasks) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'DONE').length
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const todo = tasks.filter((t) => t.status === 'TODO').length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = tasks.filter((t) => {
    if (!t.deadline || t.status === 'DONE') return false
    const d = new Date(t.deadline)
    d.setHours(0, 0, 0, 0)
    return d < today
  }).length

  const progress = total ? Math.round((done / total) * 100) : 0
  return { total, done, inProgress, todo, overdue, progress }
}

function StatBadge({ icon: Icon, label, value, tone = 'default' }) {
  const toneStyles = {
    default: 'bg-white/[0.05] text-gray-300',
    danger: 'bg-red-500/10 text-red-300',
    success: 'bg-emerald-500/10 text-emerald-300',
    info: 'bg-blue-500/10 text-blue-300',
  }
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${toneStyles[tone]}`}
    >
      <Icon size={12} />
      <span>{value}</span>
      <span className="text-[10px] opacity-70">{label}</span>
    </div>
  )
}

function ProjectCard({ project, stats, memberCount, onOpen }) {
  const accent = accentFor(project.id)
  const isOwner = project.role === 'OWNER'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl"
      style={{ boxShadow: `0 0 0 1px transparent` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${accent.from} 0%, ${accent.to} 100%)`,
        }}
      />

      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
            boxShadow: `0 10px 30px -10px ${accent.glow}80`,
          }}
        >
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">
              {project.name}
            </h3>
            {isOwner && (
              <span title="You own this project">
                <Crown size={13} className="shrink-0 text-[#C4B5FD]" />
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-gray-500">
            {isOwner ? 'Owner' : 'Member'}
          </p>
        </div>
      </div>

      <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-gray-400">
        {project.description?.trim() || 'No description yet. Open the workspace to add details.'}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <StatBadge icon={Sparkles} label="tasks" value={stats.total} />
        <StatBadge icon={CheckCircle2} label="done" value={stats.done} tone="success" />
        {stats.inProgress > 0 && (
          <StatBadge icon={Loader2} label="active" value={stats.inProgress} tone="info" />
        )}
        {stats.overdue > 0 && (
          <StatBadge icon={AlertTriangle} label="overdue" value={stats.overdue} tone="danger" />
        )}
      </div>

      <div className="mt-auto">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-gray-500">{stats.progress}% complete</span>
          <span className="inline-flex items-center gap-1 text-gray-500">
            <UsersIcon size={11} />
            {memberCount}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${stats.progress}%`,
              background: `linear-gradient(90deg, ${accent.from} 0%, ${accent.to} 100%)`,
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}
          </span>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold text-white opacity-90 transition group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
            }}
          >
            Open →
          </span>
        </div>
      </div>
    </button>
  )
}

function CreateProjectCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition hover:border-[#7C5CBF]/60 hover:bg-white/[0.04]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-gray-400 transition group-hover:border-[#7C5CBF]/40 group-hover:text-[#C4B5FD]">
        <Plus size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">New project</p>
        <p className="mt-1 text-xs text-gray-500">
          Spin up a fresh board with its own tasks & AI chat
        </p>
      </div>
    </button>
  )
}

function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    projects,
    setCurrentProject,
    createProject,
    isLoading: projectsLoading,
  } = useProject()
  const [projectStats, setProjectStats] = useState({})
  const [memberCounts, setMemberCounts] = useState({})
  const [loadingStats, setLoadingStats] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    if (projects.length === 0) {
      setProjectStats({})
      setMemberCounts({})
      setLoadingStats(false)
      return
    }
    let cancelled = false
    async function loadStats() {
      setLoadingStats(true)
      try {
        const results = await Promise.all(
          projects.map(async (p) => {
            const [tasks, members] = await Promise.all([
              getAllTasks(p.id).catch(() => []),
              getProjectMembers(p.id).catch(() => []),
            ])
            return { id: p.id, stats: computeTaskStats(tasks), members: members.length }
          }),
        )
        if (cancelled) return
        const nextStats = {}
        const nextMembers = {}
        results.forEach((r) => {
          nextStats[r.id] = r.stats
          nextMembers[r.id] = r.members
        })
        setProjectStats(nextStats)
        setMemberCounts(nextMembers)
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }
    loadStats()
    return () => {
      cancelled = true
    }
  }, [projects])

  const totals = useMemo(() => {
    const all = Object.values(projectStats)
    if (all.length === 0) {
      return { total: 0, done: 0, inProgress: 0, overdue: 0 }
    }
    return all.reduce(
      (acc, s) => ({
        total: acc.total + s.total,
        done: acc.done + s.done,
        inProgress: acc.inProgress + s.inProgress,
        overdue: acc.overdue + s.overdue,
      }),
      { total: 0, done: 0, inProgress: 0, overdue: 0 },
    )
  }, [projectStats])

  const openProject = (project) => {
    setCurrentProject(project)
    navigate('/workspace')
  }

  if (projectsLoading) {
    return (
      <div className="flex h-screen flex-1 items-center justify-center bg-[#08080F] text-gray-400">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
          <Loader2 size={18} className="animate-spin text-[#9370DB]" />
          <span className="text-sm">Loading your dashboard...</span>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080F]">
        <CreateFirstProjectModal />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-[#08080F]">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9370DB]">
              Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Here's an overview of your boards. Pick one to dive in.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <FolderPlus size={16} />
              New project
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Projects" value={projects.length} accent="#C4B5FD" />
          <StatTile label="Total tasks" value={totals.total} accent="#FFFFFF" />
          <StatTile label="In progress" value={totals.inProgress} accent="#60A5FA" />
          <StatTile label="Overdue" value={totals.overdue} accent={totals.overdue ? '#F87171' : '#9CA3AF'} />
        </div>

        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Your projects</h2>
          {loadingStats && (
            <span className="inline-flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={12} className="animate-spin" />
              Syncing stats...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 pb-12 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={
                projectStats[project.id] || {
                  total: 0,
                  done: 0,
                  inProgress: 0,
                  todo: 0,
                  overdue: 0,
                  progress: 0,
                }
              }
              memberCount={memberCounts[project.id] ?? 1}
              onOpen={() => openProject(project)}
            />
          ))}
          <CreateProjectCard onClick={() => setShowNewModal(true)} />
        </div>
      </div>

      {showNewModal && (
        <ProjectModal
          title="New project"
          submitLabel="Create"
          onClose={() => setShowNewModal(false)}
          onSubmit={async (name, description) => {
            const created = await createProject(name, description)
            setShowNewModal(false)
            if (created) navigate('/workspace')
          }}
        />
      )}
    </div>
  )
}
