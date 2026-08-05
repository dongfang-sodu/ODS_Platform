import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoCourses, demoMarket, demoProjects, demoTickets } from '../data/demo'
import { canCreateProject } from '../permissions/projects'
import type { Course, MarketSummary, Project, ProjectStatus, Ticket } from '../types'

const REPORT_YEAR = 2024
const REPORT_MONTH = 12
const PROJECT_STATUSES: ProjectStatus[] = ['Draft', 'Active', 'On hold', 'Completed', 'Cancelled']
const TICKET_PRIORITY_ORDER: Record<Ticket['priority'], number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

interface DashboardProjects {
  recentProjects: Project[]
  totalElements: number
  statusCounts: Record<ProjectStatus, number>
}

interface ModuleState<T> {
  data: T | null
  error: string | null
  usingDemo: boolean
}

const emptyModuleState = <T,>(): ModuleState<T> => ({ data: null, error: null, usingDemo: false })

function emptyProjectStatusCounts(): Record<ProjectStatus, number> {
  return { Draft: 0, Active: 0, 'On hold': 0, Completed: 0, Cancelled: 0 }
}

function dashboardProjectsFromDemo(): DashboardProjects {
  const statusCounts = emptyProjectStatusCounts()
  demoProjects.forEach((project) => { statusCounts[project.status] += 1 })
  return { recentProjects: demoProjects.slice(0, 3), totalElements: demoProjects.length, statusCounts }
}

async function loadDashboardProjects(): Promise<DashboardProjects> {
  const [recentPage, statusPages] = await Promise.all([
    api.projects.getProjectPage({ page: 0, size: 3 }),
    Promise.all(PROJECT_STATUSES.map((status) => api.projects.getProjectPage({ status, page: 0, size: 1 }))),
  ])
  const statusCounts = emptyProjectStatusCounts()
  PROJECT_STATUSES.forEach((status, index) => { statusCounts[status] = statusPages[index].totalElements })
  return { recentProjects: recentPage.items, totalElements: recentPage.totalElements, statusCounts }
}

const demoDashboardProjects = dashboardProjectsFromDemo()

function resolveModule<T>(result: PromiseSettledResult<T>, demoData: T, fallbackMessage: string): ModuleState<T> {
  if (result.status === 'fulfilled') return { data: result.value, error: null, usingDemo: false }

  const error = result.reason instanceof Error && result.reason.message.trim()
    ? result.reason.message
    : typeof result.reason === 'string' && result.reason.trim()
      ? result.reason
      : fallbackMessage

  return {
    data: demoDataEnabled ? demoData : null,
    error,
    usingDemo: demoDataEnabled,
  }
}

function moduleDetail<T>(state: ModuleState<T>, detail: string) {
  if (state.data === null) return state.error ? 'Unavailable' : 'Loading...'
  return state.usingDemo ? `Demo preview · ${detail}` : detail
}

