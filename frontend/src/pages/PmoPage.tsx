import { useEffect, useMemo, useState } from 'react'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoPmoProjects } from '../data/demo'
import type { PmoLevel, PmoProject, PmoRisk } from '../types'
import { useLanguage } from '../i18n'

export function PmoPage() {
  const { language, tr, label } = useLanguage()
  const [items, setItems] = useState<PmoProject[]>(demoDataEnabled ? demoPmoProjects : [])
  const [level, setLevel] = useState<'All' | PmoLevel>('All')
  const [risk, setRisk] = useState<'All' | PmoRisk>('All')
  const [showForm, setShowForm] = useState(false)
  const [parentId, setParentId] = useState<string>()
  const [editingProject, setEditingProject] = useState<PmoProject | null>(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showingDemo, setShowingDemo] = useState(demoDataEnabled)
  const user = authSession.user()
  const canManage = Boolean(user?.roles.some((role) => ['PJM', 'EBE', 'EPO', 'LPM', 'ADMIN'].includes(role)))
  const canDelete = Boolean(user?.roles.some((role) => role === 'LPM' || role === 'ADMIN'))
  const roleLabel = user?.roles.join(', ') || 'USER'
  const writeEnabled = canManage && !loading && !loadFailed && !showingDemo
  const deleteEnabled = canDelete && !loading && !loadFailed && !showingDemo

  useEffect(() => {
    let alive = true
    setLoading(true)
    setLoadFailed(false)
    api.pmo.list()
      .then((data) => {
        if (!alive) return
        setItems(data)
        setShowingDemo(false)
        setNotice(label('Live data'))
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : tr('PMO projects could not be loaded', '无法加载 PMO 项目')
        setLoadFailed(true)
        setShowForm(false)
        setEditingProject(null)
        setParentId(undefined)
        if (demoDataEnabled) {
          setItems(demoPmoProjects)
          setShowingDemo(true)
          setNotice(`${label(demoReadOnlyNotice)} · ${message}`)
        } else {
          setItems([])
          setShowingDemo(false)
          setNotice(message)
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [language])

  const filtered = useMemo(
    () => items.filter((item) => (level === 'All' || item.level === level) && (risk === 'All' || item.risk === risk)),
    [items, level, risk],
  )

  const addProject = async (code: string, name: string, capacity: number, selectedParent?: string) => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('connect the API to add projects', '连接 API 后才能新增项目')}` : tr('PMO data must load successfully before changes can be made', 'PMO 数据成功加载后才能修改'))
      return false
    }
    try {
      const input = { code, name, capacity }
      const created = selectedParent
        ? await api.pmo.createChild(selectedParent, input)
        : await api.pmo.create({ ...input, level: 'L0' })
      setItems((current) => [...current, created])
      setNotice(tr('Project saved to the PMO workspace', '项目已保存到 PMO 工作区'))
      setShowForm(false)
      setParentId(undefined)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('PMO project could not be saved', 'PMO 项目保存失败'))
      return false
    }
  }

  const remove = async (item: PmoProject) => {
    if (!deleteEnabled) {
      if (showingDemo) setNotice(`${label(demoReadOnlyNotice)} · ${tr('demo projects cannot be deleted', '演示项目不可删除')}`)
      return
    }
    if (!window.confirm(`${tr('Delete', '删除')} ${item.name} ${tr('from PMO?', '的 PMO 记录？')}`)) return
    try {
      await api.pmo.remove(item.id)
      setItems((current) => current.filter((row) => row.id !== item.id && row.parentId !== item.id))
      setNotice(tr('PMO project deleted', 'PMO 项目已删除'))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('PMO project could not be deleted', 'PMO 项目删除失败'))
    }
  }

  const updateProject = async (project: PmoProject) => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('demo projects cannot be edited', '演示项目不可编辑')}` : tr('PMO data must load successfully before changes can be made', 'PMO 数据成功加载后才能修改'))
      return false
    }
    try {
      const updated = await api.pmo.update(project.id, project)
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(tr('PMO project updated', 'PMO 项目已更新'))
      setEditingProject(null)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('PMO project could not be updated', 'PMO 项目更新失败'))
      return false
    }
  }

  const exportCsv = () => {
    if (loading) return
    const headers = ['Level', 'Code', 'Name', 'Source', 'Capacity (FTE)', 'Risk', 'MPR escalation', 'Key project', 'Highlight', 'Parent ID']
    const rows = filtered.map((item) => [item.level, item.code, item.name, item.source ?? 'Manual', item.capacity, item.risk, item.mprEscalation ?? '', item.keyProject, item.highlight, item.parentId ?? ''].map(csvCell).join(','))
    const csv = `\uFEFF${headers.map(csvCell).join(',')}\n${rows.join('\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = showingDemo ? 'ods-pmo-demo-preview.csv' : 'ods-pmo-projects.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return <>
    <PageHeader
      eyebrow="Digital Project Management"
      title="PMO project list"
      description="Maintain L0/L1 projects, capacity and risk signals from the PMO perspective."
      actions={<><button className="button secondary" disabled={loading} onClick={exportCsv}>⇩ {tr('Export', '导出')}</button>{writeEnabled && <button className="button primary" onClick={() => { setParentId(undefined); setShowForm(true) }}>＋ {tr('Manually add L0', '手动新增 L0')}</button>}</>}
    />
    <div className="notice-bar"><span className="live-dot" />{notice}<span className="role-pill">{tr('Roles', '角色')}：{roleLabel}</span></div>
    <section className="card filter-card">
      <div className="filter-row">
        <label className="field"><span>{tr('Level', '层级')}</span><select value={level} onChange={(event) => setLevel(event.target.value as 'All' | PmoLevel)}><option value="All">{label('All')}</option><option>L0</option><option>L1</option></select></label>
        <label className="field"><span>{tr('Risk status', '风险状态')}</span><select value={risk} onChange={(event) => setRisk(event.target.value as 'All' | PmoRisk)}><option value="All">{label('All')}</option><option value="Not started">{label('Not started')}</option><option value="In progress">{label('In progress')}</option><option value="Mitigated">{label('Mitigated')}</option><option value="Escalated">{label('Escalated')}</option></select></label>
        <span className="result-count">{filtered.length} {tr('visible projects', '个可见项目')}</span>
      </div>
    </section>
    <section className="card table-card">
      <div className="table-toolbar"><div><h2>{tr('PMO workspace', 'PMO 工作区')}</h2><p>{tr('L1 records inherit context from their parent L0. Only LPM and administrators can delete PMO records.', 'L1 记录继承父级 L0 的上下文，只有 LPM 和管理员可以删除 PMO 记录。')}</p></div>{loading && <span className="loading-label">{tr('Loading…', '加载中…')}</span>}</div>
      {filtered.length ? <div className="table-wrap"><table><thead><tr><th>{tr('Level / project', '层级 / 项目')}</th><th>{tr('Source', '来源')}</th><th>{tr('Capacity', '容量')}</th><th>{tr('Risk', '风险')}</th><th>{tr('Key / highlight', '重点 / 高亮')}</th><th>{tr('Operation', '操作')}</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className={`level-project level-${item.level.toLowerCase()}`}><span>{item.level}</span><div><strong>{item.name}</strong><small>{item.code}{item.parentId && ` · ${tr('child of L0', 'L0 子项目')}`}</small></div></div></td><td>{label(item.source || 'Manual')}</td><td>{item.capacity} FTE</td><td><span className={`risk risk-${item.risk.toLowerCase().replace(' ', '-')}`}>{label(item.risk)}</span></td><td>{item.keyProject && <span className="tag">{tr('Key', '重点')}</span>}{item.highlight && <span className="tag purple-tag">{tr('Highlight', '高亮')}</span>}</td><td>{writeEnabled || deleteEnabled ? <div className="operation-buttons">{writeEnabled && item.level === 'L0' && <button className="small-button" onClick={() => { setParentId(item.id); setShowForm(true) }}>＋ L1</button>}{writeEnabled && <button className="small-button" onClick={() => setEditingProject(item)}>{tr('Edit', '编辑')}</button>}{deleteEnabled && <button className="small-button danger-button" onClick={() => remove(item)}>{tr('Delete', '删除')}</button>}</div> : <span className="cell-muted">{label(showingDemo ? 'Preview only' : 'View only')}</span>}</td></tr>)}</tbody></table></div> : !loading && <EmptyState title={tr('No PMO projects', '暂无 PMO 项目')} description={loadFailed ? tr('PMO data could not be loaded. Check the API connection and try again.', '无法加载 PMO 数据，请检查 API 连接后重试。') : tr('Adjust your filters or add an L0 project to start the hierarchy.', '请调整筛选条件，或新增一个 L0 项目开始建立层级。')} actionLabel={writeEnabled ? tr('Add L0', '新增 L0') : undefined} onAction={writeEnabled ? () => setShowForm(true) : undefined} />}
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
  const { tr, label } = useLanguage()
  const [draft, setDraft] = useState(project)
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!valid) return
    setSaving(true)
    const saved = await onSubmit(draft)
    if (!saved) setSaving(false)
  }
  const valid = Boolean(draft.name.trim()) && Number.isFinite(draft.capacity) && draft.capacity >= 0
  return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">{tr('PMO workspace', 'PMO 工作区')}</span><h2>{tr('Edit', '编辑')} {project.level} {tr('project', '项目')}</h2></div><button className="icon-button" onClick={onClose} aria-label={tr('Close', '关闭')}>×</button></div><div className="form-grid compact"><label className="field field-wide"><span>{tr('Project name', '项目名称')} *</span><input autoFocus value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} /></label><label className="field"><span>{tr('Capacity (FTE)', '容量（FTE）')}</span><input type="number" min="0" step="0.1" value={draft.capacity} onChange={(event) => setDraft((value) => ({ ...value, capacity: Number(event.target.value) }))} /></label><label className="field"><span>{tr('Risk status', '风险状态')}</span><select value={draft.risk} onChange={(event) => setDraft((value) => ({ ...value, risk: event.target.value as PmoRisk }))}><option value="Not started">{label('Not started')}</option><option value="In progress">{label('In progress')}</option><option value="Mitigated">{label('Mitigated')}</option><option value="Escalated">{label('Escalated')}</option></select></label><label className="field field-wide"><span>{tr('MPR escalation', 'MPR 升级说明')}</span><textarea rows={3} value={draft.mprEscalation ?? ''} onChange={(event) => setDraft((value) => ({ ...value, mprEscalation: event.target.value }))} placeholder={tr('Escalation context', '升级背景说明')} /></label><label className="checkbox-field"><input type="checkbox" checked={draft.keyProject} onChange={(event) => setDraft((value) => ({ ...value, keyProject: event.target.checked }))} /><span>{tr('Key project', '重点项目')}</span></label><label className="checkbox-field"><input type="checkbox" checked={draft.highlight} onChange={(event) => setDraft((value) => ({ ...value, highlight: event.target.checked }))} /><span>{tr('Highlight project', '高亮项目')}</span></label></div>{!valid && <p className="modal-hint error-text">{tr('Capacity must be zero or greater.', '容量必须大于或等于零。')}</p>}<div className="form-actions"><button className="button ghost" onClick={onClose}>{tr('Cancel', '取消')}</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? tr('Saving…', '保存中…') : tr('Save changes', '保存修改')}</button></div></div></div>
}

function PmoAddDialog({ defaultParent, onClose, onSubmit }: { defaultParent?: string; onClose: () => void; onSubmit: (code: string, name: string, capacity: number, parent?: string) => Promise<boolean> }) {
  const { tr } = useLanguage()
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
  return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">{tr('PMO workspace', 'PMO 工作区')}</span><h2>{defaultParent ? tr('Add L1 project', '新增 L1 项目') : tr('Add L0 project', '新增 L0 项目')}</h2></div><button className="icon-button" onClick={onClose} aria-label={tr('Close', '关闭')}>×</button></div><div className="form-grid compact"><label className="field"><span>{tr('Project code', '项目编号')} *</span><input autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder={tr('e.g. PMO-2025-01', '例如 PMO-2025-01')} /></label><label className="field"><span>{tr('Project name', '项目名称')} *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={tr('Enter a project name', '输入项目名称')} /></label><label className="field"><span>{tr('Capacity (FTE)', '容量（FTE）')}</span><input type="number" min="0" step="0.1" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label></div>{capacity && (!Number.isFinite(capacityValue) || capacityValue < 0) && <p className="modal-hint error-text">{tr('Capacity must be zero or greater.', '容量必须大于或等于零。')}</p>}<p className="modal-hint">{defaultParent ? tr('This L1 will be created through the selected L0 child endpoint.', '该 L1 将通过所选 L0 的子项目接口创建。') : tr('You can add L1 workstreams after creating this L0.', '创建该 L0 后可以继续添加 L1 工作流。')}</p><div className="form-actions"><button className="button ghost" onClick={onClose}>{tr('Cancel', '取消')}</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? tr('Saving…', '保存中…') : tr('Create project', '创建项目')}</button></div></div></div>
}
