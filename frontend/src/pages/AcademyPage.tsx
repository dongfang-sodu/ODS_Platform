import { useEffect, useMemo, useState } from 'react'
import { api, authSession } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoCourses } from '../data/demo'
import { canCreateAcademyCourse, canManageAcademyCourse } from '../permissions/academy'
import type { Course, CourseInput } from '../types'

export function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>(demoCourses)
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [completingCourse, setCompletingCourse] = useState<Course | null>(null)
  const [actionCourseId, setActionCourseId] = useState<string>()
  const [notice, setNotice] = useState('Loading Academy courses...')
  const user = authSession.user()
  const canCreate = canCreateAcademyCourse(user)

  useEffect(() => {
    let alive = true
    api.academy.list()
      .then((data) => { if (alive) { setCourses(data); setNotice('Live data') } })
      .catch((error) => { if (alive) setNotice(error instanceof Error ? error.message : 'Courses could not be loaded') })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(
    () => courses.filter((course) => (status === 'All' || course.status === status) && (!search || `${course.topic} ${course.trainer} ${course.department}`.toLowerCase().includes(search.toLowerCase()))),
    [courses, status, search],
  )

  const saveCourse = async (input: CourseInput) => {
    const allowed = editingCourse ? canManageAcademyCourse(user, editingCourse) : canCreate
    if (!allowed) {
      setNotice('You do not have permission to maintain this course.')
      setShowForm(false)
      setEditingCourse(null)
      return false
    }
    try {
      const saved = editingCourse
        ? await api.academy.update(editingCourse.id, input)
        : await api.academy.create(input)
      setCourses((current) => editingCourse ? current.map((course) => course.id === saved.id ? saved : course) : [...current, saved])
      setNotice(editingCourse ? 'Course updated' : 'Course draft created')
      setShowForm(false)
      setEditingCourse(null)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Course could not be saved')
      return false
    }
  }

  const openCreate = () => {
    if (!canCreate) return
    setEditingCourse(null)
    setShowForm(true)
  }
  const openEdit = (course: Course) => {
    if (!canManageAcademyCourse(user, course)) {
      setNotice('You do not have permission to maintain this course.')
      return
    }
    setEditingCourse(course)
    setShowForm(true)
  }
  const runAction = async (course: Course, action: 'publish' | 'unpublish' | 'cancel') => {
    if (!canManageAcademyCourse(user, course)) {
      setNotice('You do not have permission to maintain this course.')
      return
    }
    if (action === 'cancel' && !window.confirm(`Cancel ${course.topic}?`)) return
    setActionCourseId(course.id)
    try {
      let updated: Course
      if (action === 'publish') updated = await api.academy.publish(course.id)
      else if (action === 'unpublish') updated = await api.academy.unpublish(course.id)
      else updated = await api.academy.cancel(course.id)
      setCourses((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`Course status changed to ${updated.status}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Course action failed')
    } finally {
      setActionCourseId(undefined)
    }
  }

  const completeCourse = async (course: Course, materialUploaded: boolean, participationRate?: number) => {
    if (!canManageAcademyCourse(user, course)) {
      setNotice('You do not have permission to maintain this course.')
      setCompletingCourse(null)
      return false
    }
    try {
      const updated = await api.academy.complete(course.id, materialUploaded, participationRate)
      setCourses((current) => current.map((item) => item.id === updated.id ? updated : item))
      setCompletingCourse(null)
      setNotice(`Course status changed to ${updated.status}`)
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Course could not be completed')
      return false
    }
  }
  return <>
    <PageHeader eyebrow="Digital Knowledge" title="Academy library" description="Discover training materials and manage Trims Academy courses from one workspace." actions={canCreate ? <button className="button primary" onClick={openCreate}>＋ Add training course</button> : undefined} />
    <div className="notice-bar"><span className="live-dot" />{notice}</div>
    <section className="academy-summary"><div><span className="eyebrow">This quarter</span><strong>{courses.length}</strong><small>courses planned</small></div><div><span className="eyebrow">Published</span><strong>{courses.filter((course) => course.status === 'Published').length}</strong><small>ready for registration</small></div><div><span className="eyebrow">Completed</span><strong>{courses.filter((course) => course.status === 'Completed').length}</strong><small>courses delivered</small></div><div className="academy-progress"><span>Material readiness</span><div><i style={{ width: `${courses.length ? courses.filter((course) => course.materialLocation).length / courses.length * 100 : 0}%` }} /></div><small>Courses with linked training material</small></div></section>
    <section className="card filter-card"><div className="filter-row"><label className="field search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topic, trainer or department" /></label><label className="field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Unpublished</option><option>Published</option><option>Invitation sent</option><option>Completed</option><option>Cancelled</option></select></label><span className="result-count">{filtered.length} courses</span></div></section>
    <section className="card table-card"><div className="table-toolbar"><div><h2>Training courses</h2><p>Publish only when topic, trainer, trainees and training department are complete.</p></div></div>{filtered.length ? <div className="table-wrap"><table><thead><tr><th>Topic</th><th>Date</th><th>Trainer / coordinator</th><th>Department</th><th>Status</th><th>Material</th><th>Operation</th></tr></thead><tbody>{filtered.map((course) => <tr key={course.id}><td><strong>{course.topic}</strong><span className="cell-muted">{course.id}</span></td><td>{course.date}</td><td><span className="cell-title">{course.trainer || 'Not assigned'}</span><span className="cell-muted">{course.coordinator}</span></td><td>{course.department}</td><td><span className={`status status-${course.status.toLowerCase().replaceAll(' ', '-')}`}>{course.status}</span></td><td>{course.materialLocation ? <a className="table-link" href={course.materialLocation} target="_blank" rel="noreferrer">Open folder ↗</a> : <span className="cell-muted">Not uploaded</span>}</td><td>{canManageAcademyCourse(user, course) ? <CourseActions course={course} busy={actionCourseId === course.id} onEdit={() => openEdit(course)} onComplete={() => setCompletingCourse(course)} onAction={(action) => runAction(course, action)} /> : <span className="cell-muted">View only</span>}</td></tr>)}</tbody></table></div> : <EmptyState title="No courses found" description="Try another filter or add the first training course." actionLabel={canCreate ? 'Add course' : undefined} onAction={canCreate ? openCreate : undefined} />}</section>
    {showForm && <CourseDialog course={editingCourse} onClose={() => { setShowForm(false); setEditingCourse(null) }} onSubmit={saveCourse} />}
    {completingCourse && <CompleteCourseDialog course={completingCourse} onClose={() => setCompletingCourse(null)} onSubmit={(materialUploaded, participationRate) => completeCourse(completingCourse, materialUploaded, participationRate)} />}
  </>
}

function CourseActions({ course, busy, onEdit, onComplete, onAction }: { course: Course; busy: boolean; onEdit: () => void; onComplete: () => void; onAction: (action: 'publish' | 'unpublish' | 'cancel') => void }) {
  const editable = course.status !== 'Completed' && course.status !== 'Cancelled'
  const publishReady = Boolean(course.trainer.trim() && course.trainee.trim())
  return <div className="operation-buttons">{editable && <button className="small-button" disabled={busy} onClick={onEdit}>Edit</button>}{course.status === 'Unpublished' && <button className="small-button" disabled={busy || !publishReady} title={publishReady ? 'Publish course' : 'Add a trainer and trainees before publishing'} onClick={() => onAction('publish')}>Publish</button>}{course.status === 'Published' && <button className="small-button" disabled={busy} onClick={() => onAction('unpublish')}>Unpublish</button>}{(course.status === 'Published' || course.status === 'Invitation sent') && <button className="small-button" disabled={busy} onClick={onComplete}>Complete</button>}{editable && <button className="small-button danger-button" disabled={busy} onClick={() => onAction('cancel')}>Cancel</button>}</div>
}

function localDateTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function CourseDialog({ course, onClose, onSubmit }: { course: Course | null; onClose: () => void; onSubmit: (course: CourseInput) => Promise<boolean> }) {
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
  return <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">Trims Academy</span><h2>{course ? 'Edit training course' : 'New training course'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div><div className="form-grid compact"><label className="field field-wide"><span>Topic *</span><input autoFocus value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Course topic" /></label><label className="field"><span>Start *</span><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label><label className="field"><span>End *</span><input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label><label className="field"><span>Trainer</span><input value={trainer} onChange={(event) => setTrainer(event.target.value)} placeholder="Trainer name" /></label><label className="field"><span>Coordinator *</span><input value={coordinator} readOnly aria-readonly="true" /></label><label className="field"><span>Trainees</span><input value={trainee} onChange={(event) => setTrainee(event.target.value)} placeholder="Names or group" /></label><label className="field"><span>Training department *</span><input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" /></label><label className="field field-wide"><span>Material location</span><input value={materialLocation} onChange={(event) => setMaterialLocation(event.target.value)} placeholder="SharePoint URL" /></label><label className="field field-wide"><span>Description</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>{course && <label className="field field-wide"><span>Advanced invitation email</span><textarea rows={5} value={advancedEmail} onChange={(event) => setAdvancedEmail(event.target.value)} placeholder="Optional custom invitation email content" /></label>}</div><p className="modal-hint">The backend stores course times as UTC instants. Local times are converted automatically.</p><div className="form-actions"><button className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? 'Saving…' : course ? 'Save changes' : 'Save draft'}</button></div></div></div>
}

function CompleteCourseDialog({ course, onClose, onSubmit }: { course: Course; onClose: () => void; onSubmit: (materialUploaded: boolean, participationRate?: number) => Promise<boolean> }) {
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
  return <div className="modal-backdrop"><div className="modal modal-small" role="dialog" aria-modal="true"><div className="card-heading"><div><span className="eyebrow">Course completion</span><h2>{course.topic}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div><div className="form-grid compact"><label className="checkbox-field field-wide"><input type="checkbox" checked={materialUploaded} onChange={(event) => setMaterialUploaded(event.target.checked)} /><span>Training material uploaded</span></label><label className="field field-wide"><span>Participation rate (%)</span><input type="number" min="0" max="100" step="0.1" value={participationRate} onChange={(event) => setParticipationRate(event.target.value)} placeholder="Optional, 0-100" />{!valid && <small className="field-error">Enter a value between 0 and 100.</small>}</label></div>{!materialUploaded && <p className="modal-hint">The course can be completed now, but the platform will keep the missing-material reminder active.</p>}<div className="form-actions"><button className="button ghost" onClick={onClose}>Cancel</button><button className="button primary" disabled={!valid || saving} onClick={submit}>{saving ? 'Completing…' : 'Complete course'}</button></div></div></div>
}