export function DashboardPage() {
  const [projectsState, setProjectsState] = useState<ModuleState<DashboardProjects>>(emptyModuleState)
  const [ticketsState, setTicketsState] = useState<ModuleState<Ticket[]>>(emptyModuleState)
  const [coursesState, setCoursesState] = useState<ModuleState<Course[]>>(emptyModuleState)
  const [marketState, setMarketState] = useState<ModuleState<MarketSummary>>(emptyModuleState)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const loadDashboard = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)

    const [projectsResult, ticketsResult, coursesResult, marketResult] = await Promise.allSettled([
      loadDashboardProjects(),
      api.tickets.list(),
      api.academy.list(),
      api.market.summary(REPORT_YEAR, REPORT_MONTH),
    ] as const)

    if (currentRequest !== requestId.current) return

    setProjectsState(resolveModule(projectsResult, demoDashboardProjects, 'Projects could not be loaded.'))
    setTicketsState(resolveModule(ticketsResult, demoTickets, 'Tickets could not be loaded.'))
    setCoursesState(resolveModule(coursesResult, demoCourses, 'Academy courses could not be loaded.'))
    setMarketState(resolveModule(marketResult, demoMarket, 'Market summary could not be loaded.'))
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
    return () => { requestId.current += 1 }
  }, [loadDashboard])

  const projectSummary = projectsState.data
  const tickets = ticketsState.data ?? []
  const courses = coursesState.data ?? []
  const market = marketState.data
  const activeProjects = projectSummary?.statusCounts.Active ?? 0
  const openTickets = tickets.filter((ticket) => ticket.status !== 'Done')
  const urgentTickets = openTickets.filter((ticket) => ticket.priority === 'Critical' || ticket.priority === 'High').length
  const publishedCourses = courses.filter((course) => course.status === 'Published').length
  const recentProjects = projectSummary?.recentProjects ?? []
  const priorityTickets = [...openTickets]
    .sort((left, right) => TICKET_PRIORITY_ORDER[left.priority] - TICKET_PRIORITY_ORDER[right.priority])
    .slice(0, 5)
  const reportingPeriod = market ? `${market.year}-${String(market.month).padStart(2, '0')}` : ''
  const marketChange = market?.yoy === null || market?.yoy === undefined
    ? 'No comparison'
    : `${market.yoy >= 0 ? '+' : ''}${market.yoy}% average share change`

  const modules = [
    { label: 'projects', state: projectsState },
    { label: 'tickets', state: ticketsState },
    { label: 'Academy', state: coursesState },
    { label: 'market', state: marketState },
  ]
  const failedModules = modules.filter((module) => module.state.error).map((module) => module.label)
  const hasDemoFallback = modules.some((module) => module.state.usingDemo)
  const canCreate = canCreateProject(authSession.user())

  return <>
    <PageHeader
      eyebrow="Good morning, You"
      title="Your workspace"
      description="A clear view of projects, tasks and insights across One Driving System."
      actions={<>
        <button className="button secondary" disabled={loading} onClick={() => void loadDashboard()}>{loading ? 'Refreshing...' : '↻ Refresh'}</button>
        {canCreate && !projectsState.usingDemo && <Link className="button primary" to="/projects/new">＋ New project</Link>}
      </>}
    />

    {hasDemoFallback && <div className="notice-bar" role="status" style={{ flexWrap: 'wrap' }}><span className="live-dot" /><strong>{demoReadOnlyNotice}</strong><span className="role-pill">Preview only</span></div>}
    {failedModules.length > 0 && <div className="notice-bar error-message" role="alert" style={{ flexWrap: 'wrap' }}><strong>Live data unavailable:</strong><span>{failedModules.join(', ')}.</span><span className="refresh-label">{hasDemoFallback ? 'Affected modules show read-only demo data.' : 'No demo values were substituted.'}</span></div>}

    <section className="stat-grid">
      <StatCard
        label="Active projects"
        value={projectsState.data === null ? '—' : activeProjects}
        detail={moduleDetail(projectsState, `${projectSummary?.totalElements ?? 0} total projects`)}
        tone="blue"
      />
      <StatCard
        label="Open tickets"
        value={ticketsState.data === null ? '—' : openTickets.length}
        detail={moduleDetail(ticketsState, `${urgentTickets} critical or high priority`)}
        tone="amber"
      />
      <StatCard
        label="Market sales"
        value={market ? market.totalSales.toLocaleString('en-US') : '—'}
        detail={moduleDetail(marketState, market ? `${reportingPeriod} · ${marketChange}` : '')}
        tone="green"
      />
      <StatCard
        label="Academy courses"
        value={coursesState.data === null ? '—' : courses.length}
        detail={moduleDetail(coursesState, `${publishedCourses} published`)}
        tone="purple"
      />
    </section>

    <section className="dashboard-grid">
      <article className="card chart-card">
        <div className="card-heading"><div><span className="eyebrow">Portfolio distribution</span><h2>Project status</h2></div><Link to="/projects" className="text-link">View all →</Link></div>
        {projectSummary === null
          ? <EmptyState title={loading ? 'Loading projects' : 'Project data unavailable'} description={projectsState.error ?? 'Waiting for the project service.'} />
          : projectSummary.totalElements
            ? <ProjectStatusChart counts={projectSummary.statusCounts} />
            : <EmptyState title="No projects yet" description="The project service returned no records." />}
      </article>

      <article className="card activity-card">
        <div className="card-heading"><div><span className="eyebrow">Latest updates</span><h2>Recent projects</h2></div>{projectsState.usingDemo && <span className="role-pill">Demo</span>}</div>
        {projectsState.data === null
          ? <EmptyState title={loading ? 'Loading updates' : 'Updates unavailable'} description={projectsState.error ?? 'Waiting for project updates.'} />
          : recentProjects.length
            ? <div className="activity-list">{recentProjects.map((project, index) => <div className="activity-item" key={project.id}><span className={`activity-dot dot-${index}`} /><div><p>{project.name}</p><small>{project.code} · {project.status} · Milestone {project.milestone || 'not scheduled'}</small></div></div>)}</div>
            : <EmptyState title="No recent projects" description="Project activity will appear after records are created or updated." />}
        <Link className="button ghost full-width" to="/projects">Open project workspace</Link>
      </article>
    </section>

    <section className="card table-card">
      <div className="card-heading"><div><span className="eyebrow">Keep moving</span><h2>My priority tickets</h2></div>{ticketsState.usingDemo ? <span className="role-pill">Demo preview</span> : <Link to="/tickets" className="text-link">Open My Ticket →</Link>}</div>
      {ticketsState.data === null
        ? <EmptyState title={loading ? 'Loading tickets' : 'Ticket data unavailable'} description={ticketsState.error ?? 'Waiting for the ticket service.'} />
        : priorityTickets.length
          ? <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Project</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead><tbody>{priorityTickets.map((ticket) => <tr key={ticket.id}><td>{ticketsState.usingDemo ? <span className="table-link">{ticket.key}</span> : <Link className="table-link" to="/tickets">{ticket.key}</Link>}<span className="cell-title">{ticket.title}</span></td><td>{ticket.project}</td><td><span className={`status status-${ticket.status.toLowerCase().replaceAll(' ', '-')}`}>{ticket.status}</span></td><td><span className={`priority priority-${ticket.priority.toLowerCase()}`}><i style={ticket.priority === 'Critical' ? { background: 'var(--red)' } : undefined} />{ticket.priority}</span></td><td>{ticket.dueDate ?? '—'}</td></tr>)}</tbody></table></div>
          : <EmptyState title="No open priority tickets" description="The ticket service returned no open work for this view." />}
    </section>
  </>
}

function ProjectStatusChart({ counts }: { counts: Record<ProjectStatus, number> }) {
  const statusCounts = PROJECT_STATUSES.map((status) => ({
    status,
    count: counts[status],
  }))
  const largestCount = Math.max(...statusCounts.map((item) => item.count), 1)

  return <div className="market-bars">{statusCounts.map(({ status, count }) => <div className="market-bar" key={status}><div className="market-bar-label"><span>{status}</span><b>{count}</b></div><div className="market-track"><i style={{ width: `${count / largestCount * 100}%`, background: status === 'On hold' || status === 'Cancelled' ? 'var(--amber)' : undefined }} /></div></div>)}</div>
}
