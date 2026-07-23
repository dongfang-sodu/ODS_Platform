import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoProjects } from '../data/demo'
import type { Project, ProjectStatus } from '../types'

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>(demoProjects)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('All')
  const [loading, setLoading] = useState(false)
  const [apiNotice, setApiNotice] = useState('Demo data · connect the Spring Boot API to load live records')

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.projects.list().then((data) => { if (alive) { setProjects(data); setApiNotice('Live data'); } }).catch(() => { if (alive) setApiNotice('Demo data · API is not connected yet') }).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => projects.filter((project) => (!keyword || `${project.name} ${project.code} ${project.owner}`.toLowerCase().includes(keyword.toLowerCase())) && (status === 'All' || project.status === status)), [projects, keyword, status])
  const exportCsv = async () => {
    try {
      const blob = await api.projects.export({ keyword, status: status as ProjectStatus | 'All' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'ods-projects.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setApiNotice(error instanceof Error ? error.message : 'Project export failed')
    }
  }
  return <>
    <PageHeader eyebrow="Digital Project Management" title="Project list" description="Find, track and maintain every QG4 project in one place." actions={<><button className="button secondary" onClick={exportCsv}>⇩ Export list</button><Link className="button primary" to="/projects/new">＋ Create new project</Link></>} />
    <div className="notice-bar"><span className="live-dot" />{apiNotice}<button aria-label="Dismiss notice" onClick={() => setApiNotice('')}>×</button></div>
    <section className="card filter-card"><div className="filter-row"><label className="field search-field"><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search project, code or owner" /></label><label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{(['Draft', 'Active', 'On hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((value) => <option key={value}>{value}</option>)}</select></label><button className="button ghost" onClick={() => { setKeyword(''); setStatus('All') }}>Clear filters</button><span className="result-count">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span></div></section>
    <section className="card table-card"><div className="table-toolbar"><div><h2>All projects</h2><p>Projects cannot be deleted after creation. Contact an administrator for exceptional requests.</p></div>{loading && <span className="loading-label">Loading…</span>}</div>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Project</th><th>Product / QG4</th><th>Owner</th><th>Status</th><th>Milestone</th><th>Updated</th><th /></tr></thead><tbody>{filtered.map((project) => <tr key={project.id}><td><Link className="table-link" to={`/projects/${project.id}`}>{project.name}</Link><span className="cell-muted">{project.code}</span></td><td><span className="cell-title">{project.product}</span><span className="cell-muted">{project.qg4}</span></td><td>{project.owner}</td><td><span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span></td><td>{project.milestone}</td><td>{project.updatedAt}</td><td><button className="small-button" onClick={() => navigate(`/projects/${project.id}/edit`)}>Edit</button></td></tr>)}</tbody></table></div> : <EmptyState title="No projects found" description="Try another keyword or clear your filters." actionLabel="Clear filters" onAction={() => { setKeyword(''); setStatus('All') }} />}</section>
  </>
}
