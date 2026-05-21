import { useEffect } from 'react'
import { Send, Wand2, Zap } from 'lucide-react'

const MODE_STORAGE_PREFIX = 'taskmind_chat_mode_'

export default function ChatInput({
  inputValue,
  setInputValue,
  sendMessage,
  isLoading,
  projectId,
  mode,
  setMode,
}) {
  useEffect(() => {
    if (!projectId) return
    const stored = localStorage.getItem(`${MODE_STORAGE_PREFIX}${projectId}`)
    if (stored === 'guided' || stored === 'auto') {
      setMode(stored)
    }
  }, [projectId, setMode])

  const handleModeChange = (newMode) => {
    setMode(newMode)
    if (projectId) {
      localStorage.setItem(`${MODE_STORAGE_PREFIX}${projectId}`, newMode)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isLoading) {
        sendMessage(inputValue)
      }
    }
  }

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue)
    }
  }

  const isDisabled = isLoading || !inputValue.trim()

  return (
    <div className="border-t border-white/[0.06] bg-[#0B0B16] px-4 py-3">
      <div className="mb-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => handleModeChange('guided')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
            mode === 'guided'
              ? 'bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] text-white shadow-md shadow-[#7C5CBF]/30'
              : 'border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
          }`}
        >
          <Wand2 size={12} />
          Guide me
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('auto')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
            mode === 'auto'
              ? 'bg-gradient-to-r from-[#9370DB] to-[#5B3FBE] text-white shadow-md shadow-[#7C5CBF]/30'
              : 'border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
          }`}
        >
          <Zap size={12} />
          Just do it
        </button>
      </div>

      <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition focus-within:border-[#7C5CBF]/60 focus-within:bg-white/[0.05]">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Tell me what you're working on..."
          className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-[14px] leading-6 text-white outline-none placeholder:text-gray-500"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={isDisabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] text-white shadow-md shadow-[#7C5CBF]/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
