import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import type { VideoGuideline } from '../types'
import { useLanguage } from '../i18n'

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
  const { language, tr, label } = useLanguage()
  const [videos, setVideos] = useState<VideoGuideline[]>(demoDataEnabled ? fallbackVideos : [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [notice, setNotice] = useState('')
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
        setNotice(label('Live data'))
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : tr('Video API unavailable', '视频服务不可用')
        setLoadFailed(true)
        if (demoDataEnabled) {
          setVideos(fallbackVideos)
          setShowingDemo(true)
          setNotice(`${label(demoReadOnlyNotice)} · ${message}`)
        } else {
          setVideos([])
          setShowingDemo(false)
          setNotice(message)
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [language])

  const categories = ['All', ...Array.from(new Set(videos.map((video) => video.category)))]
  const filtered = useMemo(
    () => videos.filter((video) => (category === 'All' || video.category === category) && (!search || `${video.title} ${video.description}`.toLowerCase().includes(search.toLowerCase()))),
    [videos, category, search],
  )
  return <>
    <PageHeader eyebrow="Digital Workspace" title="Video guideline" description="Short, practical walkthroughs to help you get the most from One Driving System." />
    <div className="notice-bar"><span className="live-dot" />{label(notice)}</div>
    <section className="guideline-hero"><div><span className="eyebrow">{tr('Self-service learning', '自助学习')}</span><h2>{tr('Find your next answer in minutes.', '几分钟内找到你需要的答案。')}</h2><p>{tr('Browse the topic library or search for a specific ODS workflow. Hosted videos open in a new tab.', '浏览主题库或搜索具体的 ODS 流程。视频将在新标签页中打开。')}</p></div><div className="hero-play" aria-hidden="true">▶</div></section>
    <section className="card filter-card"><div className="filter-row"><label className="field search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr('Search video topics', '搜索视频主题')} /></label><label className="field"><span>{tr('Category', '分类')}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{label(value)}</option>)}</select></label><span className="result-count">{filtered.length} {tr('guides', '个指南')}</span></div></section>
    {filtered.length ? <section className="video-grid">{filtered.map((video) => <article className="video-card card" key={video.id}><div className={`video-thumb ${video.color ?? 'blue'}`} style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><span>▶</span><small>{video.duration ?? label('Video')}</small></div><div className="video-copy"><span className="eyebrow">{label(video.category)}</span><h2>{label(video.title)}</h2><p>{label(video.description)}</p>{video.videoUrl ? <a className="text-link" href={video.videoUrl} target="_blank" rel="noreferrer">{tr('Watch guide', '观看指南')} ↗</a> : <span className="text-link muted-link">{tr('Video pending', '视频待上传')}</span>}</div></article>)}</section> : <section className="card"><EmptyState
      title={loading ? tr('Loading video guidelines', '正在加载视频指南') : loadFailed ? tr('Video guidelines unavailable', '视频指南不可用') : search || category !== 'All' ? tr('No matching guidelines', '没有匹配的指南') : tr('No published guidelines', '暂无已发布指南')}
      description={loading ? tr('Published guides will appear when loading completes.', '加载完成后将显示已发布指南。') : loadFailed ? tr('The live catalog could not be loaded. Try again after the API is available.', '无法加载实时目录，请确认 API 可用后重试。') : showingDemo ? label(demoReadOnlyNotice) : tr('Published video links will appear here.', '已发布的视频链接将在此显示。')}
    /></section>}
  </>
}
