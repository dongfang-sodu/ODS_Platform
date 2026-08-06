import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { LanguageToggle } from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const destination = (location.state as { from?: string } | null)?.from ?? '/'

  if (authSession.isAuthenticated()) return <Navigate to={destination} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError(t('auth.requiredCredentials'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.auth.login(username.trim(), password)
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell">
    <section className="login-story">
      <div className="login-brand"><span className="brand-mark">O</span><span><b>ODS</b><small>One Driving System</small></span></div>
      <div className="login-story-copy"><span className="eyebrow">{t('auth.workspaceEyebrow')}</span><h1>{t('auth.workspaceTitle')}</h1><p>{t('auth.workspaceDescription')}</p></div>
      <div className="login-story-footer">{t('auth.workspaceFooter')}</div>
    </section>
    <section className="login-panel">
      <div className="login-language"><LanguageToggle /></div>
      <form className="login-form" onSubmit={submit} noValidate>
        <span className="eyebrow">{t('auth.welcome')}</span>
        <h2>{t('auth.signInTitle')}</h2>
        <p>{t('auth.signInDescription')}</p>
        <label className="field"><span>{t('auth.username')}</span><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t('auth.usernamePlaceholder')} /></label>
        <label className="field"><span>{t('auth.password')}</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.passwordPlaceholder')} /></label>
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <button className="button primary login-button" disabled={loading}>{loading ? t('auth.signingIn') : t('auth.signIn')}</button>
        <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
        <small className="login-help">{t('auth.apiHint')}</small>
      </form>
    </section>
  </main>
}
