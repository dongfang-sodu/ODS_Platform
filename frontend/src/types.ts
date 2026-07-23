export type ProjectStatus = 'Draft' | 'Active' | 'On hold' | 'Completed' | 'Cancelled'
export type PmoLevel = 'L0' | 'L1'
export type PmoRisk = 'Not started' | 'In progress' | 'Mitigated' | 'Escalated'
export type CourseStatus = 'Unpublished' | 'Published' | 'Invitation sent' | 'Completed' | 'Cancelled'
export type TicketStatus = 'To do' | 'In progress' | 'Blocked' | 'Done'
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export interface AuthUser {
  username: string
  email: string
  displayName: string
  roles: string[]
}

export interface LoginResult {
  token: string
  tokenType: string
  user: AuthUser
}

export interface Project {
  id: string
  code: string
  name: string
  product: string
  qg4: string
  owner: string
  team: string
  acquisitionDepartment: string
  status: ProjectStatus
  milestone: string
  updatedAt: string
  description?: string
  createdBy?: string
  acquisitionLinked?: boolean
}

export interface ProjectQuery {
  keyword?: string
  status?: ProjectStatus | 'All'
  owner?: string
  page?: number
  size?: number
}

export interface PmoProject {
  id: string
  code: string
  name: string
  level: PmoLevel
  parentId?: string
  acquisitionId?: string
  capacity: number
  risk: PmoRisk
  mprEscalation?: string
  keyProject: boolean
  highlight: boolean
  source?: string
}

export interface MarketSummary {
  year: number
  month: number
  totalSales: number
  yoy: number | null
  activeOems: number
  refreshedAt: string
  oems: Array<{ name: string; sales: number; share: number; change: number | null }>
}

export interface Course {
  id: string
  ownerUsername?: string
  topic: string
  date: string
  startAt: string
  endAt: string
  trainer: string
  coordinator: string
  trainee: string
  trainees: number
  status: CourseStatus
  department: string
  materialLocation?: string
  description?: string
  advancedEmail?: string
  materialUploaded?: boolean
  participationRate?: number
}

export interface CourseInput {
  topic: string
  startAt: string
  endAt: string
  trainer: string
  coordinator: string
  trainee: string
  trainingDept: string
  materialLocation?: string
  description?: string
  advancedEmail?: string
}

export interface Ticket {
  id: string
  key: string
  title: string
  description?: string
  project: string
  status: TicketStatus
  priority: TicketPriority
  dueDate?: string
  assignee: string
  externalUrl?: string
  source?: string
}

export interface VideoGuideline {
  id: string
  title: string
  category: string
  description: string
  videoUrl?: string
  thumbnailUrl?: string
  sortOrder: number
  published: boolean
  duration?: string
  color?: 'blue' | 'purple' | 'green' | 'amber'
}
