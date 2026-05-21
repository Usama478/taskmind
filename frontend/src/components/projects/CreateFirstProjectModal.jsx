import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useProject } from '../../hooks/useProject'

export default function CreateFirstProjectModal({ onCreated }) {
  const { createProject } = useProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const project = await createProject(name.trim(), description.trim() || null)
      onCreated?.(project)
    } catch {
      setError('Could not create project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#7C5CBF]/20 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-[#7C5CBF] via-[#5B3FBE] to-[#EC4899] opacity-25 blur" />
        <div className="relative rounded-3xl border border-white/10 bg-[#0F0F1A]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-lg shadow-[#7C5CBF]/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create your first project</h2>
              <p className="text-xs text-gray-500">It takes about 10 seconds</p>
            </div>
          </div>
          <p className="mb-6 text-sm leading-6 text-gray-400">
            Projects keep your tasks and chat organized. Name it anything — e.g.
            Website Revamp, Q2 Marketing.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Project name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Revamp"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#7C5CBF] focus:bg-white/[0.05]"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={2}
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#7C5CBF] focus:bg-white/[0.05]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] py-3 text-sm font-semibold text-white shadow-lg shadow-[#7C5CBF]/30 transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
