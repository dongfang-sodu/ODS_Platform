import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoProjects } from '../data/demo'
import { canEditProject } from '../permissions/projects'
import type { AcquisitionStatus, AcquisitionStatusUpdate, Project } from '../types'

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
      setNotice('Project id is missing.')
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
        setNotice('Project could not be loaded.')
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
        setNotice(error instanceof Error ? error.message : 'Project could not be loaded')
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
        setAcquisitionError(error instanceof Error ? error.message : 'Acquisition status could not be loaded')
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
      setSaveFeedback({ kind: 'error', message: 'All three status fields are required.' })
      return
    }

    setSaving(true)
    setSaveFeedback(null)
    try {
      const updated = await api.projects.updateAcquisitionStatus(id, payload)
      setAcquisition(updated)
      setDraft(acquisitionDraft(updated))
      setSaveFeedback({ kind: 'success', message: 'Acquisition status saved.' })
    } catch (error) {
      setSaveFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Acquisition status could not be saved',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <>
      <PageHeader
        eyebrow="Project detail"
        title="Loading project"
        description="Retrieving the latest project information."
        actions={<Link className="button ghost" to="/projects">← Back to list</Link>}
      />
      <section className="card"><EmptyState title="Loading project" description="Project details are being loaded." /></section>
    </>
  }

  if (!project) {
    return <>
      <PageHeader
        eyebrow="Project detail"
        title="Project unavailable"
        description="No project record can be displayed for this address."
        actions={<Link className="button ghost" to="/projects">← Back to list</Link>}
      />
      <section className="card"><EmptyState title="Project could not be loaded" description={notice || 'The requested project was not found.'} /></section>
    </>
  }

  return <>
    <PageHeader
      eyebrow="Project detail"
      title={project.name}
      description={`${project.code} · ${project.product}`}
      actions={<>
        <Link className="button ghost" to="/projects">← Back to list</Link>
        {canEditInformation && !showingDemo && !isDemoId && <Link className="button primary" to={`/projects/${project.id}/edit`}>Edit information</Link>}
      </>}
    />
    {notice && <div className="notice-bar"><span className="live-dot" />{notice}</div>}
    <div className="detail-grid">
      <section className="card detail-card">
        <div className="card-heading">
          <div><span className="eyebrow">General information</span><h2>Project overview</h2></div>
          <span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span>
        </div>
        <dl className="detail-list">
          <div><dt>Project code</dt><dd>{project.code}</dd></div>
          <div><dt>Product / domain</dt><dd>{project.product}</dd></div>
          <div><dt>QG4 reference</dt><dd>{project.qg4}</dd></div>
          <div><dt>Project owner</dt><dd>{project.owner}</dd></div>
          <div><dt>Project team</dt><dd>{project.team || 'Not provided'}</dd></div>
          <div><dt>Milestone date</dt><dd>{project.milestone || 'Not scheduled'}</dd></div>
        </dl>
        <div className="description-block"><h3>Scope and context</h3><p>{project.description || 'No description has been added yet.'}</p></div>
      </section>
      <section className="card timeline-card">
        <div className="card-heading">
          <div><span className="eyebrow">Delivery plan</span><h2>Milestones</h2></div>
        </div>
        <ol className="timeline">
          <li className={project.milestone ? 'current' : ''}><span />QG4 · {project.milestone || 'Date pending'}<small>{project.milestone ? 'Scheduled' : 'Not scheduled'} · Owner: {project.owner}</small></li>
        </ol>
      </section>
    </div>
    {project.acquisitionLinked && <section className="card acquisition-card">
      <div className="card-heading">
        <div><span className="eyebrow">Acquisition tracking</span><h2>Acquisition status</h2></div>
        {!acquisitionLoading && acquisition && <span className="role-pill">{canEditAcquisition ? 'Editable' : 'Read only'}</span>}
      </div>

      {showingDemo || isDemoId ? (
        <EmptyState title="Acquisition status is read only" description={demoReadOnlyNotice} />
      ) : acquisitionLoading || (!acquisition && !acquisitionError) ? (
        <div className="acquisition-state" role="status">Loading acquisition status...</div>
      ) : acquisitionError ? (
        <div className="acquisition-state" role="alert">
          <p>{acquisitionError}</p>
          <button className="button ghost" onClick={() => setAcquisitionReload((value) => value + 1)}>Try again</button>
        </div>
      ) : acquisition && draft ? (
        canEditAcquisition ? <>
          <div className="acquisition-form">
            <label className="field"><span>Offline status</span><input required maxLength={80} value={draft.offlineStatus} onChange={(event) => changeAcquisitionStatus('offlineStatus', event.target.value)} disabled={saving} /></label>
            <label className="field"><span>Committee status</span><input required maxLength={80} value={draft.committeeStatus} onChange={(event) => changeAcquisitionStatus('committeeStatus', event.target.value)} disabled={saving} /></label>
            <label className="field"><span>Salesforce status</span><input required maxLength={80} value={draft.salesforceStatus} onChange={(event) => changeAcquisitionStatus('salesforceStatus', event.target.value)} disabled={saving} /></label>
            <label className="field"><span>Owner department</span><input value={acquisition.ownerDepartment || 'Not provided'} readOnly /></label>
          </div>
          {saveFeedback && <p className={`form-message ${saveFeedback.kind === 'success' ? 'success-message' : 'error-message'}`} role={saveFeedback.kind === 'success' ? 'status' : 'alert'}>{saveFeedback.message}</p>}
          <div className="form-actions acquisition-actions">
            <button className="button ghost" disabled={saving} onClick={() => { setDraft(acquisitionDraft(acquisition)); setSaveFeedback(null) }}>Reset</button>
            <button className="button primary" disabled={saving} onClick={saveAcquisitionStatus}>{saving ? 'Saving...' : 'Save status'}</button>
          </div>
        </> : <dl className="detail-list acquisition-list">
          <div><dt>Offline status</dt><dd>{acquisition.offlineStatus}</dd></div>
          <div><dt>Committee status</dt><dd>{acquisition.committeeStatus}</dd></div>
          <div><dt>Salesforce status</dt><dd>{acquisition.salesforceStatus}</dd></div>
          <div><dt>Owner department</dt><dd>{acquisition.ownerDepartment || 'Not provided'}</dd></div>
        </dl>
      ) : (
        <div className="acquisition-state">Acquisition status is unavailable.</div>
      )}
    </section>}
  </>
}
