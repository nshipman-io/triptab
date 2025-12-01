import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              width?: number
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            }
          ) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check query param first, then location state, then default
  const redirectParam = searchParams.get('redirect')
  const from = redirectParam || (location.state as { from?: string })?.from || '/dashboard'
  const message = (location.state as { message?: string })?.message

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setError('')
    setLoading(true)
    try {
      const authResponse = await api.googleAuth(response.credential)
      api.setToken(authResponse.access_token)
      navigate(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }, [from, navigate])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    // Load Google Sign-In script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        })
        const buttonDiv = document.getElementById('google-signin-button')
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: 400,
            text: 'signin_with',
            shape: 'rectangular',
          })
        }
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [handleGoogleCallback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.login(email, password)
      api.setToken(response.access_token)
      navigate(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <Card className="w-full max-w-md p-8">
        <CardHeader className="text-center p-0 mb-8">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-serif text-2xl font-medium text-forest tracking-tight">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Triptab
          </Link>
          <CardTitle className="text-2xl font-serif">Welcome back</CardTitle>
          <CardDescription className="text-ink-light mt-2">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 p-0">
            {message && (
              <div className="rounded-xl bg-forest/10 p-4 text-sm text-forest">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-ink-light uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-ink-light uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-sm text-terracotta hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-0 mt-8">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-sand-dark" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-ink-light">Or continue with</span>
                  </div>
                </div>
                <div id="google-signin-button" className="flex justify-center w-full" />
              </>
            )}

            <p className="text-center text-sm text-ink-light">
              Don't have an account?{' '}
              <Link to={redirectParam ? `/register?redirect=${redirectParam}` : "/register"} state={{ from }} className="text-terracotta hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
