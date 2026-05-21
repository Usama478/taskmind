import { useEffect, useState } from 'react'
import { HelpCircle, Sparkles } from 'lucide-react'
import { getCapabilities } from '../../services/api'
import { useProject } from '../../hooks/useProject'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import CapabilitiesModal from './CapabilitiesModal'
import PromptSuggestionStrip from './PromptSuggestionStrip'

export default function ChatPanel({
  messages,
  isLoading,
  inputValue,
  setInputValue,
  sendMessage,
  mode,
  setMode,
}) {
  const { currentProject } = useProject()
  const [showHelp, setShowHelp] = useState(false)
  const [capabilities, setCapabilities] = useState(null)
  const [quickPrompts, setQuickPrompts] = useState([])

  useEffect(() => {
    getCapabilities()
      .then((data) => {
        setCapabilities(data.capabilities)
        setQuickPrompts(data.quick_prompts)
      })
      .catch(console.error)
  }, [])

  const handleSelectPrompt = (prompt) => {
    setInputValue(prompt)
  }

  return (
    <div className="flex h-full flex-col bg-[#0B0B16]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0B0B16]/95 px-5 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-md shadow-[#7C5CBF]/30">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              AI Assistant
            </h3>
            {currentProject && (
              <p className="truncate text-[11px] text-[#9370DB]">
                {currentProject.name}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-[#7C5CBF] hover:bg-white/[0.04] hover:text-white"
          title="What can I do?"
        >
          <HelpCircle size={14} />
          Help
        </button>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <PromptSuggestionStrip
        quickPrompts={quickPrompts}
        onSelectPrompt={handleSelectPrompt}
      />

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        sendMessage={sendMessage}
        isLoading={isLoading}
        projectId={currentProject?.id}
        mode={mode}
        setMode={setMode}
      />

      {showHelp && (
        <CapabilitiesModal
          capabilities={capabilities}
          onClose={() => setShowHelp(false)}
          onSelectPrompt={handleSelectPrompt}
        />
      )}
    </div>
  )
}
