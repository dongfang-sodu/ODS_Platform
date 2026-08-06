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
import { useLanguage } from '../i18n'

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

export function DashboardPage() {
  const { tr, label, language } = useLanguage()
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

    setProjectsState(resolveModule(projectsResult, demoDashboardProjects, tr('Projects could not be loaded.', '无法加载项目。')))
    setTicketsState(resolveModule(ticketsResult, demoTickets, tr('Tickets could not be loaded.', '无法加载工单。')))
    setCoursesState(resolveModule(coursesResult, demoCourses, tr('Academy courses could not be loaded.', '无法加载培训课程。')))
    setMarketState(resolveModule(marketResult, demoMarket, tr('Market summary could not be loaded.', '无法加载市场概览。')))
    setLoading(false)
  }, [tr])

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
    ? tr('No comparison', '暂无对比数据')
    : `${market.yoy >= 0 ? '+' : ''}${market.yoy}% ${tr('average share change', '平均份额变化')}`

  const modules = [
    { label: tr('projects', '项目'), state: projectsState },
    { label: tr('tickets', '工单'), state: ticketsState },
    { label: tr('Academy', '培训课程'), state: coursesState },
    { label: tr('market', '市场'), state: marketState },
  ]
  const failedModules = modules.filter((module) => module.state.error).map((module) => module.label)
  const hasDemoFallback = modules.some((module) => module.state.usingDemo)
  const canCreate = canCreateProject(authSession.user())
  const moduleDetail = <T,>(state: ModuleState<T>, detail: string) => {
    if (state.data === null) return state.error ? label('Unavailable') : tr('Loading...', '加载中...')
    return state.usingDemo ? `${label('Demo preview')} · ${detail}` : detail
  }

  return <>
    <PageHeader
      eyebrow="Good morning, You"
      title="Your workspace"
      description="A clear view of projects, tasks and insights across One Driving System."
      actions={<>
        <button className="button secondary" disabled={loading} onClick={() => void loadDashboard()}>{loading ? tr('Refreshing...', '正在刷新...') : `↻ ${tr('Refresh', '刷新')}`}</button>
        {canCreate && !projectsState.usingDemo && <Link className="button primary" to="/projects/new">＋ {tr('New project', '新建项目')}</Link>}
      </>}
    />

    {hasDemoFallback && <div className="notice-bar" role="status" style={{ flexWrap: 'wrap' }}><span className="live-dot" /><strong>{label(demoReadOnlyNotice)}</strong><span className="role-pill">{label('Preview only')}</span></div>}
    {failedModules.length > 0 && <div className="notice-bar error-message" role="alert" style={{ flexWrap: 'wrap' }}><strong>{tr('Live data unavailable:', '实时数据不可用：')}</strong><span>{failedModules.join(language === 'zh' ? '、' : ', ')}。</span><span className="refresh-label">{hasDemoFallback ? tr('Affected modules show read-only demo data.', '受影响模块显示只读演示数据。') : tr('No demo values were substituted.', '未使用演示数据替代。')}</span></div>}

    <section className="stat-grid">
      <StatCard
        label={tr('Active projects', '进行中项目')}
        value={projectsState.data === null ? '—' : activeProjects}
        detail={moduleDetail(projectsState, `${projectSummary?.totalElements ?? 0} ${tr('total projects', '个项目')}`)}
        tone="blue"
      />
      <StatCard
        label={tr('Open tickets', '未关闭工单')}
        value={ticketsState.data === null ? '—' : openTickets.length}
        detail={moduleDetail(ticketsState, `${urgentTickets} ${tr('critical or high priority', '个紧急或高优先级工单')}`)}
        tone="amber"
      />
      <StatCard
        label={tr('Market sales', '市场销量')}
        value={market ? market.totalSales.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US') : '—'}
        detail={moduleDetail(marketState, market ? `${reportingPeriod} · ${marketChange}` : '')}
        tone="green"
      />
      <StatCard
        label={tr('Academy courses', '培训课程')}
        value={coursesState.data === null ? '—' : courses.length}
        detail={moduleDetail(coursesState, `${publishedCourses} ${tr('published', '门已发布')}`)}
        tone="purple"
      />
    </section>

    <section className="dashboard-grid">
      <article className="card chart-card">
        <div className="card-heading"><div><span className="eyebrow">{tr('Portfolio distribution', '项目组合分布')}</span><h2>{tr('Project status', '项目状态')}</h2></div><Link to="/projects" className="text-link">{tr('View all', '查看全部')} →</Link></div>
        {projectSummary === null
          ? <EmptyState title={loading ? tr('Loading projects', '正在加载项目') : tr('Project data unavailable', '项目数据不可用')} description={projectsState.error ?? tr('Waiting for the project service.', '正在等待项目服务。')} />
          : projectSummary.totalElements
            ? <ProjectStatusChart counts={projectSummary.statusCounts} />
            : <EmptyState title={tr('No projects yet', '暂无项目')} description={tr('The project service returned no records.', '项目服务未返回记录。')} />}
      </article>

      <article className="card activity-card">
        <div className="card-heading"><div><span className="eyebrow">{tr('Latest updates', '最新动态')}</span><h2>{tr('Recent projects', '最近项目')}</h2></div>{projectsState.usingDemo && <span className="role-pill">{label('Demo')}</span>}</div>
        {projectsState.data === null
          ? <EmptyState title={loading ? tr('Loading updates', '正在加载动态') : tr('Updates unavailable', '动态不可用')} description={projectsState.error ?? tr('Waiting for project updates.', '正在等待项目动态。')} />
          : recentProjects.length
            ? <div className="activity-list">{recentProjects.map((project, index) => <div className="activity-item" key={project.id}><span className={`activity-dot dot-${index}`} /><div><p>{project.name}</p><small>{project.code} · {label(project.status)} · {tr('Milestone', '里程碑')} {project.milestone || tr('not scheduled', '未安排')}</small></div></div>)}</div>
            : <EmptyState title={tr('No recent projects', '暂无最近项目')} description={tr('Project activity will appear after records are created or updated.', '创建或更新项目后，这里会显示项目动态。')} />}
        <Link className="button ghost full-width" to="/projects">{tr('Open project workspace', '打开项目工作区')}</Link>
      </article>
    </section>

    <section className="card table-card">
      <div className="card-heading"><div><span className="eyebrow">{tr('Keep moving', '持续推进')}</span><h2>{tr('My priority tickets', '我的优先工单')}</h2></div>{ticketsState.usingDemo ? <span className="role-pill">{label('Demo preview')}</span> : <Link to="/tickets" className="text-link">{tr('Open My Ticket', '打开我的工单')} →</Link>}</div>
      {ticketsState.data === null
        ? <EmptyState title={loading ? tr('Loading tickets', '正在加载工单') : tr('Ticket data unavailable', '工单数据不可用')} description={ticketsState.error ?? tr('Waiting for the ticket service.', '正在等待工单服务。')} />
        : priorityTickets.length
          ? <div className="table-wrap"><table><thead><tr><th>{tr('Ticket', '工单')}</th><th>{tr('Project', '项目')}</th><th>{tr('Status', '状态')}</th><th>{tr('Priority', '优先级')}</th><th>{tr('Due', '截止日期')}</th></tr></thead><tbody>{priorityTickets.map((ticket) => <tr key={ticket.id}><td>{ticketsState.usingDemo ? <span className="table-link">{ticket.key}</span> : <Link className="table-link" to="/tickets">{ticket.key}</Link>}<span className="cell-title">{ticket.title}</span></td><td>{ticket.project}</td><td><span className={`status status-${ticket.status.toLowerCase().replaceAll(' ', '-')}`}>{label(ticket.status)}</span></td><td><span className={`priority priority-${ticket.priority.toLowerCase()}`}><i style={ticket.priority === 'Critical' ? { background: 'var(--red)' } : undefined} />{label(ticket.priority)}</span></td><td>{ticket.dueDate ?? '—'}</td></tr>)}</tbody></table></div>
          : <EmptyState title={tr('No open priority tickets', '暂无未关闭的优先工单')} description={tr('The ticket service returned no open work for this view.', '工单服务未返回当前视图中的待处理事项。')} />}
    </section>
  </>
}

function ProjectStatusChart({ counts }: { counts: Record<ProjectStatus, number> }) {
  const { label } = useLanguage()
  const statusCounts = PROJECT_STATUSES.map((status) => ({
    status,
    count: counts[status],
  }))
  const largestCount = Math.max(...statusCounts.map((item) => item.count), 1)

  return <div className="market-bars">{statusCounts.map(({ status, count }) => <div className="market-bar" key={status}><div className="market-bar-label"><span>{label(status)}</span><b>{count}</b></div><div className="market-track"><i style={{ width: `${count / largestCount * 100}%`, background: status === 'On hold' || status === 'Cancelled' ? 'var(--amber)' : undefined }} /></div></div>)}</div>
}
