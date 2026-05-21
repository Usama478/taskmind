import { Navigate, Outlet } from 'react-router-dom'
import { colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center text-white"
        style={{ backgroundColor: colors.appBackground }}
      >
        Loading your workspace...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
