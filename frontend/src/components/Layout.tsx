import { useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api, authSession } from '../api/client'

interface LayoutProps { children: ReactNode }

const navGroups = [
  { label: 'Overview', links: [{ to: '/', label: 'Dashboard', icon: '⌂' }] },
  { label: 'Digital Project Management', links: [{ to: '/projects', label: 'Project List', icon: '▤' }, { to: '/pmo', label: 'PMO L0 / L1', icon: '◈' }] },
  { label: 'Digital Operation', links: [{ to: '/market', label: 'Vehicle Market', icon: '◒' }] },
  { label: 'Engineering Traceability', links: [{ to: '/traceability', label: 'Trace & Impact', icon: '⌘' }] },
  { label: 'Digital Knowledge', links: [{ to: '/academy', label: 'Academy Library', icon: '▦' }] },
  { label: 'Digital Workspace', links: [{ to: '/tickets', label: 'My Ticket', icon: '✓' }, { to: '/guidelines', label: 'Video Guideline', icon: '▶' }] },
]

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = authSession.user()
  const displayName = user?.displayName || user?.username || 'ODS User'
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const current = navGroups.flatMap((group) => group.links).find((link) => link.to === location.pathname)?.label ?? 'ODS Platform'
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><span className="brand-mark">O</span><span><b>ODS</b><small>One Driving System</small></span></div>
        <nav aria-label="Main navigation">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span>{link.label}</NavLink>)}
          </div>)}
        </nav>
        <div className="sidebar-footer"><div className="help-card"><span>Need help?</span><NavLink to="/guidelines">Open guidelines →</NavLink></div><button className="logout-button" onClick={() => { api.auth.logout(); navigate('/login', { replace: true }) }}>Sign out</button><small>ODS Platform · v0.1</small></div>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <div className="main-shell">
        <header className="topbar"><button className="menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation">☰</button><div className="breadcrumb"><span>ODS Platform</span><b>/</b><strong>{current}</strong></div><div className="topbar-tools"><label className="global-search"><span>⌕</span><input placeholder="Search anything" aria-label="Search" /></label><button className="icon-button" aria-label="Notifications">♢<i /></button><div className="user-chip"><span className="avatar">{initials}</span><span className="user-name">{displayName}</span><span className="chevron">⌄</span></div></div></header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
