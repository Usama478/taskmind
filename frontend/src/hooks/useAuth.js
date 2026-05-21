import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import {
  TOKEN_STORAGE_KEY,
  getCurrentUser,
  loginWithGoogle,
  setStoredToken,
  updateProfile,
} from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        setStoredToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const signInWithGoogle = async (credential) => {
    const response = await loginWithGoogle(credential)
    setStoredToken(response.access_token)
    setUser(response.user)
    return response.user
  }

  const saveProfile = async (updates) => {
    const updatedUser = await updateProfile(updates)
    setUser(updatedUser)
    return updatedUser
  }

  const logout = () => {
    setStoredToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signInWithGoogle,
      saveProfile,
      logout,
    }),
    [user, isLoading],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
