import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { LanguageToggle } from '../components/LanguageToggle'
import { useLanguage } from '../i18n'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await api.auth.requestPasswordReset(email.trim())
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell">
    <section className="login-story">
      <div className="login-brand"><span className="brand-mark">O</span><span><b>ODS</b><small>One Driving System</small></span></div>
      <div className="login-story-copy"><span className="eyebrow">{t('auth.accountSecurity')}</span><h1>{t('auth.resetAccountPassword')}</h1><p>{t('auth.resetLinkNotice')}</p></div>
    </section>
    <section className="login-panel">
      <div className="login-language"><LanguageToggle /></div>
      <form className="login-form" onSubmit={submit} noValidate>
        <span className="eyebrow">{t('auth.forgotPasswordEyebrow')}</span>
        <h2>{t('auth.enterpriseEmailTitle')}</h2>
        <p>{t('auth.enterpriseEmailDescription')}</p>
        <label className="field"><span>{t('auth.enterpriseEmail')}</span><input autoFocus type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        {message && <div className="form-message" role="status">{message}</div>}
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <button className="button primary login-button" disabled={loading || !email.trim()}>{loading ? t('auth.submitting') : t('auth.sendResetLink')}</button>
        <Link to="/login">{t('auth.backToLogin')}</Link>
      </form>
    </section>
  </main>
}
