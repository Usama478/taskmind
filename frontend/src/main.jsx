import { StrictMode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.js'
import { ProjectProvider } from './hooks/useProject.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
