import { useState } from 'react'
import { X } from 'lucide-react'

export default function PromptSuggestionStrip({ quickPrompts, onSelectPrompt }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !quickPrompts?.length) return null

  return (
    <div className="flex items-center gap-2 border-t border-white/[0.04] bg-[#0B0B16] px-3 py-2">
      <div className="flex flex-1 flex-wrap gap-1.5 overflow-x-auto">
        {quickPrompts.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-gray-300 transition hover:border-[#7C5CBF]/60 hover:bg-white/[0.06] hover:text-white"
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-gray-500 transition hover:text-gray-300"
        title="Dismiss suggestions"
      >
        <X size={14} />
      </button>
    </div>
  )
}
