import { useEffect, useMemo, useState } from 'react'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoPmoProjects } from '../data/demo'
import type { PmoLevel, PmoProject, PmoRisk } from '../types'

export function PmoPage() {
  const [items, setItems] = useState<PmoProject[]>(demoPmoProjects)
  const [level, setLevel] = useState<'All' | PmoLevel>('All')
  const [risk, setRisk] = useState<'All' | PmoRisk>('All')
  const [showForm, setShowForm] = useState(false)
  const [parentId, setParentId] = useState<string>()
  const [editingProject, setEditingProject] = useState<PmoProject | null>(null)
  const [notice, setNotice] = useState('Loading PMO projects...')
  const user = authSession.user()
  const canManage = Boolean(user?.roles.some((role) => ['PJM', 'EBE', 'EPO', 'LPM', 'ADMIN'].includes(role)))
  const canDelete = Boolean(user?.roles.some((role) => role === 'LPM' || role === 'ADMIN'))
  const roleLabel = user?.roles.join(', ') || 'USER'

  useEffect(() => {
    let alive = true
    api.pmo.list()
      .then((data) => { if (alive) { setItems(data); setNotice('Live data') } })
      .catch((error) => { if (alive) setNotice(error instanceof Error ? error.message : 'PMO projects could not be loaded') })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(
    () => items.filter((item) => (level === 'All' || item.level === level) && (risk === 'All' || item.risk === risk)),
    [items, level, risk],
  )

  const addProject = async (code: string, name: string, capacity: number, selectedParent?: string) => {
    try {
      const input = { code, name, capacity }
      const created = selectedParent
        ? await api.pmo.createChild(selectedParent, input)
        : await api.pmo.create({ ...input, level: 'L0' })
      setItems((current) => [...current, created])
      setNotice('Project saved to the PMO workspace')
      setShowForm(false)
      setParentId(undefined)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'PMO project could not be saved')
      return false
    }
  }

  const remove = async (item: PmoProject) => {
    if (!canDelete || !window.confirm(`Delete ${item.name} from PMO?`)) return
    try {
      await api.pmo.remove(item.id)
      setItems((current) => current.filter((row) => row.id !== item.id && row.parentId !== item.id))
      setNotice('PMO project deleted')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'PMO project could not be deleted')
    }
  }

  const updateProject = async (project: PmoProject) => {
    try {
      const updated = await api.pmo.update(project.id, project)
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice('PMO project updated')
      setEditingProject(null)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'PMO project could not be updated')
      return false
    }
  }

  const exportCsv = () => {
    const headers = ['Level', 'Code', 'Name', 'Source', 'Capacity (FTE)', 'Risk', 'MPR escalation', 'Key project', 'Highlight', 'Parent ID']
    const rows = filtered.map((item) => [item.level, item.code, item.name, item.source ?? 'Manual', item.capacity, item.risk, item.mprEscalation ?? '', item.keyProject, item.highlight, item.parentId ?? ''].map(csvCell).join(','))
    const csv = `\uFEFF${headers.map(csvCell).join(',')}\n${rows.join('\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'ods-pmo-projects.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return <>
    <PageHeader
      eyebrow="Digital Project Management"
      title="PMO project list"
      description="Maintain L0/L1 projects, capacity and risk signals from the PMO perspective."
      actions={<><button className="button secondary" onClick={exportCsv}>⇩ Export</button>{canManage && <button className="button primary" onClick={() => { setParentId(undefined); setShowForm(true) }}>＋ Manually add L0</button>}</>}
    />
    <div className="notice-bar"><span className="live-dot" />{notice}<span className="role-pill">Roles: {roleLabel}</span></div>
    <section className="card filter-card">
      <div className="filter-row">
        <label className="field"><span>Level</span><select value={level} onChange={(event) => setLevel(event.target.value as 'All' | PmoLevel)}><option>All</option><option>L0</option><option>L1</option></select></label>
        <label className="field"><span>Risk status</span><select value={risk} onChange={(event) => setRisk(event.target.value as 'All' | PmoRisk)}><option>All</option><option>Not started</option><option>In progress</option><option>Mitigated</option><option>Escalated</option></select></label>
        <span className="result-count">{filtered.length} visible projects</span>
      </div>
    </section>
    <section className="card table-card">
      <div className="table-toolbar"><div><h2>PMO workspace</h2><p>L1 records inherit context from their parent L0. Only LPM and administrators can delete PMO records.</p></div></div>
      {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Level / project</th><th>Source</th><th>Capacity</th><th>Risk</th><th>Key / highlight</th><th>Operation</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className={`level-project level-${item.level.toLowerCase()}`}><span>{item.level}</span><div><strong>{item.name}</strong><small>{item.code}{item.parentId && ' · child of L0'}</small></div></div></td><td>{item.source || 'Manual'}</td><td>{item.capacity} FTE</td><td><span className={`risk risk-${item.risk.toLowerCase().replace(' ', '-')}`}>{item.risk}</span></td><td>{item.keyProject && <span className="tag">Key</span>}{item.highlight && <span className="tag purple-tag">Highlight</span>}</td><td>{canManage || canDelete ? <div className="operation-buttons">{canManage && item.level === 'L0' && <button className="small-button" onClick={() => { setParentId(item.id); setShowForm(true) }}>＋ L1</button>}{canManage && <button className="small-button" onClick={() => setEditingProject(item)}>Edit</button>}{canDelete && <button className="small-button danger-button" onClick={() => remove(item)}>Delete</button>}</div> : <span className="cell-muted">View only</span>}</td></tr>)}</tbody></table></div> : <EmptyState title="No PMO projects" description="Adjust your filters or add an L0 project to start the hierarchy." actionLabel={canManage ? 'Add L0' : undefined} onAction={canManage ? () => setShowForm(true) : undefined} />}
    </section>
    {showForm && <PmoAddDialog defaultParent={parentId} onClose={() => { setShowForm(false); setParentId(undefined) }} onSubmit={addProject} />}
    {editingProject && <PmoEditDialog project={editingProject} onClose={() => setEditingProject(null)} onSubmit={updateProject} />}
  </>
}

function csvCell(value: string | number | boolean) {
  let text = String(value)
  if (text && '=+-@'.includes(text[0])) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function PmoEditDialog({ project, onClose, onSubmit }: { project: PmoProject; onClose: () => void; onSubmit: (project: PmoProject) => Promise<boolean> }) {
  const [draft, setDraft] = useState(project)
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!valid) return
    setSaving(true)
    const saved = await onSubmit(draft)
    if (!saved) setSaving(false)
  }
  const valid = Boolean(draft.name.trim()) && Number.isFinite(draft.capacity) && draft.capacity >= 0
  return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">PMO workspace</span><h2>Edit {project.level} project</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div><div className="form-grid compact"><label className="field field-wide"><span>Project name *</span><input autoFocus value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} /></label><label className="field"><span>Capacity (FTE)</span><input type="number" min="0" step="0.1" value={draft.capacity} onChange={(event) => setDraft((value) => ({ ...value, capacity: Number(event.target.value) }))} /></label><label className="field"><span>Risk status</span><select value={draft.risk} onChange={(event) => setDraft((value) => ({ ...value, risk: event.target.value as PmoRisk }))}><option>Not started</option><option>In progress</option><option>Mitigated</option><option>Escalated</option></select></label><label className="field field-wide"><span>MPR escalation</span><textarea rows={3} value={draft.mprEscalation ?? ''} onChange={(event) => setDraft((value) => ({ ...value, mprEscalation: event.target.value }))} placeholder="Escalation context" /></label><label className="checkbox-field"><input type="checkbox" checked={draft.keyProject} onChange={(event) => setDraft((value) => ({ ...value, keyProject: event.target.checked }))} /><span>Key project</span></label><label className="checkbox-field"><input type="checkbox" checked={draft.highlight} onChange={(event) => setDraft((value) => ({ ...value, highlight: event.target.checked }))} /><span>Highlight project</span></label></div>{!valid && <p className="modal-hint error-text">Capacity must be zero or greater.</p>}<div className="form-actions"><button className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? 'Saving…' : 'Save changes'}</button></div></div></div>
}

function PmoAddDialog({ defaultParent, onClose, onSubmit }: { defaultParent?: string; onClose: () => void; onSubmit: (code: string, name: string, capacity: number, parent?: string) => Promise<boolean> }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('0')
  const [saving, setSaving] = useState(false)
  const capacityValue = Number(capacity)
  const valid = Boolean(code.trim() && name.trim()) && Number.isFinite(capacityValue) && capacityValue >= 0
  const submit = async () => {
    if (!valid) return
    setSaving(true)
    const saved = await onSubmit(code.trim(), name.trim(), capacityValue, defaultParent)
    if (!saved) setSaving(false)
  }
  return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">PMO workspace</span><h2>{defaultParent ? 'Add L1 project' : 'Add L0 project'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div><div className="form-grid compact"><label className="field"><span>Project code *</span><input autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. PMO-2025-01" /></label><label className="field"><span>Project name *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter a project name" /></label><label className="field"><span>Capacity (FTE)</span><input type="number" min="0" step="0.1" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label></div>{capacity && (!Number.isFinite(capacityValue) || capacityValue < 0) && <p className="modal-hint error-text">Capacity must be zero or greater.</p>}<p className="modal-hint">{defaultParent ? 'This L1 will be created through the selected L0 child endpoint.' : 'You can add L1 workstreams after creating this L0.'}</p><div className="form-actions"><button className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? 'Saving…' : 'Create project'}</button></div></div></div>
}
