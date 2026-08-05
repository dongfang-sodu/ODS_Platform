import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoProjects } from '../data/demo'
import { canCreateProject, canEditProject } from '../permissions/projects'
import type { Project, ProjectStatus } from '../types'

export function ProjectsPage() {
  const navigate = useNavigate()
  const user = authSession.user()
  const canCreate = canCreateProject(user)
  const canEdit = canEditProject(user)
  const [projects, setProjects] = useState<Project[]>(demoDataEnabled ? demoProjects : [])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showingDemo, setShowingDemo] = useState(demoDataEnabled)
  const [loadError, setLoadError] = useState('')
  const [apiNotice, setApiNotice] = useState(demoDataEnabled ? demoReadOnlyNotice : '')
  const liveDataReady = !loading && !loadError && !showingDemo

  useEffect(() => {
    let alive = true
    setLoading(true)
    setLoadError('')

    api.projects.list()
      .then((data) => {
        if (!alive) return
        setProjects(data)
        setShowingDemo(false)
        setApiNotice('Live data')
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : 'Projects could not be loaded'
        if (demoDataEnabled) {
          setProjects(demoProjects)
          setShowingDemo(true)
          setApiNotice(`${demoReadOnlyNotice} · Live API unavailable: ${message}`)
          return
        }
        setProjects([])
        setShowingDemo(false)
        setLoadError(message)
        setApiNotice(message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [])

  const filtered = useMemo(
    () => projects.filter((project) => (
      (!keyword || `${project.name} ${project.code} ${project.owner}`.toLowerCase().includes(keyword.toLowerCase()))
      && (status === 'All' || project.status === status)
    )),
    [projects, keyword, status],
  )

  const clearFilters = () => {
    setKeyword('')
    setStatus('All')
  }

  const exportCsv = async () => {
    if (!liveDataReady) {
      setApiNotice(showingDemo ? demoReadOnlyNotice : 'Projects must load successfully before they can be exported')
      return
    }
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
    <PageHeader
      eyebrow="Digital Project Management"
      title="Project list"
      description="Find, track and maintain every QG4 project in one place."
      actions={liveDataReady ? <>
        <button className="button secondary" onClick={exportCsv}>⇩ Export list</button>
        {canCreate && <Link className="button primary" to="/projects/new">＋ Create new project</Link>}
      </> : undefined}
    />
    {apiNotice && <div className="notice-bar">
      <span className="live-dot" />
      {apiNotice}
      <button aria-label="Dismiss notice" onClick={() => setApiNotice('')}>×</button>
    </div>}
    <section className="card filter-card">
      <div className="filter-row">
        <label className="field search-field">
          <span>⌕</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search project, code or owner" />
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>All</option>
            {(['Draft', 'Active', 'On hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <button className="button ghost" onClick={clearFilters}>Clear filters</button>
        <span className="result-count">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
      </div>
    </section>
    <section className="card table-card">
      <div className="table-toolbar">
        <div>
          <h2>All projects</h2>
          <p>Projects cannot be deleted after creation. Contact an administrator for exceptional requests.</p>
        </div>
        {loading && <span className="loading-label">Loading…</span>}
      </div>
      {loading && projects.length === 0
        ? <EmptyState title="Loading projects" description="Project records are being loaded." />
        : loadError
          ? <EmptyState title="Projects could not be loaded" description={loadError} />
          : filtered.length
            ? <div className="table-wrap">
              <table>
                <thead><tr><th>Project</th><th>Product / QG4</th><th>Owner</th><th>Status</th><th>Milestone</th><th /></tr></thead>
                <tbody>{filtered.map((project) => <tr key={project.id}>
                  <td><Link className="table-link" to={`/projects/${project.id}`}>{project.name}</Link><span className="cell-muted">{project.code}</span></td>
                  <td><span className="cell-title">{project.product}</span><span className="cell-muted">{project.qg4}</span></td>
                  <td>{project.owner}</td>
                  <td><span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span></td>
                  <td>{project.milestone}</td>
                  <td>{!showingDemo && canEdit && <button className="small-button" onClick={() => navigate(`/projects/${project.id}/edit`)}>Edit</button>}</td>
                </tr>)}</tbody>
              </table>
            </div>
            : <EmptyState title="No projects found" description="Try another keyword or clear your filters." actionLabel="Clear filters" onAction={clearFilters} />}
    </section>
  </>
}
