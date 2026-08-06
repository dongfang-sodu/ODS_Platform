import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoProjects } from '../data/demo'
import { canCreateProject, canEditProject } from '../permissions/projects'
import type { Project, ProjectStatus } from '../types'
import { useLanguage } from '../i18n'

export function ProjectsPage() {
  const { tr, label } = useLanguage()
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
        setApiNotice(label('Live data'))
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : tr('Projects could not be loaded', '无法加载项目')
        if (demoDataEnabled) {
          setProjects(demoProjects)
          setShowingDemo(true)
          setApiNotice(`${label(demoReadOnlyNotice)} · ${tr('Live API unavailable', '实时接口不可用')}：${message}`)
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
      setApiNotice(showingDemo ? label(demoReadOnlyNotice) : tr('Projects must load successfully before they can be exported', '项目成功加载后才能导出'))
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
      setApiNotice(error instanceof Error ? error.message : tr('Project export failed', '项目导出失败'))
    }
  }

  return <>
    <PageHeader
      eyebrow="Digital Project Management"
      title="Project list"
      description="Find, track and maintain every QG4 project in one place."
      actions={liveDataReady ? <>
        <button className="button secondary" onClick={exportCsv}>⇩ {tr('Export list', '导出列表')}</button>
        {canCreate && <Link className="button primary" to="/projects/new">＋ {tr('Create new project', '创建新项目')}</Link>}
      </> : undefined}
    />
    {apiNotice && <div className="notice-bar">
      <span className="live-dot" />
      {apiNotice}
      <button aria-label={tr('Dismiss notice', '关闭提示')} onClick={() => setApiNotice('')}>×</button>
    </div>}
    <section className="card filter-card">
      <div className="filter-row">
        <label className="field search-field">
          <span>⌕</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={tr('Search project, code or owner', '搜索项目、编号或负责人')} />
        </label>
        <label className="field">
          <span>{tr('Status', '状态')}</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="All">{label('All')}</option>
            {(['Draft', 'Active', 'On hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        <button className="button ghost" onClick={clearFilters}>{tr('Clear filters', '清除筛选')}</button>
        <span className="result-count">{filtered.length} {tr(filtered.length === 1 ? 'result' : 'results', filtered.length === 1 ? '条结果' : '条结果')}</span>
      </div>
    </section>
    <section className="card table-card">
      <div className="table-toolbar">
        <div>
          <h2>{tr('All projects', '全部项目')}</h2>
          <p>{tr('Projects cannot be deleted after creation. Contact an administrator for exceptional requests.', '项目创建后不能直接删除。如有特殊情况，请联系管理员。')}</p>
        </div>
        {loading && <span className="loading-label">{tr('Loading…', '加载中…')}</span>}
      </div>
      {loading && projects.length === 0
        ? <EmptyState title={tr('Loading projects', '正在加载项目')} description={tr('Project records are being loaded.', '正在加载项目记录。')} />
        : loadError
          ? <EmptyState title={tr('Projects could not be loaded', '无法加载项目')} description={loadError} />
          : filtered.length
            ? <div className="table-wrap">
              <table>
                <thead><tr><th>{tr('Project', '项目')}</th><th>{tr('Product / QG4', '产品 / QG4')}</th><th>{tr('Owner', '负责人')}</th><th>{tr('Status', '状态')}</th><th>{tr('Milestone', '里程碑')}</th><th /></tr></thead>
                <tbody>{filtered.map((project) => <tr key={project.id}>
                  <td><Link className="table-link" to={`/projects/${project.id}`}>{project.name}</Link><span className="cell-muted">{project.code}</span></td>
                  <td><span className="cell-title">{project.product}</span><span className="cell-muted">{project.qg4}</span></td>
                  <td>{project.owner}</td>
                  <td><span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>{label(project.status)}</span></td>
                  <td>{project.milestone}</td>
                  <td>{!showingDemo && canEdit && <button className="small-button" onClick={() => navigate(`/projects/${project.id}/edit`)}>{tr('Edit', '编辑')}</button>}</td>
                </tr>)}</tbody>
              </table>
            </div>
            : <EmptyState title={tr('No projects found', '未找到项目')} description={tr('Try another keyword or clear your filters.', '请尝试其他关键词或清除筛选条件。')} actionLabel={tr('Clear filters', '清除筛选')} onAction={clearFilters} />}
    </section>
  </>
}
