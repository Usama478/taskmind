import { ListChecks, Sparkles } from 'lucide-react'

export default function EmptyState({ filtered = false }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#C4B5FD]">
        {filtered ? <ListChecks size={26} /> : <Sparkles size={26} />}
      </div>
      <h2 className="mb-1 text-lg font-semibold text-white">
        {filtered ? 'No matching tasks' : 'Your board is a blank canvas'}
      </h2>
      <p className="max-w-sm text-sm text-gray-500">
        {filtered
          ? 'Try clearing filters or your search query to see more tasks.'
          : "Chat with the AI on the left, or hit Add task to seed your board."}
      </p>
    </div>
  )
}
