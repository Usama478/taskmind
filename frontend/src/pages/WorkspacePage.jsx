import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ChatPanel from '../components/chat/ChatPanel'
import TaskBoard from '../components/board/TaskBoard'
import CreateFirstProjectModal from '../components/projects/CreateFirstProjectModal'
import {
  sendChatMessage,
  getAllTasks,
  getChatHistory,
  updateTask,
  deleteTask as deleteTaskAPI,
} from '../services/api'
import { useProject } from '../hooks/useProject'

function projectWelcomeMessage(projectName) {
  return {
    id: 1,
    role: 'assistant',
    content: `Hey! I'm TaskMind AI for **${projectName}**. Tell me what you're working on, or tap Help to see what I can do. 👋`,
    timestamp: new Date(),
  }
}

function FullScreenLoader({ label = 'Loading...' }) {
  return (
    <div className="flex h-screen flex-1 items-center justify-center bg-[#08080F] text-gray-400">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
        <Loader2 size={18} className="animate-spin text-[#9370DB]" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  const { currentProject, projects, isLoading: projectsLoading } = useProject()
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [chatMode, setChatMode] = useState('guided')
  const [workspaceLoading, setWorkspaceLoading] = useState(false)

  const loadWorkspace = useCallback(async () => {
    if (!currentProject?.id) return
    setWorkspaceLoading(true)
    try {
      const [loadedTasks, history] = await Promise.all([
        getAllTasks(currentProject.id),
        getChatHistory(currentProject.id),
      ])
      setTasks(loadedTasks)
      if (history.length > 0) {
        setMessages(
          history.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.created_at),
          })),
        )
      } else {
        setMessages([projectWelcomeMessage(currentProject.name)])
      }
    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setWorkspaceLoading(false)
    }
  }, [currentProject?.id, currentProject?.name])

  useEffect(() => {
    loadWorkspace()
  }, [loadWorkspace])

  const sendMessage = async (text) => {
    if (text === '' || !currentProject?.id) return

    setInputValue('')

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
      const response = await sendChatMessage(
        text,
        conversationHistory,
        currentProject.id,
        chatMode,
      )
      setIsLoading(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
        },
      ])
      setTasks(response.tasks)
    } catch {
      setIsLoading(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Something went wrong. Please try again! 🔄',
          timestamp: new Date(),
        },
      ])
    }
  }

  const completeTask = async (taskId) => {
    if (!currentProject?.id) return
    try {
      await updateTask(taskId, { status: 'DONE' }, currentProject.id)
      const loaded = await getAllTasks(currentProject.id)
      setTasks(loaded)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (!currentProject?.id) return
    try {
      await deleteTaskAPI(taskId, currentProject.id)
      const loaded = await getAllTasks(currentProject.id)
      setTasks(loaded)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  if (projectsLoading) {
    return <FullScreenLoader label="Loading your workspace..." />
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080F]">
        <CreateFirstProjectModal />
      </div>
    )
  }

  if (!currentProject) {
    return <FullScreenLoader label="Select a project to get started..." />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#08080F]">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#08080F]/95 px-5 py-3 backdrop-blur">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Manage projects & tasks
          </p>
          <p className="truncate text-sm font-semibold text-white">
            {currentProject.name}
          </p>
        </div>
      </div>

      {workspaceLoading ? (
        <FullScreenLoader label="Loading workspace..." />
      ) : (
        <div className="flex flex-1 flex-row overflow-hidden">
          <div className="hidden h-full w-[45%] min-w-0 lg:block">
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              inputValue={inputValue}
              setInputValue={setInputValue}
              sendMessage={sendMessage}
              mode={chatMode}
              setMode={setChatMode}
            />
          </div>
          <div className="hidden h-full w-px bg-white/[0.06] lg:block" />
          <div className="h-full w-full min-w-0 flex-1">
            <TaskBoard
              tasks={tasks}
              projectId={currentProject.id}
              projectName={currentProject.name}
              completeTask={completeTask}
              deleteTask={deleteTask}
              onTasksChange={loadWorkspace}
            />
          </div>
        </div>
      )}
    </div>
  )
}
