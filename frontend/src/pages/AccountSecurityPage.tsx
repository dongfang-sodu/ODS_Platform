import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useLanguage } from '../i18n'

interface Session { id: string; createdAt: string; expiresAt: string; createdByIp?: string }

export function AccountSecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState('')
  const { language, t } = useLanguage()

  const load = () => api.auth.sessions().then(setSessions).catch((value) => setError(value instanceof Error ? value.message : t('auth.loadSessionsFailed')))
  useEffect(() => { void load() }, [])

  const revoke = async (id: string) => {
    try {
      await api.auth.logoutSession(id)
      await load()
    } catch (value) {
      setError(value instanceof Error ? value.message : t('auth.revokeSessionFailed'))
    }
  }

  const revokeAll = async () => {
    try {
      await api.auth.logoutAll()
      await load()
    } catch (value) {
      setError(value instanceof Error ? value.message : t('auth.revokeOtherSessionsFailed'))
    }
  }

  return <section className="page-section">
    <div className="page-header"><div><span className="eyebrow">{t('auth.accountSecurity')}</span><h1>{t('auth.sessionsTitle')}</h1><p>{t('auth.sessionsDescription')}</p></div><button className="button secondary" disabled={!sessions.length} onClick={() => void revokeAll()}>{t('auth.revokeOtherSessions')}</button></div>
    {error && <div className="form-message error-message" role="alert">{error}</div>}
    <div className="table-shell"><table><thead><tr><th>{t('auth.loginTime')}</th><th>{t('auth.ipAddress')}</th><th>{t('auth.expiresAt')}</th><th /></tr></thead><tbody>
      {sessions.map((session) => <tr key={session.id}><td>{new Date(session.createdAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</td><td>{session.createdByIp || t('auth.unknown')}</td><td>{new Date(session.expiresAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</td><td><button className="button secondary" onClick={() => void revoke(session.id)}>{t('auth.revoke')}</button></td></tr>)}
      {!sessions.length && <tr><td colSpan={4}>{t('auth.noSessions')}</td></tr>}
    </tbody></table></div>
  </section>
}
