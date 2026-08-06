import { useEffect, useMemo, useState } from 'react'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoCourses } from '../data/demo'
import { canCreateAcademyCourse, canManageAcademyCourse } from '../permissions/academy'
import type { Course, CourseInput } from '../types'
import { useLanguage } from '../i18n'

export function AcademyPage() {
  const { language, tr, label } = useLanguage()
  const [courses, setCourses] = useState<Course[]>(demoDataEnabled ? demoCourses : [])
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [completingCourse, setCompletingCourse] = useState<Course | null>(null)
  const [actionCourseId, setActionCourseId] = useState<string>()
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showingDemo, setShowingDemo] = useState(demoDataEnabled)
  const user = authSession.user()
  const canCreate = canCreateAcademyCourse(user)
  const writeEnabled = !loading && !loadFailed && !showingDemo
  const canCreateLive = canCreate && writeEnabled

  useEffect(() => {
    let alive = true
    setLoading(true)
    setLoadFailed(false)
    api.academy.list()
      .then((data) => {
        if (!alive) return
        setCourses(data)
        setShowingDemo(false)
        setNotice(label('Live data'))
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : tr('Courses could not be loaded', '无法加载培训课程')
        setLoadFailed(true)
        setShowForm(false)
        setEditingCourse(null)
        setCompletingCourse(null)
        if (demoDataEnabled) {
          setCourses(demoCourses)
          setShowingDemo(true)
          setNotice(`${label(demoReadOnlyNotice)} · ${message}`)
        } else {
          setCourses([])
          setShowingDemo(false)
          setNotice(message)
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [language])

  const filtered = useMemo(
    () => courses.filter((course) => (status === 'All' || course.status === status) && (!search || `${course.topic} ${course.trainer} ${course.department}`.toLowerCase().includes(search.toLowerCase()))),
    [courses, status, search],
  )

  const saveCourse = async (input: CourseInput) => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('demo courses cannot be changed', '演示课程不可修改')}` : tr('Academy data must load successfully before changes can be made', '培训数据成功加载后才能修改'))
      return false
    }
    const allowed = editingCourse ? canManageAcademyCourse(user, editingCourse) : canCreate
    if (!allowed) {
      setNotice(tr('You do not have permission to maintain this course.', '你没有维护此课程的权限。'))
      setShowForm(false)
      setEditingCourse(null)
      return false
    }
    try {
      const saved = editingCourse
        ? await api.academy.update(editingCourse.id, input)
        : await api.academy.create(input)
      setCourses((current) => editingCourse ? current.map((course) => course.id === saved.id ? saved : course) : [...current, saved])
      setNotice(editingCourse ? tr('Course updated', '课程已更新') : tr('Course draft created', '课程草稿已创建'))
      setShowForm(false)
      setEditingCourse(null)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Course could not be saved', '课程保存失败'))
      return false
    }
  }

  const openCreate = () => {
    if (!canCreateLive) {
      if (showingDemo) setNotice(`${label(demoReadOnlyNotice)} · ${tr('connect the API to add courses', '连接 API 后才能新增课程')}`)
      return
    }
    setEditingCourse(null)
    setShowForm(true)
  }
  const openEdit = (course: Course) => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('demo courses cannot be edited', '演示课程不可编辑')}` : tr('Academy data must load successfully before changes can be made', '培训数据成功加载后才能修改'))
      return
    }
    if (!canManageAcademyCourse(user, course)) {
      setNotice(tr('You do not have permission to maintain this course.', '你没有维护此课程的权限。'))
      return
    }
    setEditingCourse(course)
    setShowForm(true)
  }
  const runAction = async (course: Course, action: 'publish' | 'unpublish' | 'cancel') => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('demo course status cannot be changed', '演示课程状态不可修改')}` : tr('Academy data must load successfully before changes can be made', '培训数据成功加载后才能修改'))
      return
    }
    if (!canManageAcademyCourse(user, course)) {
      setNotice(tr('You do not have permission to maintain this course.', '你没有维护此课程的权限。'))
      return
    }
    if (action === 'cancel' && !window.confirm(`${tr('Cancel', '取消')} ${course.topic}?`)) return
    setActionCourseId(course.id)
    try {
      let updated: Course
      if (action === 'publish') updated = await api.academy.publish(course.id)
      else if (action === 'unpublish') updated = await api.academy.unpublish(course.id)
      else updated = await api.academy.cancel(course.id)
      setCourses((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`${tr('Course status changed to', '课程状态已变更为')} ${label(updated.status)}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Course action failed', '课程操作失败'))
    } finally {
      setActionCourseId(undefined)
    }
  }

  const completeCourse = async (course: Course, materialUploaded: boolean, participationRate?: number) => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('demo courses cannot be completed', '演示课程不可完成')}` : tr('Academy data must load successfully before changes can be made', '培训数据成功加载后才能修改'))
      setCompletingCourse(null)
      return false
    }
    if (!canManageAcademyCourse(user, course)) {
      setNotice(tr('You do not have permission to maintain this course.', '你没有维护此课程的权限。'))
      setCompletingCourse(null)
      return false
    }
    try {
      const updated = await api.academy.complete(course.id, materialUploaded, participationRate)
      setCourses((current) => current.map((item) => item.id === updated.id ? updated : item))
      setCompletingCourse(null)
      setNotice(`${tr('Course status changed to', '课程状态已变更为')} ${label(updated.status)}`)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : tr('Course could not be completed', '课程完成失败'))
      return false
    }
  }
  return <>
    <PageHeader eyebrow="Digital Knowledge" title="Academy library" description="Discover training materials and manage Trims Academy courses from one workspace." actions={canCreateLive ? <button className="button primary" onClick={openCreate}>＋ {tr('Add training course', '新增培训课程')}</button> : undefined} />
    <div className="notice-bar"><span className="live-dot" />{notice}</div>
    <section className="academy-summary"><div><span className="eyebrow">{tr('This quarter', '本季度')}</span><strong>{courses.length}</strong><small>{tr('courses planned', '计划课程')}</small></div><div><span className="eyebrow">{label('Published')}</span><strong>{courses.filter((course) => course.status === 'Published').length}</strong><small>{tr('ready for registration', '可报名')}</small></div><div><span className="eyebrow">{label('Completed')}</span><strong>{courses.filter((course) => course.status === 'Completed').length}</strong><small>{tr('courses delivered', '已完成课程')}</small></div><div className="academy-progress"><span>{tr('Material readiness', '资料准备度')}</span><div><i style={{ width: `${courses.length ? courses.filter((course) => course.materialLocation).length / courses.length * 100 : 0}%` }} /></div><small>{tr('Courses with linked training material', '已关联培训资料的课程')}</small></div></section>
    <section className="card filter-card"><div className="filter-row"><label className="field search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr('Search topic, trainer or department', '搜索主题、培训师或部门')} /></label><label className="field"><span>{tr('Status', '状态')}</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All">{label('All')}</option><option value="Unpublished">{label('Unpublished')}</option><option value="Published">{label('Published')}</option><option value="Invitation sent">{label('Invitation sent')}</option><option value="Completed">{label('Completed')}</option><option value="Cancelled">{label('Cancelled')}</option></select></label><span className="result-count">{filtered.length} {tr('courses', '门课程')}</span></div></section>
    <section className="card table-card"><div className="table-toolbar"><div><h2>{tr('Training courses', '培训课程')}</h2><p>{tr('Publish only when topic, trainer, trainees and training department are complete.', '主题、培训师、学员和培训部门信息完整后再发布课程。')}</p></div>{loading && <span className="loading-label">{tr('Loading…', '加载中…')}</span>}</div>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>{tr('Topic', '主题')}</th><th>{tr('Date', '日期')}</th><th>{tr('Trainer / coordinator', '培训师 / 协调人')}</th><th>{tr('Department', '部门')}</th><th>{tr('Status', '状态')}</th><th>{tr('Material', '资料')}</th><th>{tr('Operation', '操作')}</th></tr></thead><tbody>{filtered.map((course) => <tr key={course.id}><td><strong>{course.topic}</strong><span className="cell-muted">{course.id}</span></td><td>{course.date}</td><td><span className="cell-title">{course.trainer || tr('Not assigned', '未分配')}</span><span className="cell-muted">{course.coordinator}</span></td><td>{course.department}</td><td><span className={`status status-${course.status.toLowerCase().replaceAll(' ', '-')}`}>{label(course.status)}</span></td><td>{course.materialLocation ? <a className="table-link" href={course.materialLocation} target="_blank" rel="noreferrer">{tr('Open folder', '打开文件夹')} ↗</a> : <span className="cell-muted">{tr('Not uploaded', '未上传')}</span>}</td><td>{writeEnabled && canManageAcademyCourse(user, course) ? <CourseActions course={course} busy={actionCourseId === course.id} onEdit={() => openEdit(course)} onComplete={() => setCompletingCourse(course)} onAction={(action) => runAction(course, action)} /> : <span className="cell-muted">{label(showingDemo ? 'Preview only' : 'View only')}</span>}</td></tr>)}</tbody></table></div> : !loading && <EmptyState title={tr('No courses found', '暂无课程')} description={loadFailed ? tr('Academy data could not be loaded. Check the API connection and try again.', '无法加载培训数据，请检查 API 连接后重试。') : tr('Try another filter or add the first training course.', '请更换筛选条件，或新增第一门培训课程。')} actionLabel={canCreateLive ? tr('Add course', '新增课程') : undefined} onAction={canCreateLive ? openCreate : undefined} />}</section>
    {showForm && <CourseDialog course={editingCourse} onClose={() => { setShowForm(false); setEditingCourse(null) }} onSubmit={saveCourse} />}
    {completingCourse && <CompleteCourseDialog course={completingCourse} onClose={() => setCompletingCourse(null)} onSubmit={(materialUploaded, participationRate) => completeCourse(completingCourse, materialUploaded, participationRate)} />}
  </>
}

function CourseActions({ course, busy, onEdit, onComplete, onAction }: { course: Course; busy: boolean; onEdit: () => void; onComplete: () => void; onAction: (action: 'publish' | 'unpublish' | 'cancel') => void }) {
  const { tr } = useLanguage()
  const editable = course.status !== 'Completed' && course.status !== 'Cancelled'
  const publishReady = Boolean(course.trainer.trim() && course.trainee.trim())
  return <div className="operation-buttons">{editable && <button className="small-button" disabled={busy} onClick={onEdit}>{tr('Edit', '编辑')}</button>}{course.status === 'Unpublished' && <button className="small-button" disabled={busy || !publishReady} title={publishReady ? tr('Publish course', '发布课程') : tr('Add a trainer and trainees before publishing', '请先添加培训师和学员')} onClick={() => onAction('publish')}>{tr('Publish', '发布')}</button>}{course.status === 'Published' && <button className="small-button" disabled={busy} onClick={() => onAction('unpublish')}>{tr('Unpublish', '取消发布')}</button>}{(course.status === 'Published' || course.status === 'Invitation sent') && <button className="small-button" disabled={busy} onClick={onComplete}>{tr('Complete', '完成')}</button>}{editable && <button className="small-button danger-button" disabled={busy} onClick={() => onAction('cancel')}>{tr('Cancel', '取消')}</button>}</div>
}

function localDateTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function CourseDialog({ course, onClose, onSubmit }: { course: Course | null; onClose: () => void; onSubmit: (course: CourseInput) => Promise<boolean> }) {
  const { tr } = useLanguage()
  const user = authSession.user()
  const [topic, setTopic] = useState(course?.topic ?? '')
  const [startAt, setStartAt] = useState(localDateTime(course?.startAt))
  const [endAt, setEndAt] = useState(localDateTime(course?.endAt))
  const [trainer, setTrainer] = useState(course?.trainer ?? '')
  const [coordinator, setCoordinator] = useState(course?.coordinator ?? user?.displayName ?? user?.username ?? '')
  const [trainee, setTrainee] = useState(course?.trainee ?? '')
  const [department, setDepartment] = useState(course?.department ?? '')
  const [materialLocation, setMaterialLocation] = useState(course?.materialLocation ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [advancedEmail, setAdvancedEmail] = useState(course?.advancedEmail ?? '')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    setSaving(true)
    const saved = await onSubmit({ topic, startAt, endAt, trainer, coordinator, trainee, trainingDept: department, materialLocation, description, advancedEmail })
    if (!saved) setSaving(false)
  }
  const valid = Boolean(topic.trim() && startAt && endAt && coordinator.trim() && department.trim()) && new Date(endAt).getTime() > new Date(startAt).getTime()
  return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">Trims Academy</span><h2>{course ? tr('Edit training course', '编辑培训课程') : tr('New training course', '新建培训课程')}</h2></div><button className="icon-button" onClick={onClose} aria-label={tr('Close', '关闭')}>×</button></div><div className="form-grid compact"><label className="field field-wide"><span>{tr('Topic', '主题')} *</span><input autoFocus value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={tr('Course topic', '课程主题')} /></label><label className="field"><span>{tr('Start', '开始')} *</span><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label><label className="field"><span>{tr('End', '结束')} *</span><input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label><label className="field"><span>{tr('Trainer', '培训师')}</span><input value={trainer} onChange={(event) => setTrainer(event.target.value)} placeholder={tr('Trainer name', '培训师姓名')} /></label><label className="field"><span>{tr('Coordinator', '协调人')} *</span><input value={coordinator} readOnly aria-readonly="true" /></label><label className="field"><span>{tr('Trainees', '学员')}</span><input value={trainee} onChange={(event) => setTrainee(event.target.value)} placeholder={tr('Names or group', '姓名或群组')} /></label><label className="field"><span>{tr('Training department', '培训部门')} *</span><input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder={tr('Department', '部门')} /></label><label className="field field-wide"><span>{tr('Material location', '资料位置')}</span><input value={materialLocation} onChange={(event) => setMaterialLocation(event.target.value)} placeholder="SharePoint URL" /></label><label className="field field-wide"><span>{tr('Description', '说明')}</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>{course && <label className="field field-wide"><span>{tr('Advanced invitation email', '高级邀请邮件')}</span><textarea rows={5} value={advancedEmail} onChange={(event) => setAdvancedEmail(event.target.value)} placeholder={tr('Optional custom invitation email content', '可选的自定义邀请邮件内容')} /></label>}</div><p className="modal-hint">{tr('The backend stores course times as UTC instants. Local times are converted automatically.', '后端以 UTC 时间保存课程时间，系统会自动转换本地时间。')}</p><div className="form-actions"><button className="button ghost" onClick={onClose}>{tr('Cancel', '取消')}</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? tr('Saving…', '保存中…') : course ? tr('Save changes', '保存修改') : tr('Save draft', '保存草稿')}</button></div></div></div>
}

function CompleteCourseDialog({ course, onClose, onSubmit }: { course: Course; onClose: () => void; onSubmit: (materialUploaded: boolean, participationRate?: number) => Promise<boolean> }) {
  const { tr } = useLanguage()
  const [materialUploaded, setMaterialUploaded] = useState(course.materialUploaded ?? Boolean(course.materialLocation))
  const [participationRate, setParticipationRate] = useState(course.participationRate?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const parsedRate = participationRate.trim() ? Number(participationRate) : undefined
  const valid = parsedRate === undefined || (Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 100)
  const submit = async () => {
    if (!valid) return
    setSaving(true)
    const saved = await onSubmit(materialUploaded, parsedRate)
    if (!saved) setSaving(false)
  }
  return <div className="modal-backdrop"><div className="modal modal-small" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">{tr('Course completion', '课程完成')}</span><h2>{course.topic}</h2></div><button className="icon-button" onClick={onClose} aria-label={tr('Close', '关闭')}>×</button></div><div className="form-grid compact"><label className="checkbox-field field-wide"><input type="checkbox" checked={materialUploaded} onChange={(event) => setMaterialUploaded(event.target.checked)} /><span>{tr('Training material uploaded', '培训资料已上传')}</span></label><label className="field field-wide"><span>{tr('Participation rate (%)', '参与率（%）')}</span><input type="number" min="0" max="100" step="0.1" value={participationRate} onChange={(event) => setParticipationRate(event.target.value)} placeholder={tr('Optional, 0-100', '可选，0-100')} />{!valid && <small className="field-error">{tr('Enter a value between 0 and 100.', '请输入 0 到 100 之间的数值。')}</small>}</label></div>{!materialUploaded && <p className="modal-hint">{tr('The course can be completed now, but the platform will keep the missing-material reminder active.', '即使未上传资料也可以完成课程，但系统会继续显示资料缺失提醒。')}</p>}<div className="form-actions"><button className="button ghost" onClick={onClose}>{tr('Cancel', '取消')}</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? tr('Completing…', '完成中…') : tr('Complete course', '完成课程')}</button></div></div></div>
}
