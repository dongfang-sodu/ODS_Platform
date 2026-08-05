import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoProjects } from '../data/demo'
import { canCreateProject, canEditProject } from '../permissions/projects'
import type { Project, ProjectStatus } from '../types'

type FormState = Omit<Project, 'id' | 'updatedAt'>

const blank: FormState = {
  code: '',
  name: '',
  product: '',
  qg4: '',
  owner: '',
  team: '',
  acquisitionDepartment: '',
  status: 'Draft',
  milestone: '',
  description: '',
}

export function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const user = authSession.user()
  const canWrite = editing ? canEditProject(user) : canCreateProject(user)
  const isDemoId = Boolean(id && demoProjects.some((project) => project.id === id))
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(editing)
  const [showingDemo, setShowingDemo] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    setForm(blank)
    setErrors({})
    setMessage('')
    setLoadError('')
    setShowingDemo(false)

    if (!canWrite) {
      setLoading(false)
      return () => { alive = false }
    }

    if (!id) {
      setLoading(false)
      return () => { alive = false }
    }

    setLoading(true)
    const demoProject = demoProjects.find((project) => project.id === id)
    if (demoProject) {
      if (demoDataEnabled) {
        const { id: _id, updatedAt: _updatedAt, ...values } = demoProject
        setForm(values)
        setShowingDemo(true)
      } else {
        setLoadError('Project could not be loaded.')
      }
      setLoading(false)
      return () => { alive = false }
    }

    api.projects.get(id)
      .then(({ id: _id, updatedAt: _updatedAt, ...values }) => {
        if (!alive) return
        setForm(values)
        setShowingDemo(false)
      })
      .catch((error) => {
        if (!alive) return
        setForm(blank)
        setLoadError(error instanceof Error ? error.message : 'Project could not be loaded.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [canWrite, id])

  const setValue = <Key extends keyof FormState,>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) {
      setMessage('Your current role cannot save project information.')
      return
    }
    if (isDemoId) {
      setMessage(demoReadOnlyNotice)
      return
    }
    if (loading || loadError) return

    const nextErrors: typeof errors = {}
    const required = editing
      ? ['name', 'product', 'owner', 'team'] as const
      : ['name', 'code', 'product', 'qg4', 'owner', 'team', 'acquisitionDepartment'] as const
    required.forEach((key) => {
      if (!form[key]?.trim()) nextErrors[key] = 'This field is required'
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setMessage('')
    try {
      if (id) await api.projects.update(id, form)
      else await api.projects.create(form)
      navigate('/projects')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Project could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const cancelPath = editing ? `/projects/${id}` : '/projects'
  const readOnly = !canWrite || showingDemo || isDemoId

  if (!canWrite) {
    return <>
      <PageHeader
        eyebrow="Digital Project Management"
        title="Project access restricted"
        description="Your current role has read-only access to project information."
        actions={<Link className="button ghost" to={editing && id ? `/projects/${id}` : '/projects'}>Back to projects</Link>}
      />
      <section className="card"><EmptyState title={editing ? 'Editing not permitted' : 'Project creation not permitted'} description="Use the project workspace to view the records available to you." /></section>
    </>
  }

  if (loading) {
    return <>
      <PageHeader
        eyebrow="Digital Project Management"
        title="Loading project"
        description="Retrieving the latest project information."
        actions={<Link className="button ghost" to="/projects">Cancel</Link>}
      />
      <section className="card"><EmptyState title="Loading project" description="Project details are being loaded." /></section>
    </>
  }

  if (loadError) {
    return <>
      <PageHeader
        eyebrow="Digital Project Management"
        title="Project unavailable"
        description="This project cannot be edited because its data was not loaded."
        actions={<Link className="button ghost" to="/projects">Back to projects</Link>}
      />
      <section className="card"><EmptyState title="Project could not be loaded" description={loadError} /></section>
    </>
  }

  return <>
    <PageHeader
      eyebrow="Digital Project Management"
      title={showingDemo ? 'Preview project' : editing ? 'Edit project' : 'Create new project'}
      description={showingDemo ? demoReadOnlyNotice : 'Capture the QG4 context and ownership needed to keep delivery transparent.'}
      actions={<Link className="button ghost" to={cancelPath}>Cancel</Link>}
    />
    {showingDemo && <div className="notice-bar"><span className="live-dot" />{demoReadOnlyNotice}</div>}
    <form className="card form-card" onSubmit={submit} noValidate>
      <div className="form-intro"><span className="required-mark">*</span> Required fields. {editing ? 'A project cannot be deleted after it is created.' : 'New projects always start in DRAFT.'}</div>
      <div className="form-grid">
        <Field label="Project name" value={form.name} error={errors.name} onChange={(value) => setValue('name', value)} placeholder="e.g. Highway Pilot Gen 3" required disabled={readOnly} />
        <Field label="Project code" value={form.code} error={errors.code} onChange={(value) => setValue('code', value)} placeholder="e.g. XC-ADAS-24" required={!editing} disabled={editing || readOnly} />
        <Field label="Product / domain" value={form.product} error={errors.product} onChange={(value) => setValue('product', value)} placeholder="e.g. ADAS" required disabled={readOnly} />
        <Field label="QG4 reference" value={form.qg4} error={errors.qg4} onChange={(value) => setValue('qg4', value)} placeholder="e.g. QG4-2025-001" required={!editing} disabled={editing || readOnly} />
        <Field label="Project owner" value={form.owner} error={errors.owner} onChange={(value) => setValue('owner', value)} placeholder="Name or corporate ID" required disabled={readOnly} />
        <Field label="Project team" value={form.team} error={errors.team} onChange={(value) => setValue('team', value)} placeholder="e.g. XC-AS Delivery" required disabled={readOnly} />
        <Field label="Acquisition department" value={form.acquisitionDepartment} error={errors.acquisitionDepartment} onChange={(value) => setValue('acquisitionDepartment', value)} placeholder="e.g. SCP" required={!editing} disabled={editing || readOnly} />
        <Field label="Milestone date" type="date" value={form.milestone} error={errors.milestone} onChange={(value) => setValue('milestone', value)} disabled={readOnly} />
        {editing ? <label className="field">
          <span>Status</span>
          <select value={form.status} onChange={(event) => setValue('status', event.target.value as ProjectStatus)} disabled={readOnly}>
            {(['Draft', 'Active', 'On hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((value) => <option key={value}>{value}</option>)}
          </select>
        </label> : <label className="field">
          <span>Initial status</span>
          <input value="DRAFT" readOnly />
        </label>}
        <label className="field field-wide">
          <span>Description</span>
          <textarea rows={5} value={form.description} onChange={(event) => setValue('description', event.target.value)} placeholder="Add context, scope and links for collaborators" disabled={readOnly} />
        </label>
      </div>
      {message && <div className={`form-message ${showingDemo ? '' : 'error-message'}`}>{message}</div>}
      <div className="form-actions">
        <Link className="button ghost" to={cancelPath}>Cancel</Link>
        <button className="button primary" disabled={saving || readOnly}>
          {showingDemo ? 'Read only' : saving ? 'Saving…' : editing ? 'Save project' : 'Create project'}
        </button>
      </div>
    </form>
  </>
}

function Field({ label, value, error, onChange, placeholder, required, disabled, type = 'text' }: {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  type?: string
}) {
  return <label className={`field ${error ? 'has-error' : ''}`}>
    <span>{label}{required && <em> *</em>}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
    {error && <small className="field-error">{error}</small>}
  </label>
}
