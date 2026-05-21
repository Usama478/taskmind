import { useEffect, useState } from 'react'
import { colors } from '../../constants/colors'

export default function ProjectModal({
  title,
  submitLabel,
  initialName = '',
  initialDescription = '',
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(initialName)
    setDescription(initialDescription)
  }, [initialName, initialDescription])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit(name.trim(), description.trim() || null)
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#2E2E4E] p-6 shadow-2xl"
        style={{ backgroundColor: colors.headerBackground }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="w-full rounded-lg border border-[#2E2E4E] bg-[#16162A] px-4 py-2 text-white outline-none focus:border-[#7C5CBF]"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none rounded-lg border border-[#2E2E4E] bg-[#16162A] px-4 py-2 text-white outline-none focus:border-[#7C5CBF]"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#2E2E4E] py-2 text-sm text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#7C5CBF] py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
