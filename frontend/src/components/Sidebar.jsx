import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronsUpDown,
  Crown,
  FolderKanban,
  FolderPlus,
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import ProjectModal from './projects/ProjectModal'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
]

function NavItem({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-full px-4 py-3 text-[15px] transition-all ${
        active
          ? 'bg-white/[0.08] font-semibold text-white'
          : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.4 : 1.9}
        className={active ? 'text-[#C4B5FD]' : 'text-gray-300 group-hover:text-white'}
      />
      <span className="hidden xl:inline">{label}</span>
    </Link>
  )
}

function ProjectsSection() {
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    renameProject,
    deleteProject,
  } = useProject()
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const wrapperRef = useRef(null)

  const isOwner = currentProject?.role === 'OWNER'

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleDelete = async () => {
    if (!currentProject) return
    if (
      !window.confirm(
        `This will delete the project and all its tasks and chat history.\n\nDelete "${currentProject.name}"?`,
      )
    )
      return
    try {
      await deleteProject(currentProject.id, true)
    } catch (err) {
      const msg = err.response?.data?.detail
      if (msg) alert(msg)
    }
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-md shadow-[#7C5CBF]/30">
          <FolderKanban size={18} className="text-white" />
        </div>
        <div className="hidden min-w-0 flex-1 xl:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Project
          </p>
          <p className="truncate text-sm font-semibold text-white">
            {currentProject?.name || 'Select project'}
          </p>
        </div>
        <ChevronsUpDown size={16} className="hidden shrink-0 text-gray-400 xl:block" />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#11111E] shadow-2xl xl:w-[260px]">
          <div className="border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Switch project
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto py-2">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCurrentProject(p)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                  p.id === currentProject?.id
                    ? 'bg-[#7C5CBF]/20 text-white'
                    : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-semibold text-[#C4B5FD]">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{p.name}</span>
                </span>
                {p.role === 'OWNER' && (
                  <Crown size={12} className="shrink-0 text-[#9370DB]" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 py-2">
            <button
              type="button"
              onClick={() => {
                setModal('create')
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              <FolderPlus size={16} />
              New project
            </button>
            {currentProject && isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setModal('rename')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <Pencil size={16} />
                  Rename project
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  Delete project
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {modal === 'create' && (
        <ProjectModal
          title="New project"
          submitLabel="Create"
          onClose={() => setModal(null)}
          onSubmit={(name, description) => createProject(name, description)}
        />
      )}
      {modal === 'rename' && currentProject && (
        <ProjectModal
          title="Rename project"
          submitLabel="Save"
          initialName={currentProject.name}
          initialDescription={currentProject.description || ''}
          onClose={() => setModal(null)}
          onSubmit={(name, description) =>
            renameProject(currentProject.id, name, description)
          }
        />
      )}
    </div>
  )
}

function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleString = user?.email?.split('@')[0] || 'me'

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-full px-2 py-2 transition hover:bg-white/[0.06] xl:px-3"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] text-sm font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="hidden min-w-0 flex-1 text-left xl:block">
          <p className="truncate text-sm font-semibold text-white">
            {user?.name || 'You'}
          </p>
          <p className="truncate text-xs text-gray-500">
            @{handleString}
          </p>
        </div>
        <MoreHorizontal size={18} className="hidden shrink-0 text-gray-400 xl:block" />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#11111E] shadow-2xl xl:w-full">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || 'Signed in user'}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              <UserIcon size={16} />
              View profile
            </Link>
            <Link
              to="/history"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              <HistoryIcon size={16} />
              Task history
            </Link>
          </div>
          <div className="border-t border-white/10 py-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={16} />
              Log out @{handleString}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col border-r border-white/[0.06] bg-[#08080F] px-3 py-4 sm:flex xl:w-[280px] xl:px-5">
      <Link
        to="/"
        className="mb-4 flex items-center gap-3 rounded-full px-3 py-2 transition hover:bg-white/[0.06]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-lg shadow-[#7C5CBF]/30">
          <Sparkles size={20} className="text-white" />
        </div>
        <div className="hidden min-w-0 xl:block">
          <p className="text-base font-bold tracking-tight text-white">
            TaskMind <span className="text-[#9370DB]">AI</span>
          </p>
          <p className="text-[11px] text-gray-500">Your work co-pilot</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            active={
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            }
          />
        ))}

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <p className="mb-2 hidden px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 xl:block">
            Workspace
          </p>
          <ProjectsSection />
        </div>
      </nav>

      <div className="mt-4 border-t border-white/[0.06] pt-3">
        <AccountMenu />
      </div>
    </aside>
  )
}
