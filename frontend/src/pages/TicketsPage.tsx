import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { demoTickets } from '../data/demo'
import type { Ticket } from '../types'

const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(demoTickets)
  const [filter, setFilter] = useState<'All' | Ticket['status']>('All')
  const [notice, setNotice] = useState('Loading your tickets...')

  const loadTickets = async () => {
    try {
      const data = await api.tickets.list()
      setTickets(data)
      setNotice('Live data')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Tickets could not be loaded')
    }
  }

  useEffect(() => { void loadTickets() }, [])
  const visible = useMemo(
    () => tickets.filter((ticket) => filter === 'All' || ticket.status === filter).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [tickets, filter],
  )

  const cyclePriority = async (ticket: Ticket) => {
    const next: Ticket['priority'] = ticket.priority === 'Critical' ? 'High' : ticket.priority === 'High' ? 'Medium' : ticket.priority === 'Medium' ? 'Low' : 'Critical'
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, priority: next } : item))
    try {
      const updated = await api.tickets.update(ticket.id, { priority: next })
      setTickets((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`${ticket.key} priority updated`)
    } catch (error) {
      setTickets((current) => current.map((item) => item.id === ticket.id ? ticket : item))
      setNotice(error instanceof Error ? error.message : 'Ticket could not be updated')
    }
  }

  return <>
    <PageHeader eyebrow="Digital Workspace" title="My ticket" description="A focused daily queue for tickets assigned to you across ODS projects." actions={<button className="button secondary" onClick={loadTickets}>↻ Sync JIRA</button>} />
    <div className="notice-bar"><span className="live-dot" />{notice}<span className="refresh-label">Authenticated user scope</span></div>
    <section className="ticket-summary"><div><span className="eyebrow">Today</span><strong>{tickets.filter((ticket) => ticket.status !== 'Done').length}</strong><small>open tickets</small></div><div className="ticket-priority"><span className="priority-dot critical" /><strong>{tickets.filter((ticket) => ticket.priority === 'Critical').length}</strong><small>critical priority</small></div><div className="ticket-priority"><span className="priority-dot high" /><strong>{tickets.filter((ticket) => ticket.priority === 'High').length}</strong><small>high priority</small></div><div className="ticket-priority"><span className="priority-dot medium" /><strong>{tickets.filter((ticket) => ticket.priority === 'Medium').length}</strong><small>medium priority</small></div></section>
    <section className="card filter-card"><div className="filter-tabs">{(['All', 'To do', 'In progress', 'Blocked', 'Done'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}<span>{value === 'All' ? tickets.length : tickets.filter((ticket) => ticket.status === value).length}</span></button>)}</div></section>
    <section className="ticket-list">{visible.length ? visible.map((ticket) => <article className="card ticket-card" key={ticket.id}><div className="ticket-main"><div className="ticket-id">{ticket.key}</div><h2>{ticket.title}</h2><p>{ticket.project}</p></div><div className="ticket-meta"><span className={`status status-${ticket.status.toLowerCase().replaceAll(' ', '-')}`}>{ticket.status}</span><button className={`priority-button priority-${ticket.priority.toLowerCase()}`} onClick={() => cyclePriority(ticket)} title="Click to cycle priority"><i />{ticket.priority}</button><span className="due-date">Due {ticket.dueDate ?? '—'}</span>{ticket.externalUrl ? <a className="small-button" href={ticket.externalUrl} target="_blank" rel="noreferrer">Open ↗</a> : <span className="small-button disabled">No link</span>}</div></article>) : <div className="card"><EmptyState title="No tickets in this view" description="Everything is clear here. Change the filter or sync JIRA for new work." /></div>}</section>
  </>
}
