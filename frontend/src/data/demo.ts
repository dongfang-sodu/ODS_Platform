import type { Course, MarketSummary, PmoProject, Project, Ticket } from '../types'

export const demoProjects: Project[] = [
  { id: 'p-1001', code: 'XC-ADAS-24', name: 'Highway Pilot Gen 3', product: 'ADAS', qg4: 'QG4-2024-018', owner: 'Alice Wang', team: 'XC-AS Delivery', acquisitionDepartment: 'SCP', status: 'Active', milestone: '2025-06-30', updatedAt: '2025-01-20', description: 'XC-AS delivery project for the next generation highway pilot.' },
  { id: 'p-1002', code: 'EV-TRIM-25', name: 'EV Trim Academy', product: 'Digital Services', qg4: 'QG4-2025-003', owner: 'David Chen', team: 'EDS Academy', acquisitionDepartment: 'PCB', status: 'Draft', milestone: '2025-04-15', updatedAt: '2025-01-18', description: 'Standardized learning content for EV trim teams.' },
  { id: 'p-1003', code: 'MKT-CAAM-24', name: 'Vehicle Market v2.0', product: 'Market Intelligence', qg4: 'QG4-2024-011', owner: 'Eva Liu', team: 'Digital Operations', acquisitionDepartment: 'SCN Sales', status: 'On hold', milestone: '2025-03-31', updatedAt: '2025-01-12', description: 'CAAM and 佐思 data mapping and market share dashboards.' },
]

export const demoPmoProjects: PmoProject[] = [
  { id: 'pmo-1001', code: 'XC-ADAS-24', name: 'Highway Pilot Gen 3', level: 'L0', risk: 'In progress', capacity: 18, keyProject: true, highlight: true, source: 'Acquisition' },
  { id: 'pmo-1002-l1', code: 'EV-TRIM-25-01', name: 'Training content migration', level: 'L1', parentId: 'pmo-1002', risk: 'Not started', capacity: 6, keyProject: false, highlight: false, source: 'Manual' },
  { id: 'pmo-1003', code: 'MKT-CAAM-24', name: 'Vehicle Market v2.0', level: 'L0', risk: 'Escalated', capacity: 12, keyProject: false, highlight: true, source: 'Manual' },
]

export const demoMarket: MarketSummary = {
  year: 2024,
  month: 12,
  totalSales: 284620,
  yoy: 12.8,
  activeOems: 12,
  refreshedAt: '2025-01-15 09:30',
  oems: [
    { name: 'OEM Alpha', sales: 82500, share: 29, change: 3.2 },
    { name: 'OEM Beta', sales: 61800, share: 21.7, change: -1.4 },
    { name: 'OEM Gamma', sales: 46200, share: 16.2, change: 2.1 },
    { name: 'OEM Delta', sales: 31900, share: 11.2, change: 0.6 },
    { name: 'Others', sales: 62220, share: 21.9, change: -4.5 },
  ],
}

export const demoCourses: Course[] = [
  { id: 'c-1', topic: 'ADAS Product Overview', date: '2025-02-14 14:00-16:00', startAt: '2025-02-14T06:00:00Z', endAt: '2025-02-14T08:00:00Z', trainer: 'Grace Zhang', coordinator: 'EDS Academy', trainee: 'EDS Team', trainees: 24, status: 'Published', department: 'EDS', materialLocation: 'https://example.invalid/sharepoint/academy/adas' },
  { id: 'c-2', topic: 'Project milestone planning', date: '2025-02-21 10:00-11:30', startAt: '2025-02-21T02:00:00Z', endAt: '2025-02-21T03:30:00Z', trainer: 'Leo Sun', coordinator: 'EDS Academy', trainee: 'PMO Team', trainees: 16, status: 'Invitation sent', department: 'PMO' },
]

export const demoTickets: Ticket[] = [
  { id: 'ticket-1428', key: 'ODS-1428', title: 'Validate M1/M3 project synchronization', project: 'Highway Pilot Gen 3', status: 'In progress', priority: 'High', dueDate: '2025-02-05', assignee: 'You' },
  { id: 'ticket-1414', key: 'ODS-1414', title: 'Upload CAAM January mapping sheet', project: 'Vehicle Market v2.0', status: 'To do', priority: 'Medium', dueDate: '2025-02-07', assignee: 'You' },
  { id: 'ticket-1399', key: 'ODS-1399', title: 'Review training invitation template', project: 'EV Trim Academy', status: 'Blocked', priority: 'Low', dueDate: '2025-02-10', assignee: 'You' },
]
