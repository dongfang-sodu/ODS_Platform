import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import type { VideoGuideline } from '../types'

const fallbackVideos: VideoGuideline[] = [
  { id: 'login', title: 'How to log in', category: 'Getting started', duration: '02:18', description: 'Sign in to ODS and understand the workspace home page.', color: 'blue', sortOrder: 1, published: true },
  { id: 'access', title: 'Request access', category: 'Getting started', duration: '03:42', description: 'Request access to a module or project dashboard.', color: 'purple', sortOrder: 2, published: true },
  { id: 'create-project', title: 'Create a project', category: 'Project management', duration: '05:10', description: 'Create a QG4 project and capture its ownership details.', color: 'green', sortOrder: 3, published: true },
  { id: 'project-list', title: 'View project list and information', category: 'Project management', duration: '04:36', description: 'Search, filter and open project details.', color: 'amber', sortOrder: 4, published: true },
  { id: 'filter-project', title: 'Filter and search projects', category: 'Project management', duration: '02:54', description: 'Use keyword search and definition filters effectively.', color: 'blue', sortOrder: 5, published: true },
  { id: 'edit-project', title: 'Edit project information', category: 'Project management', duration: '03:06', description: 'Update milestones and project context safely.', color: 'purple', sortOrder: 6, published: true },
  { id: 'overview', title: 'Project overview and upcoming tasks', category: 'Project dashboard', duration: '04:22', description: 'Read project health, change requests and overdue tasks.', color: 'green', sortOrder: 7, published: true },
  { id: 'milestone', title: 'Download the milestone plan', category: 'Project dashboard', duration: '02:47', description: 'Check and download a project milestone plan in PPT format.', color: 'amber', sortOrder: 8, published: true },
  { id: 'cost', title: 'Cost planning module', category: 'Project management', duration: '03:58', description: 'Navigate to cost planning and review the current plan.', color: 'blue', sortOrder: 9, published: true },
  { id: 'favorites', title: 'Manage favorite link pages', category: 'Workspace', duration: '02:31', description: 'View, add, edit and clear favorite pages.', color: 'purple', sortOrder: 10, published: true },
  { id: 'cache', title: 'Clear browser cache', category: 'Support', duration: '01:45', description: 'Resolve common display issues by clearing cached assets.', color: 'amber', sortOrder: 11, published: true },
]

export function VideoGuidelinePage() {
  const [videos, setVideos] = useState<VideoGuideline[]>(demoDataEnabled ? fallbackVideos : [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [notice, setNotice] = useState(demoDataEnabled ? `${demoReadOnlyNotice} · loading published video guidelines` : 'Loading published video guidelines...')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showingDemo, setShowingDemo] = useState(demoDataEnabled)

  useEffect(() => {
    let alive = true
    api.guidelines.list()
      .then((data) => {
        if (!alive) return
        setVideos(data)
        setShowingDemo(false)
        setNotice('Live data')
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : 'Video API unavailable'
        setLoadFailed(true)
        if (demoDataEnabled) {
          setVideos(fallbackVideos)
          setShowingDemo(true)
          setNotice(`${demoReadOnlyNotice} · ${message}`)
        } else {
          setVideos([])
          setShowingDemo(false)
          setNotice(message)
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const categories = ['All', ...Array.from(new Set(videos.map((video) => video.category)))]
  const filtered = useMemo(
    () => videos.filter((video) => (category === 'All' || video.category === category) && (!search || `${video.title} ${video.description}`.toLowerCase().includes(search.toLowerCase()))),
    [videos, category, search],
  )
  return <>
    <PageHeader eyebrow="Digital Workspace" title="Video guideline" description="Short, practical walkthroughs to help you get the most from One Driving System." />
    <div className="notice-bar"><span className="live-dot" />{notice}</div>
    <section className="guideline-hero"><div><span className="eyebrow">Self-service learning</span><h2>Find your next answer in minutes.</h2><p>Browse the topic library or search for a specific ODS workflow. Hosted videos open in a new tab.</p></div><div className="hero-play" aria-hidden="true">▶</div></section>
    <section className="card filter-card"><div className="filter-row"><label className="field search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search video topics" /></label><label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><span className="result-count">{filtered.length} guides</span></div></section>
    {filtered.length ? <section className="video-grid">{filtered.map((video) => <article className="video-card card" key={video.id}><div className={`video-thumb ${video.color ?? 'blue'}`} style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span>▶</span><small>{video.duration ?? 'Video'}</small></div><div className="video-copy"><span className="eyebrow">{video.category}</span><h2>{video.title}</h2><p>{video.description}</p>{video.videoUrl ? <a className="text-link" href={video.videoUrl} target="_blank" rel="noreferrer">Watch guide ↗</a> : <span className="text-link muted-link">Video pending</span>}</div></article>)}</section> : <section className="card"><EmptyState
      title={loading ? 'Loading video guidelines' : loadFailed ? 'Video guidelines unavailable' : search || category !== 'All' ? 'No matching guidelines' : 'No published guidelines'}
      description={loading ? 'Published guides will appear when loading completes.' : loadFailed ? 'The live catalog could not be loaded. Try again after the API is available.' : showingDemo ? demoReadOnlyNotice : 'Published video links will appear here.'}
    /></section>}
  </>
}
