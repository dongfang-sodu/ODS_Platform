import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoTickets } from '../data/demo'
import type { Ticket } from '../types'
import { useLanguage } from '../i18n'

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export function TicketsPage() {
  const { language, tr, label } = useLanguage()
  const [tickets, setTickets] = useState<Ticket[]>(demoDataEnabled ? demoTickets : [])
  const [filter, setFilter] = useState<'All' | Ticket['status']>('All')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showingDemo, setShowingDemo] = useState(demoDataEnabled)
  const writeEnabled = !loading && !loadFailed && !showingDemo

  const loadTickets = async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const data = await api.tickets.list()
      setTickets(data)
      setShowingDemo(false)
      setNotice(label('Live data'))
    } catch (error) {
      const message = error instanceof Error ? error.message : tr('Tickets could not be loaded', '无法加载工单')
      setLoadFailed(true)
      if (demoDataEnabled) {
        setTickets(demoTickets)
        setShowingDemo(true)
        setNotice(`${label(demoReadOnlyNotice)} · ${message}`)
      } else {
        setTickets([])
        setShowingDemo(false)
        setNotice(message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTickets() }, [language])
  const visible = useMemo(
    () => tickets.filter((ticket) => filter === 'All' || ticket.status === filter).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [tickets, filter],
  )

  const cyclePriority = async (ticket: Ticket) => {
    if (!writeEnabled) {
      setNotice(showingDemo ? `${label(demoReadOnlyNotice)} · ${tr('demo ticket priorities cannot be changed', '演示工单优先级不可修改')}` : tr('Tickets must load successfully before priorities can be changed', '工单成功加载后才能修改优先级'))
      return
    }
    const next: Ticket['priority'] = ticket.priority === 'Critical' ? 'High' : ticket.priority === 'High' ? 'Medium' : ticket.priority === 'Medium' ? 'Low' : 'Critical'
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, priority: next } : item))
    try {
      const updated = await api.tickets.update(ticket.id, { priority: next })
      setTickets((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`${ticket.key} ${tr('priority updated', '优先级已更新')}`)
    } catch (error) {
      setTickets((current) => current.map((item) => item.id === ticket.id ? ticket : item))
      setNotice(error instanceof Error ? error.message : tr('Ticket could not be updated', '工单更新失败'))
    }
  }

  return <>
    <PageHeader eyebrow="Digital Workspace" title="My ticket" description="A focused daily queue for tickets assigned to you across ODS projects." actions={<button className="button secondary" disabled={loading} onClick={loadTickets}>↻ {tr('Refresh tickets', '刷新工单')}</button>} />
    <div className="notice-bar"><span className="live-dot" />{label(notice)}<span className="refresh-label">{tr('Authenticated user scope', '当前登录用户范围')}</span></div>
    <section className="ticket-summary"><div><span className="eyebrow">{tr('Today', '今天')}</span><strong>{tickets.filter((ticket) => ticket.status !== 'Done').length}</strong><small>{tr('open tickets', '未关闭工单')}</small></div><div className="ticket-priority"><span className="priority-dot critical" /><strong>{tickets.filter((ticket) => ticket.priority === 'Critical').length}</strong><small>{tr('critical priority', '紧急优先级')}</small></div><div className="ticket-priority"><span className="priority-dot high" /><strong>{tickets.filter((ticket) => ticket.priority === 'High').length}</strong><small>{tr('high priority', '高优先级')}</small></div><div className="ticket-priority"><span className="priority-dot medium" /><strong>{tickets.filter((ticket) => ticket.priority === 'Medium').length}</strong><small>{tr('medium priority', '中优先级')}</small></div></section>
    <section className="card filter-card"><div className="filter-tabs">{(['All', 'To do', 'In progress', 'Blocked', 'Done'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label(value)}<span>{value === 'All' ? tickets.length : tickets.filter((ticket) => ticket.status === value).length}</span></button>)}</div></section>
    <section className="ticket-list">{visible.length ? visible.map((ticket) => <article className="card ticket-card" key={ticket.id}><div className="ticket-main"><div className="ticket-id">{ticket.key}</div><h2>{ticket.title}</h2><p>{ticket.project}</p></div><div className="ticket-meta"><span className={`status status-${ticket.status.toLowerCase().replaceAll(' ', '-')}`}>{label(ticket.status)}</span><button className={`priority-button priority-${ticket.priority.toLowerCase()}`} disabled={!writeEnabled} onClick={() => cyclePriority(ticket)} title={writeEnabled ? tr('Click to cycle priority', '点击切换优先级') : showingDemo ? tr('Demo preview is read-only', '演示预览为只读') : tr('Ticket changes are unavailable', '工单暂不可修改')}><i />{label(ticket.priority)}</button><span className="due-date">{tr('Due', '截止')} {ticket.dueDate ?? '—'}</span>{ticket.externalUrl ? <a className="small-button" href={ticket.externalUrl} target="_blank" rel="noreferrer">{tr('Open', '打开')} ↗</a> : <span className="small-button disabled">{tr('No link', '无链接')}</span>}</div></article>) : !loading && <div className="card"><EmptyState title={tr('No tickets in this view', '当前视图暂无工单')} description={loadFailed ? tr('Tickets could not be loaded. Check the API connection and try again.', '无法加载工单，请检查 API 连接后重试。') : tr('Everything is clear here. Change the filter or refresh for new work.', '当前没有待处理事项，请更换筛选条件或刷新。')} actionLabel={loadFailed ? tr('Retry', '重试') : undefined} onAction={loadFailed ? loadTickets : undefined} /></div>}</section>
  </>
}
