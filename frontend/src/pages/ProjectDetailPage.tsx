import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import { demoProjects } from '../data/demo'
import type { Project } from '../types'

export function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<Project>(demoProjects.find((item) => item.id === id) ?? demoProjects[0])
  const [notice, setNotice] = useState('')
  useEffect(() => { if (!id) return; let alive = true; api.projects.get(id).then((data) => alive && setProject(data)).catch((error) => alive && setNotice(error instanceof Error ? error.message : 'Project could not be loaded')); return () => { alive = false } }, [id])
  return <><PageHeader eyebrow="Project detail" title={project.name} description={`${project.code} · ${project.product}`} actions={<><Link className="button ghost" to="/projects">← Back to list</Link><Link className="button primary" to={`/projects/${project.id}/edit`}>Edit information</Link></>} />{notice && <div className="notice-bar">{notice}</div>}<div className="detail-grid"><section className="card detail-card"><div className="card-heading"><div><span className="eyebrow">General information</span><h2>Project overview</h2></div><span className={`status status-${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span></div><dl className="detail-list"><div><dt>Project code</dt><dd>{project.code}</dd></div><div><dt>Product / domain</dt><dd>{project.product}</dd></div><div><dt>QG4 reference</dt><dd>{project.qg4}</dd></div><div><dt>Project owner</dt><dd>{project.owner}</dd></div><div><dt>Project team</dt><dd>{project.team || 'Not provided'}</dd></div><div><dt>Milestone date</dt><dd>{project.milestone || 'Not scheduled'}</dd></div></dl><div className="description-block"><h3>Scope and context</h3><p>{project.description || 'No description has been added yet.'}</p></div></section><section className="card timeline-card"><div className="card-heading"><div><span className="eyebrow">Delivery plan</span><h2>Milestones</h2></div><button className="small-button">＋ Add</button></div><ol className="timeline"><li className="done"><span />QG1 · Concept approved<small>Completed · 2024-04-12</small></li><li className="done"><span />QG2 · Requirements baseline<small>Completed · 2024-06-20</small></li><li className="current"><span />QG4 · {project.milestone || 'Date pending'}<small>In progress · Owner: {project.owner}</small></li><li><span />SOP readiness<small>Planned · To be confirmed</small></li></ol></section></div></>
}
