import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, authSession } from '../api/client'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const destination = (location.state as { from?: string } | null)?.from ?? '/'

  if (authSession.isAuthenticated()) return <Navigate to={destination} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter both your username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.auth.login(username.trim(), password)
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell">
    <section className="login-story">
      <div className="login-brand"><span className="brand-mark">O</span><span><b>ODS</b><small>One Driving System</small></span></div>
      <div className="login-story-copy"><span className="eyebrow">One connected workspace</span><h1>Turn project data into confident decisions.</h1><p>Manage delivery, PMO risks, market intelligence, learning content and daily tickets in one secure platform.</p></div>
      <div className="login-story-footer">Digital Operations · Project Management · Knowledge · Workspace</div>
    </section>
    <section className="login-panel">
      <form className="login-form" onSubmit={submit} noValidate>
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in to ODS</h2>
        <p>Use the account configured by your platform administrator.</p>
        <label className="field"><span>Username</span><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Corporate username" /></label>
        <label className="field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" /></label>
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <button className="button primary login-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <small className="login-help">The API must be running on the configured `VITE_API_BASE_URL`.</small>
      </form>
    </section>
  </main>
}
