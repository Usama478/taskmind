import { Sparkles, X } from 'lucide-react'

export default function CapabilitiesModal({ capabilities, onClose, onSelectPrompt }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0F0F1A] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-md shadow-[#7C5CBF]/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">What can TaskMind AI do?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-6 text-sm leading-6 text-gray-400">
          Click any example to use it as your message. Use{' '}
          <span className="font-semibold text-[#C4B5FD]">Guide me</span> mode to get
          clarifying questions, or{' '}
          <span className="font-semibold text-[#C4B5FD]">Just do it</span> to act
          immediately.
        </p>
        <div className="space-y-6">
          {capabilities?.map((cap) => (
            <div
              key={cap.action}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <h3 className="mb-1 text-sm font-semibold text-[#C4B5FD]">{cap.title}</h3>
              <p className="mb-3 text-xs text-gray-500">{cap.description}</p>
              <div className="flex flex-wrap gap-2">
                {cap.examples?.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      onSelectPrompt(ex.prompt)
                      onClose()
                    }}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-200 transition hover:border-[#7C5CBF]/60 hover:bg-white/[0.06] hover:text-white"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
