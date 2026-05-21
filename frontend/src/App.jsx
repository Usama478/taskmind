import { useState } from 'react'
import Header from './components/Header'
import ChatPanel from './components/chat/ChatPanel'
import TaskBoard from './components/board/TaskBoard'
import {
  sendChatMessage,
  getAllTasks,
  updateTask,
  deleteTask as deleteTaskAPI,
} from './services/api'
import { colors } from './constants/colors'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        "Hey! I'm TaskMind AI. Tell me what you're working on and I'll manage it for you. 👋",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const sendMessage = async (text) => {
    if (text === '') return

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
      const response = await sendChatMessage(text, conversationHistory)
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
    try {
      await updateTask(taskId, { status: 'DONE' })
      const tasks = await getAllTasks()
      setTasks(tasks)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await deleteTaskAPI(taskId)
      const tasks = await getAllTasks()
      setTasks(tasks)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  return (
    <div
      style={{
        backgroundColor: colors.appBackground,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Header tasks={tasks} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '45%', height: '100%' }}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            inputValue={inputValue}
            setInputValue={setInputValue}
            sendMessage={sendMessage}
          />
        </div>
        <div
          style={{
            width: '1px',
            height: '100%',
            backgroundColor: colors.borderColor,
          }}
        />
        <div style={{ width: '55%', height: '100%' }}>
          <TaskBoard
            tasks={tasks}
            completeTask={completeTask}
            deleteTask={deleteTask}
          />
        </div>
      </div>
    </div>
  )
}
