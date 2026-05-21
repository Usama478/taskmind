import { GoogleLogin } from '@react-oauth/google'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Bot,
  CheckCircle2,
  KanbanSquare,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const FEATURES = [
  {
    icon: Bot,
    title: 'AI that plans for you',
    description:
      'Describe what you want to do. TaskMind breaks it into tasks, deadlines, and owners.',
  },
  {
    icon: KanbanSquare,
    title: 'A board that stays in sync',
    description:
      'Priority, status, deadlines and assignees — auto-organised the moment you chat.',
  },
  {
    icon: Users,
    title: 'Work with your team',
    description:
      'Invite teammates, assign tasks, and see a unified history of every change.',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, signInWithGoogle } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) return
    await signInWithGoogle(credentialResponse.credential)
    navigate('/', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08080F] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#7C5CBF]/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#3B82F6]/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#EC4899]/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <div className="flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-lg shadow-[#7C5CBF]/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              TaskMind <span className="text-[#9370DB]">AI</span>
            </span>
          </div>

          <div className="mt-10 max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              AI co-pilot for getting things done
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Plan less.
              <br />
              <span className="bg-gradient-to-r from-[#C4B5FD] via-[#9370DB] to-[#EC4899] bg-clip-text text-transparent">
                Ship more.
              </span>
            </h1>
            <p className="mt-5 text-base leading-7 text-gray-400 sm:text-lg">
              Chat your goals to TaskMind AI and watch a clean, prioritised task
              board appear — complete with deadlines, owners, and a full audit
              history.
            </p>

            <ul className="mt-10 space-y-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <li key={feature.title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#C4B5FD]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{feature.title}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <p className="mt-10 hidden text-xs text-gray-500 lg:block">
            © {new Date().getFullYear()} TaskMind AI · Built for makers
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-[#7C5CBF] via-[#5B3FBE] to-[#EC4899] opacity-30 blur" />
            <div className="relative rounded-3xl border border-white/10 bg-[#0F0F1A]/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9370DB] to-[#5B3FBE] shadow-lg shadow-[#7C5CBF]/30">
                  <Sparkles size={26} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Sign in to access your projects, tasks and AI assistant.
                </p>
              </div>

              {googleClientId ? (
                <>
                  <div className="flex justify-center">
                    <div className="overflow-hidden rounded-full shadow-lg shadow-black/30">
                      <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.error('Google sign in failed')}
                        theme="filled_black"
                        size="large"
                        text="continue_with"
                        shape="pill"
                      />
                    </div>
                  </div>

                  <div className="my-7 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-gray-500">
                    <span className="h-px flex-1 bg-white/10" />
                    Why TaskMind
                    <span className="h-px flex-1 bg-white/10" />
                  </div>

                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      Free to start — no credit card required.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      Your data stays private to your account & team.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      Switch projects, invite collaborators, get going in seconds.
                    </li>
                  </ul>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  Add <span className="font-semibold">VITE_GOOGLE_CLIENT_ID</span> to
                  the frontend environment to enable Google sign-in.
                </div>
              )}

              <p className="mt-7 text-center text-xs text-gray-500">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
