import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createProject as apiCreateProject,
  deleteProject as apiDeleteProject,
  getProjects,
  getStoredProjectId,
  setStoredProjectId,
  updateProject as apiUpdateProject,
} from '../services/api'
import { useAuth } from './useAuth'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProjectState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const setCurrentProject = useCallback((project) => {
    setCurrentProjectState(project)
    if (project?.id) {
      setStoredProjectId(project.id)
    } else {
      setStoredProjectId(null)
    }
  }, [])

  const refreshProjects = useCallback(async () => {
    const list = await getProjects()
    setProjects(list)
    return list
  }, [])

  const createProject = useCallback(
    async (name, description = null) => {
      const created = await apiCreateProject(name, description)
      await refreshProjects()
      setCurrentProject(created)
      return created
    },
    [refreshProjects, setCurrentProject],
  )

  const renameProject = useCallback(
    async (projectId, name, description) => {
      const updated = await apiUpdateProject(projectId, { name, description })
      await refreshProjects()
      setCurrentProjectState((prev) => {
        if (prev?.id === projectId) {
          setStoredProjectId(updated.id)
          return updated
        }
        return prev
      })
      return updated
    },
    [refreshProjects],
  )

  const deleteProject = useCallback(
    async (projectId, confirm = false) => {
      await apiDeleteProject(projectId, confirm)
      const list = await refreshProjects()
      setCurrentProjectState((prev) => {
        if (prev?.id === projectId) {
          const next = list[0] || null
          if (next) setStoredProjectId(next.id)
          else setStoredProjectId(null)
          return next
        }
        return prev
      })
    },
    [refreshProjects],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([])
      setCurrentProjectState(null)
      setIsLoading(false)
      return
    }

    async function load() {
      setIsLoading(true)
      try {
        const list = await refreshProjects()
        if (list.length === 0) {
          setCurrentProjectState(null)
          setStoredProjectId(null)
          return
        }

        const storedId = getStoredProjectId()
        const match = storedId ? list.find((p) => p.id === storedId) : null
        const selected = match || list[0]
        setCurrentProjectState(selected)
        setStoredProjectId(selected.id)
      } catch (error) {
        console.error('Failed to load projects:', error)
        setProjects([])
        setCurrentProjectState(null)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [isAuthenticated, refreshProjects])

  const value = useMemo(
    () => ({
      projects,
      currentProject,
      setCurrentProject,
      isLoading,
      refreshProjects,
      createProject,
      renameProject,
      deleteProject,
    }),
    [
      projects,
      currentProject,
      isLoading,
      refreshProjects,
      createProject,
      renameProject,
      deleteProject,
      setCurrentProject,
    ],
  )

  return createElement(ProjectContext.Provider, { value }, children)
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used inside ProjectProvider')
  }
  return context
}
