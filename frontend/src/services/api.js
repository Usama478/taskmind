import axios from 'axios'

const TOKEN_STORAGE_KEY = 'taskmind_token'
const PROJECT_STORAGE_KEY = 'taskmind_current_project_id'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export { TOKEN_STORAGE_KEY, PROJECT_STORAGE_KEY }

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function setStoredProjectId(projectId) {
  if (projectId) {
    localStorage.setItem(PROJECT_STORAGE_KEY, String(projectId))
  } else {
    localStorage.removeItem(PROJECT_STORAGE_KEY)
  }
}

export function getStoredProjectId() {
  const id = localStorage.getItem(PROJECT_STORAGE_KEY)
  return id ? Number(id) : null
}

export async function loginWithGoogle(credential) {
  const response = await api.post('/auth/google', { credential })
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me')
  return response.data
}

export async function updateProfile(updates) {
  const response = await api.patch('/auth/profile', updates)
  return response.data
}

export async function getProjects() {
  const response = await api.get('/projects')
  return response.data.projects
}

export async function createProject(name, description = null) {
  const response = await api.post('/projects', { name, description })
  return response.data
}

export async function updateProject(projectId, updates) {
  const response = await api.patch(`/projects/${projectId}`, updates)
  return response.data
}

export async function deleteProject(projectId, confirm = false) {
  const response = await api.delete(`/projects/${projectId}`, {
    params: { confirm },
  })
  return response.data
}

export async function getCapabilities() {
  const response = await api.get('/chat/capabilities')
  return response.data
}

export async function sendChatMessage(message, conversationHistory, projectId, mode = 'guided') {
  const response = await api.post('/chat', {
    message,
    conversation_history: conversationHistory,
    project_id: projectId,
    mode,
  })
  return response.data
}

export async function getChatHistory(projectId) {
  const response = await api.get('/chat/history', {
    params: { project_id: projectId },
  })
  return response.data
}

export async function getAllTasks(projectId) {
  const response = await api.get('/tasks', {
    params: { project_id: projectId },
  })
  return response.data.tasks
}

export async function createTask(projectId, task) {
  const response = await api.post('/tasks', task, {
    params: { project_id: projectId },
  })
  return response.data
}

export async function updateTask(taskId, updates, projectId) {
  const response = await api.patch(`/tasks/${taskId}`, updates, {
    params: { project_id: projectId },
  })
  return response.data
}

export async function deleteTask(taskId, projectId) {
  const response = await api.delete(`/tasks/${taskId}`, {
    params: { project_id: projectId },
  })
  return response.data
}

export async function getTaskHistory(projectId = null) {
  const params = projectId ? { project_id: projectId } : {}
  const response = await api.get('/tasks/history', { params })
  return response.data
}

export async function getAssignedTasks() {
  const response = await api.get('/tasks/assigned')
  return response.data
}

export async function getProjectMembers(projectId) {
  const response = await api.get(`/projects/${projectId}/members`)
  return response.data.members
}

export async function addProjectMember(projectId, email) {
  const response = await api.post(`/projects/${projectId}/members`, { email })
  return response.data
}

export async function removeProjectMember(projectId, memberUserId) {
  const response = await api.delete(
    `/projects/${projectId}/members/${memberUserId}`,
  )
  return response.data
}

export async function lookupUserByEmail(email) {
  const response = await api.get('/projects/lookup-user', {
    params: { email },
  })
  return response.data
}
