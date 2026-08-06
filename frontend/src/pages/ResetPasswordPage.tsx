import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { LanguageToggle } from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmation) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await api.auth.confirmPasswordReset(token, password)
      setMessage(result.message)
      setPassword('')
      setConfirmation('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('auth.resetFailed'))
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell">
    <section className="login-story">
      <div className="login-brand"><span className="brand-mark">O</span><span><b>ODS</b><small>One Driving System</small></span></div>
      <div className="login-story-copy"><span className="eyebrow">{t('auth.accountSecurity')}</span><h1>{t('auth.newPasswordTitle')}</h1><p>{t('auth.passwordRule')}</p></div>
    </section>
    <section className="login-panel">
      <div className="login-language"><LanguageToggle /></div>
      <form className="login-form" onSubmit={submit} noValidate>
        <span className="eyebrow">{t('auth.newPasswordEyebrow')}</span>
        <h2>{t('auth.newPasswordTitle')}</h2>
        {!token && <div className="form-message error-message" role="alert">{t('auth.missingResetToken')}</div>}
        <label className="field"><span>{t('auth.newPassword')}</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="field"><span>{t('auth.confirmPassword')}</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        {message && <div className="form-message" role="status">{message}</div>}
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <button className="button primary login-button" disabled={loading || !token || password.length < 12}>{loading ? t('auth.saving') : t('auth.resetPassword')}</button>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </form>
    </section>
  </main>
}
