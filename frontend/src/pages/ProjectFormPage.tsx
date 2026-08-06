import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoProjects } from '../data/demo'
import { canCreateProject, canEditProject } from '../permissions/projects'
import type { Project, ProjectStatus } from '../types'
import { useLanguage } from '../i18n'

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
  const { tr, label } = useLanguage()
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
        setLoadError(tr('Project could not be loaded.', '无法加载项目。'))
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
        setLoadError(error instanceof Error ? error.message : tr('Project could not be loaded.', '无法加载项目。'))
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
      setMessage(tr('Your current role cannot save project information.', '当前角色无权保存项目信息。'))
      return
    }
    if (isDemoId) {
      setMessage(label(demoReadOnlyNotice))
      return
    }
    if (loading || loadError) return

    const nextErrors: typeof errors = {}
    const required = editing
      ? ['name', 'product', 'owner', 'team'] as const
      : ['name', 'code', 'product', 'qg4', 'owner', 'team', 'acquisitionDepartment'] as const
    required.forEach((key) => {
      if (!form[key]?.trim()) nextErrors[key] = tr('This field is required', '此字段为必填项')
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
      setMessage(error instanceof Error ? error.message : tr('Project could not be saved.', '项目保存失败。'))
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
        title={tr('Project access restricted', '项目访问受限')}
        description={tr('Your current role has read-only access to project information.', '当前角色只能查看项目信息。')}
        actions={<Link className="button ghost" to={editing && id ? `/projects/${id}` : '/projects'}>{tr('Back to projects', '返回项目列表')}</Link>}
      />
      <section className="card"><EmptyState title={editing ? tr('Editing not permitted', '无权编辑') : tr('Project creation not permitted', '无权创建项目')} description={tr('Use the project workspace to view the records available to you.', '请在项目工作区查看你有权访问的记录。')} /></section>
    </>
  }

  if (loading) {
    return <>
      <PageHeader
        eyebrow="Digital Project Management"
        title={tr('Loading project', '正在加载项目')}
        description={tr('Retrieving the latest project information.', '正在获取最新项目信息。')}
        actions={<Link className="button ghost" to="/projects">{tr('Cancel', '取消')}</Link>}
      />
      <section className="card"><EmptyState title={tr('Loading project', '正在加载项目')} description={tr('Project details are being loaded.', '正在加载项目详情。')} /></section>
    </>
  }

  if (loadError) {
    return <>
      <PageHeader
        eyebrow="Digital Project Management"
        title={tr('Project unavailable', '项目不可用')}
        description={tr('This project cannot be edited because its data was not loaded.', '由于未加载项目数据，当前无法编辑该项目。')}
        actions={<Link className="button ghost" to="/projects">{tr('Back to projects', '返回项目列表')}</Link>}
      />
      <section className="card"><EmptyState title={tr('Project could not be loaded', '无法加载项目')} description={loadError} /></section>
    </>
  }

  return <>
    <PageHeader
      eyebrow="Digital Project Management"
      title={showingDemo ? tr('Preview project', '项目预览') : editing ? tr('Edit project', '编辑项目') : tr('Create new project', '创建新项目')}
      description={showingDemo ? label(demoReadOnlyNotice) : tr('Capture the QG4 context and ownership needed to keep delivery transparent.', '填写 QG4 背景和负责人信息，保证交付过程透明。')}
      actions={<Link className="button ghost" to={cancelPath}>{tr('Cancel', '取消')}</Link>}
    />
    {showingDemo && <div className="notice-bar"><span className="live-dot" />{label(demoReadOnlyNotice)}</div>}
    <form className="card form-card" onSubmit={submit} noValidate>
      <div className="form-intro"><span className="required-mark">*</span> {tr('Required fields.', '必填字段。')} {editing ? tr('A project cannot be deleted after it is created.', '项目创建后不能直接删除。') : tr('New projects always start in DRAFT.', '新项目始终以草稿状态开始。')}</div>
      <div className="form-grid">
        <Field label={tr('Project name', '项目名称')} value={form.name} error={errors.name} onChange={(value) => setValue('name', value)} placeholder={tr('e.g. Highway Pilot Gen 3', '例如：Highway Pilot Gen 3')} required disabled={readOnly} />
        <Field label={tr('Project code', '项目编号')} value={form.code} error={errors.code} onChange={(value) => setValue('code', value)} placeholder="例如：XC-ADAS-24" required={!editing} disabled={editing || readOnly} />
        <Field label={tr('Product / domain', '产品 / 领域')} value={form.product} error={errors.product} onChange={(value) => setValue('product', value)} placeholder="例如：ADAS" required disabled={readOnly} />
        <Field label={tr('QG4 reference', 'QG4 参考编号')} value={form.qg4} error={errors.qg4} onChange={(value) => setValue('qg4', value)} placeholder="例如：QG4-2025-001" required={!editing} disabled={editing || readOnly} />
        <Field label={tr('Project owner', '项目负责人')} value={form.owner} error={errors.owner} onChange={(value) => setValue('owner', value)} placeholder={tr('Name or corporate ID', '姓名或企业账号')} required disabled={readOnly} />
        <Field label={tr('Project team', '项目团队')} value={form.team} error={errors.team} onChange={(value) => setValue('team', value)} placeholder="例如：XC-AS Delivery" required disabled={readOnly} />
        <Field label={tr('Acquisition department', '采购部门')} value={form.acquisitionDepartment} error={errors.acquisitionDepartment} onChange={(value) => setValue('acquisitionDepartment', value)} placeholder="例如：SCP" required={!editing} disabled={editing || readOnly} />
        <Field label={tr('Milestone date', '里程碑日期')} type="date" value={form.milestone} error={errors.milestone} onChange={(value) => setValue('milestone', value)} disabled={readOnly} />
        {editing ? <label className="field">
          <span>{tr('Status', '状态')}</span>
          <select value={form.status} onChange={(event) => setValue('status', event.target.value as ProjectStatus)} disabled={readOnly}>
            {(['Draft', 'Active', 'On hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((value) => <option key={value}>{label(value)}</option>)}
          </select>
        </label> : <label className="field">
          <span>{tr('Initial status', '初始状态')}</span>
          <input value={tr('DRAFT', '草稿')} readOnly />
        </label>}
        <label className="field field-wide">
          <span>{tr('Description', '描述')}</span>
          <textarea rows={5} value={form.description} onChange={(event) => setValue('description', event.target.value)} placeholder={tr('Add context, scope and links for collaborators', '补充背景、范围和协作链接')} disabled={readOnly} />
        </label>
      </div>
      {message && <div className={`form-message ${showingDemo ? '' : 'error-message'}`}>{message}</div>}
      <div className="form-actions">
        <Link className="button ghost" to={cancelPath}>{tr('Cancel', '取消')}</Link>
        <button className="button primary" disabled={saving || readOnly}>
          {showingDemo ? label('Read only') : saving ? tr('Saving…', '正在保存…') : editing ? tr('Save project', '保存项目') : tr('Create project', '创建项目')}
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
