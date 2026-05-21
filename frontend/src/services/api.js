import axios from 'axios'

export async function sendChatMessage(message, conversationHistory) {
  try {
    const response = await axios.post('/api/chat', {
      message,
      conversation_history: conversationHistory,
    })
    return response.data
  } catch (error) {
    console.error('Error sending chat message:', error)
    throw error
  }
}

export async function getAllTasks() {
  try {
    const response = await axios.get('/api/tasks')
    return response.data.tasks
  } catch (error) {
    console.error('Error getting tasks:', error)
    throw error
  }
}

export async function updateTask(taskId, updates) {
  try {
    const response = await axios.patch(`/api/tasks/${taskId}`, updates)
    return response.data
  } catch (error) {
    console.error('Error updating task:', error)
    throw error
  }
}

export async function deleteTask(taskId) {
  try {
    const response = await axios.delete(`/api/tasks/${taskId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting task:', error)
    throw error
  }
}
