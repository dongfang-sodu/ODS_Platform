import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { LanguageToggle } from './LanguageToggle'
import { useLanguage } from '../i18n'

interface LayoutProps { children: ReactNode }

const navGroups = [
  { label: 'nav.overview', links: [{ to: '/', label: 'nav.dashboard', icon: '⌂' }] },
  { label: 'nav.projectManagement', links: [{ to: '/projects', label: 'nav.projects', icon: '▤' }, { to: '/pmo', label: 'nav.pmo', icon: '◈' }] },
  { label: 'nav.operation', links: [{ to: '/market', label: 'nav.market', icon: '◒' }] },
  { label: 'nav.traceability', links: [{ to: '/traceability', label: 'nav.traceability', icon: '⌘' }] },
  { label: 'nav.knowledge', links: [{ to: '/academy', label: 'nav.academy', icon: '▦' }] },
  { label: 'nav.workspace', links: [{ to: '/tickets', label: 'nav.tickets', icon: '✓' }, { to: '/guidelines', label: 'nav.guidelines', icon: '▶' }] },
]

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const user = authSession.user()
  const displayName = user?.displayName || user?.username || 'ODS User'
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const currentKey = navGroups.flatMap((group) => group.links).find((link) => link.to === location.pathname)?.label
  const current = currentKey ? t(currentKey) : 'ODS Platform'
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark">O</span><span><b>ODS</b><small>One Driving System</small></span></div>
        <nav aria-label={t('layout.toggleNavigation')}>
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{t(group.label)}</div>
            {group.links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span>{t(link.label)}</NavLink>)}
          </div>)}
        </nav>
        <div className="sidebar-footer"><div className="help-card"><span>{t('layout.help')}</span><NavLink to="/guidelines">{t('layout.openGuidelines')} →</NavLink></div><button className="logout-button" onClick={() => { void api.auth.logout().finally(() => navigate('/login', { replace: true })) }}>{t('layout.signOut')}</button><small>ODS Platform · v0.1</small></div>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" aria-label={t('layout.toggleNavigation')} onClick={() => setMenuOpen(false)} />}
      <div className="main-shell">
        <header className="topbar"><button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label={t('layout.toggleNavigation')}>☰</button><div className="breadcrumb"><span>ODS Platform</span><b>/</b><strong>{current}</strong></div><div className="topbar-tools"><label className="global-search"><span>⌕</span><input placeholder={t('layout.search')} aria-label={t('layout.search')} /></label><button className="icon-button" aria-label={t('layout.notifications')}>♢<i /></button><LanguageToggle /><NavLink className="user-chip" to="/account/security"><span className="avatar">{initials}</span><span className="user-name">{displayName}</span><span className="chevron">⌄</span></NavLink></div></header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
