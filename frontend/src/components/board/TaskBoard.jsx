import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import PrioritySection from './PrioritySection'
import ProgressBar from './ProgressBar'
import EmptyState from './EmptyState'
import { createTask, getProjectMembers, updateTask } from '../../services/api'

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function filterTasks(tasks, { search, filter, sort }) {
  let result = [...tasks]

  if (search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.assignee?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q),
    )
  }

  if (filter === 'overdue') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    result = result.filter((t) => {
      if (!t.deadline || t.status === 'DONE') return false
      const d = new Date(t.deadline)
      d.setHours(0, 0, 0, 0)
      return d < today
    })
  } else if (filter === 'due_soon') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const soon = new Date(today)
    soon.setDate(soon.getDate() + 2)
    result = result.filter((t) => {
      if (!t.deadline || t.status === 'DONE') return false
      const d = new Date(t.deadline)
      d.setHours(0, 0, 0, 0)
      return d >= today && d <= soon
    })
  } else if (filter === 'has_link') {
    result = result.filter((t) => t.asset_link)
  } else if (filter?.startsWith('category:')) {
    const cat = filter.replace('category:', '')
    result = result.filter((t) => t.category === cat)
  } else if (filter?.startsWith('assignee:')) {
    const name = filter.replace('assignee:', '')
    result = result.filter((t) => t.assignee === name)
  }

  if (sort === 'deadline') {
    result.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    })
  } else if (sort === 'priority') {
    result.sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
    )
  } else {
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  return result
}

export default function TaskBoard({
  tasks,
  projectId,
  projectName,
  completeTask,
  deleteTask,
  onTasksChange,
}) {
  const [view, setView] = useState('priority')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [newAssignee, setNewAssignee] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    const loadMembers = () => {
      getProjectMembers(projectId)
        .then((list) => {
          if (!cancelled) setMembers(list)
        })
        .catch((err) => console.error('Failed to load members:', err))
    }
    loadMembers()
    const handler = (e) => {
      if (!e.detail?.projectId || e.detail.projectId === projectId) loadMembers()
    }
    window.addEventListener('project-members-changed', handler)
    return () => {
      cancelled = true
      window.removeEventListener('project-members-changed', handler)
    }
  }, [projectId])

  const categories = useMemo(() => {
    const set = new Set()
    tasks.forEach((t) => {
      if (t.category && t.category !== 'General') set.add(t.category)
    })
    return [...set]
  }, [tasks])

  const assignees = useMemo(() => {
    const set = new Set()
    tasks.forEach((t) => {
      if (t.assignee) set.add(t.assignee)
    })
    return [...set]
  }, [tasks])

  const filtered = useMemo(
    () =>
      filterTasks(tasks, {
        search,
        filter: filter === 'all' ? null : filter,
        sort,
      }),
    [tasks, search, filter, sort],
  )

  const highTasks = filtered.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE')
  const mediumTasks = filtered.filter((t) => t.priority === 'MEDIUM' && t.status !== 'DONE')
  const lowTasks = filtered.filter((t) => t.priority === 'LOW' && t.status !== 'DONE')
  const doneTasks = filtered.filter((t) => t.status === 'DONE')
  const todoTasks = filtered.filter((t) => t.status === 'TODO')
  const inProgressTasks = filtered.filter((t) => t.status === 'IN_PROGRESS')

  const hasAnyTasks = filtered.length > 0
  const completedCount = tasks.filter((t) => t.status === 'DONE').length
  const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  const handleAssign = async (taskId, userId) => {
    if (!projectId) return
    try {
      await updateTask(
        taskId,
        { assigned_to_user_id: userId === null ? null : Number(userId) },
        projectId,
      )
      await onTasksChange?.()
    } catch (err) {
      console.error('Failed to update assignee:', err)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !projectId) return
    setIsAdding(true)
    try {
      const payload = {
        title: newTitle.trim(),
        priority: newPriority,
        status: 'TODO',
        category: 'General',
      }
      if (newAssignee) {
        payload.assigned_to_user_id = Number(newAssignee)
      }
      await createTask(projectId, payload)
      setNewTitle('')
      setNewAssignee('')
      setShowAddForm(false)
      await onTasksChange?.()
    } catch (err) {
      console.error('Failed to add task:', err)
    } finally {
      setIsAdding(false)
    }
  }

  const filterChips = [
    { id: 'all', label: 'All' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'due_soon', label: 'Due soon' },
    { id: 'has_link', label: 'Has link' },
    ...categories.map((c) => ({ id: `category:${c}`, label: c })),
    ...assignees.map((a) => ({ id: `assignee:${a}`, label: a })),
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0B0B16]">
      <div className="shrink-0 border-b border-white/[0.06] bg-[#0B0B16]/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-white">
              {projectName || 'Task Board'}
            </h1>
            <p className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {progressPct}% complete
              </span>
              <span>·</span>
              <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
              <span>·</span>
              <span>{completedCount} done</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#7C5CBF]/30 transition hover:opacity-90"
          >
            <Plus size={16} />
            Add task
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddTask} className="mb-3 flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="min-w-[160px] flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#7C5CBF]"
              autoFocus
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-sm text-white"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-sm text-white"
              title="Assign to teammate"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isAdding || !newTitle.trim()}
              className="rounded-lg bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isAdding ? 'Adding...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 focus-within:border-[#7C5CBF]/60">
          <Search size={14} className="shrink-0 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                filter === chip.id
                  ? 'bg-[#7C5CBF] text-white shadow-md shadow-[#7C5CBF]/30'
                  : 'border border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] p-0.5">
            <button
              type="button"
              onClick={() => setView('priority')}
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                view === 'priority' ? 'bg-[#7C5CBF] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Priority
            </button>
            <button
              type="button"
              onClick={() => setView('status')}
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                view === 'status' ? 'bg-[#7C5CBF] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Status
            </button>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-gray-300 outline-none focus:border-[#7C5CBF]"
          >
            <option value="newest">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0B0B16] p-5 pt-3">
        {!hasAnyTasks ? (
          <EmptyState filtered={filter !== 'all' || search.trim()} />
        ) : view === 'priority' ? (
          <>
            {highTasks.length > 0 && (
              <PrioritySection
                title="High Priority"
                color="#EF4444"
                tasks={highTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            {mediumTasks.length > 0 && (
              <PrioritySection
                title="Medium Priority"
                color="#F59E0B"
                tasks={mediumTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            {lowTasks.length > 0 && (
              <PrioritySection
                title="Low Priority"
                color="#10B981"
                tasks={lowTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            {doneTasks.length > 0 && (
              <PrioritySection
                title="Completed"
                color="#6B7280"
                tasks={doneTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            <ProgressBar tasks={tasks} />
          </>
        ) : (
          <>
            {todoTasks.length > 0 && (
              <PrioritySection
                title="To Do"
                color="#9CA3AF"
                tasks={todoTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            {inProgressTasks.length > 0 && (
              <PrioritySection
                title="In Progress"
                color="#3B82F6"
                tasks={inProgressTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            {doneTasks.length > 0 && (
              <PrioritySection
                title="Done"
                color="#6B7280"
                tasks={doneTasks}
                completeTask={completeTask}
                deleteTask={deleteTask}
                members={members}
                onAssign={handleAssign}
              />
            )}
            <ProgressBar tasks={tasks} />
          </>
        )}
      </div>
    </div>
  )
}
