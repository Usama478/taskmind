export default function ProgressBar({ tasks }) {
  const completed = tasks.filter((t) => t.status === 'DONE').length
  const total = tasks.length
  const percentage = total === 0 ? 0 : (completed / total) * 100
  const isAllDone = completed === total && total > 0

  return (
    <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            isAllDone ? 'text-emerald-400' : 'text-gray-400'
          }`}
        >
          {isAllDone ? 'All done! 🎉' : `${completed} of ${total} tasks completed`}
        </span>
        <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isAllDone
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
              : 'bg-gradient-to-r from-[#9370DB] to-[#5B3FBE]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
