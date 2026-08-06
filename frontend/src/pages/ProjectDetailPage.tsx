import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoProjects } from '../data/demo'
import { canEditProject } from '../permissions/projects'
import type { AcquisitionStatus, AcquisitionStatusUpdate, Project } from '../types'
import { useLanguage } from '../i18n'

const acquisitionEditorRoles = new Set(['PCB', 'SCP', 'ADMIN'])
type SaveFeedback = { kind: 'success' | 'error'; message: string }

function acquisitionDraft(status: AcquisitionStatus): AcquisitionStatusUpdate {
  return {
    offlineStatus: status.offlineStatus,
    committeeStatus: status.committeeStatus,
    salesforceStatus: status.salesforceStatus,
  }
}

export function ProjectDetailPage() {
  const { tr, label } = useLanguage()
  const { id } = useParams()
  const isDemoId = Boolean(id && demoProjects.some((item) => item.id === id))
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showingDemo, setShowingDemo] = useState(false)
  const [notice, setNotice] = useState('')
  const [acquisition, setAcquisition] = useState<AcquisitionStatus | null>(null)
  const [draft, setDraft] = useState<AcquisitionStatusUpdate | null>(null)
  const [acquisitionLoading, setAcquisitionLoading] = useState(false)
  const [acquisitionError, setAcquisitionError] = useState('')
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null)
  const [saving, setSaving] = useState(false)
  const [acquisitionReload, setAcquisitionReload] = useState(0)
  const user = authSession.user()
  const canEditInformation = canEditProject(user)
  const hasAcquisitionEditorRole = Boolean(user?.roles.some((role) => acquisitionEditorRoles.has(role)))
  const canEditAcquisition = hasAcquisitionEditorRole && !showingDemo && !isDemoId

  const changeAcquisitionStatus = (field: keyof AcquisitionStatusUpdate, value: string) => {
    setDraft((current) => current ? { ...current, [field]: value } : current)
    setSaveFeedback(null)
  }

  useEffect(() => {
    let alive = true
    setProject(null)
    setShowingDemo(false)
    setNotice('')

    if (!id) {
      setLoading(false)
      setNotice(tr('Project id is missing.', '缺少项目编号。'))
      return () => { alive = false }
    }

    setLoading(true)
    const demoProject = demoProjects.find((item) => item.id === id)
    if (demoProject) {
      if (demoDataEnabled) {
        setProject(demoProject)
        setShowingDemo(true)
        setNotice(demoReadOnlyNotice)
      } else {
        setNotice(tr('Project could not be loaded.', '无法加载项目。'))
      }
      setLoading(false)
      return () => { alive = false }
    }

    api.projects.get(id)
      .then((data) => {
        if (!alive) return
        setProject(data)
        setShowingDemo(false)
      })
      .catch((error) => {
        if (!alive) return
        setProject(null)
        setNotice(error instanceof Error ? error.message : tr('Project could not be loaded', '无法加载项目'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [id])

  useEffect(() => {
    let alive = true
    setAcquisition(null)
    setDraft(null)
    setAcquisitionError('')
    setSaveFeedback(null)
    setSaving(false)

    if (!id || project?.id !== id || !project.acquisitionLinked || showingDemo || isDemoId) {
      setAcquisitionLoading(false)
      return () => { alive = false }
    }

    setAcquisitionLoading(true)
    api.projects.getAcquisitionStatus(id)
      .then((data) => {
        if (!alive) return
        setAcquisition(data)
        setDraft(acquisitionDraft(data))
      })
      .catch((error) => {
        if (!alive) return
        setAcquisitionError(error instanceof Error ? error.message : tr('Acquisition status could not be loaded', '无法加载采购状态'))
      })
      .finally(() => {
        if (alive) setAcquisitionLoading(false)
      })

    return () => { alive = false }
  }, [acquisitionReload, id, isDemoId, project?.acquisitionLinked, project?.id, showingDemo])

  const saveAcquisitionStatus = async () => {
    if (!id || !draft || !canEditAcquisition || saving) return

    const payload: AcquisitionStatusUpdate = {
      offlineStatus: draft.offlineStatus.trim(),
      committeeStatus: draft.committeeStatus.trim(),
      salesforceStatus: draft.salesforceStatus.trim(),
    }
    if (Object.values(payload).some((value) => !value)) {
      setSaveFeedback({ kind: 'error', message: tr('All three status fields are required.', '三个状态字段均为必填项。') })
      return
    }

    setSaving(true)
    setSaveFeedback(null)
    try {
      const updated = await api.projects.updateAcquisitionStatus(id, payload)
      setAcquisition(updated)
      setDraft(acquisitionDraft(updated))
      setSaveFeedback({ kind: 'success', message: tr('Acquisition status saved.', '采购状态已保存。') })
    } catch (error) {
      setSaveFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : tr('Acquisition status could not be saved', '采购状态保存失败'),
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <>
      <PageHeader
        eyebrow={tr('Project detail', '项目详情')}
        title={tr('Loading project', '正在加载项目')}
        description={tr('Retrieving the latest project information.', '正在获取最新项目信息。')}
        actions={<Link className="button ghost" to="/projects">← {tr('Back to list', '返回列表')}</Link>}
      />
      <section className="card"><EmptyState title={tr('Loading project', '正在加载项目')} description={tr('Project details are being loaded.', '正在加载项目详情。')} /></section>
    </>
  }

  if (!project) {
    return <>
      <PageHeader
        eyebrow={tr('Project detail', '项目详情')}
        title={tr('Project unavailable', '项目不可用')}
        description={tr('No project record can be displayed for this address.', '此地址没有可显示的项目记录。')}
        actions={<Link className="button ghost" to="/projects">← {tr('Back to list', '返回列表')}</Link>}
      />
      <section className="card"><EmptyState title={tr('Project could not be loaded', '无法加载项目')} description={notice || tr('The requested project was not found.', '未找到请求的项目。')} /></section>
    </>
  }

  return <>
    <PageHeader
      eyebrow={tr('Project detail', '项目详情')}
      title={project.name}
      description={`${project.code} · ${project.product}`}
      actions={<>
        <Link className="button ghost" to="/projects">← {tr('Back to list', '返回列表')}</Link>
        {canEditInformation && !showingDemo && !isDemoId && <Link className="button primary" to={`/projects/${project.id}/edit`}>{tr('Edit information', '编辑信息')}</Link>}
      </>}
    />
    {notice && <div className="notice-bar"><span className="live-dot" />{notice}</div>}
    <div className="detail-grid">
      <section className="card detail-card">
        <div className="card-heading">
          <div><span className="eyebrow">{tr('General information', '基本信息')}</span><h2>{tr('Project overview', '项目概览')}</h2></div>
          <span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>{label(project.status)}</span>
        </div>
        <dl className="detail-list">
          <div><dt>{tr('Project code', '项目编号')}</dt><dd>{project.code}</dd></div>
          <div><dt>{tr('Product / domain', '产品 / 领域')}</dt><dd>{project.product}</dd></div>
          <div><dt>{tr('QG4 reference', 'QG4 参考编号')}</dt><dd>{project.qg4}</dd></div>
          <div><dt>{tr('Project owner', '项目负责人')}</dt><dd>{project.owner}</dd></div>
          <div><dt>{tr('Project team', '项目团队')}</dt><dd>{project.team || tr('Not provided', '未提供')}</dd></div>
          <div><dt>{tr('Milestone date', '里程碑日期')}</dt><dd>{project.milestone || tr('Not scheduled', '未安排')}</dd></div>
        </dl>
        <div className="description-block"><h3>{tr('Scope and context', '范围和背景')}</h3><p>{project.description || tr('No description has been added yet.', '尚未添加描述。')}</p></div>
      </section>
      <section className="card timeline-card">
        <div className="card-heading">
          <div><span className="eyebrow">{tr('Delivery plan', '交付计划')}</span><h2>{tr('Milestones', '里程碑')}</h2></div>
        </div>
        <ol className="timeline">
          <li className={project.milestone ? 'current' : ''}><span />QG4 · {project.milestone || tr('Date pending', '日期待定')}<small>{project.milestone ? tr('Scheduled', '已安排') : tr('Not scheduled', '未安排')} · {tr('Owner', '负责人')}：{project.owner}</small></li>
        </ol>
      </section>
    </div>
    {project.acquisitionLinked && <section className="card acquisition-card">
      <div className="card-heading">
        <div><span className="eyebrow">{tr('Acquisition tracking', '采购跟踪')}</span><h2>{tr('Acquisition status', '采购状态')}</h2></div>
        {!acquisitionLoading && acquisition && <span className="role-pill">{canEditAcquisition ? label('Editable') : label('Read only')}</span>}
      </div>

      {showingDemo || isDemoId ? (
        <EmptyState title={tr('Acquisition status is read only', '采购状态为只读')} description={label(demoReadOnlyNotice)} />
      ) : acquisitionLoading || (!acquisition && !acquisitionError) ? (
        <div className="acquisition-state" role="status">{tr('Loading acquisition status...', '正在加载采购状态...')}</div>
      ) : acquisitionError ? (
        <div className="acquisition-state" role="alert">
          <p>{acquisitionError}</p>
          <button className="button ghost" onClick={() => setAcquisitionReload((value) => value + 1)}>{tr('Try again', '重试')}</button>
        </div>
      ) : acquisition && draft ? (
        canEditAcquisition ? <>
          <div className="acquisition-form">
            <label className="field"><span>{tr('Offline status', '线下状态')}</span><input required maxLength={80} value={draft.offlineStatus} onChange={(event) => changeAcquisitionStatus('offlineStatus', event.target.value)} disabled={saving} /></label>
            <label className="field"><span>{tr('Committee status', '委员会状态')}</span><input required maxLength={80} value={draft.committeeStatus} onChange={(event) => changeAcquisitionStatus('committeeStatus', event.target.value)} disabled={saving} /></label>
            <label className="field"><span>{tr('Salesforce status', 'Salesforce 状态')}</span><input required maxLength={80} value={draft.salesforceStatus} onChange={(event) => changeAcquisitionStatus('salesforceStatus', event.target.value)} disabled={saving} /></label>
            <label className="field"><span>{tr('Owner department', '负责部门')}</span><input value={acquisition.ownerDepartment || tr('Not provided', '未提供')} readOnly /></label>
          </div>
          {saveFeedback && <p className={`form-message ${saveFeedback.kind === 'success' ? 'success-message' : 'error-message'}`} role={saveFeedback.kind === 'success' ? 'status' : 'alert'}>{saveFeedback.message}</p>}
          <div className="form-actions acquisition-actions">
            <button className="button ghost" disabled={saving} onClick={() => { setDraft(acquisitionDraft(acquisition)); setSaveFeedback(null) }}>{tr('Reset', '重置')}</button>
            <button className="button primary" disabled={saving} onClick={saveAcquisitionStatus}>{saving ? tr('Saving...', '正在保存...') : tr('Save status', '保存状态')}</button>
          </div>
        </> : <dl className="detail-list acquisition-list">
          <div><dt>{tr('Offline status', '线下状态')}</dt><dd>{acquisition.offlineStatus}</dd></div>
          <div><dt>{tr('Committee status', '委员会状态')}</dt><dd>{acquisition.committeeStatus}</dd></div>
          <div><dt>{tr('Salesforce status', 'Salesforce 状态')}</dt><dd>{acquisition.salesforceStatus}</dd></div>
          <div><dt>{tr('Owner department', '负责部门')}</dt><dd>{acquisition.ownerDepartment || tr('Not provided', '未提供')}</dd></div>
        </dl>
      ) : (
        <div className="acquisition-state">{tr('Acquisition status is unavailable.', '采购状态不可用。')}</div>
      )}
    </section>}
  </>
}
