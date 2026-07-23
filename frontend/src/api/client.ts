import type {
  AuthUser,
  Course,
  CourseInput,
  CourseStatus,
  LoginResult,
  MarketSummary,
  PmoProject,
  PmoRisk,
  Project,
  ProjectQuery,
  ProjectStatus,
  Ticket,
  TicketPriority,
  TicketStatus,
  VideoGuideline,
} from '../types'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '/api/v1'
const tokenKey = 'ods_access_token'
const userKey = 'ods_user'
export const authChangedEvent = 'ods:auth-changed'

interface ApiEnvelope<T> { data: T }
interface PageEnvelope<T> { items: T[]; page: number; size: number; total: number; totalPages: number }
interface ErrorEnvelope { message?: string; code?: string; fieldErrors?: Record<string, string> }

interface WireProject {
  id: string
  code: string
  name: string
  description?: string
  product: string
  owner: string
  team: string
  qg4Reference: string
  status: string
  milestoneDate?: string
  createdBy?: string
  acquisitionLinked?: boolean
}

interface WirePmoProject {
  id: string
  projectCode: string
  name: string
  level: string
  parentId?: string
  acquisitionId?: string
  capacity?: number
  riskStatus?: string
  mprEscalation?: string
  keyProject: boolean
  highlightProject: boolean
  source?: string
}

interface WireSalesDistribution {
  year: number
  month: number
  totalVolume: number
  oems: Array<{ oem: string; volume: number; marketShare: number; shareChange?: number | null }>
}

interface WireCourse {
  id: string
  ownerUsername?: string
  topic: string
  startAt: string
  endAt: string
  trainer?: string
  coordinator: string
  trainee?: string
  status: string
  participationRate?: number
  trainingDept: string
  materialLocation?: string
  description?: string
  advancedEmail?: string
  materialUploaded: boolean
}

interface WireTicket {
  id: string
  externalKey: string
  summary: string
  description?: string
  status: string
  priority: string
  assignee: string
  projectKey: string
  dueDate?: string
  externalUrl?: string
  source?: string
}

interface WireVideoGuideline {
  id: string
  title: string
  category: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  sortOrder: number
  published: boolean
}

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>

  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

function readStoredUser(): AuthUser | null {
  const raw = window.localStorage.getItem(userKey)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthUser } catch { return null }
}

export const authSession = {
  token: () => window.localStorage.getItem(tokenKey),
  user: readStoredUser,
  isAuthenticated: () => Boolean(window.localStorage.getItem(tokenKey)),
  save(result: LoginResult) {
    window.localStorage.setItem(tokenKey, result.token)
    window.localStorage.setItem(userKey, JSON.stringify(result.user))
    window.dispatchEvent(new Event(authChangedEvent))
  },
  saveUser(user: AuthUser) {
    window.localStorage.setItem(userKey, JSON.stringify(user))
    window.dispatchEvent(new Event(authChangedEvent))
  },
  clear() {
    window.localStorage.removeItem(tokenKey)
    window.localStorage.removeItem(userKey)
    window.dispatchEvent(new Event(authChangedEvent))
  },
}

async function fetchResponse(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = authSession.token()
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as ErrorEnvelope
    if (response.status === 401) authSession.clear()
    throw new ApiError(error.message || `Request failed (${response.status})`, response.status, error.code, error.fieldErrors)
  }
  return response
}

async function requestData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchResponse(path, init)
  const envelope = await response.json() as ApiEnvelope<T>
  return envelope.data
}

async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  await fetchResponse(path, init)
}

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}

const projectFromApi: Record<string, ProjectStatus> = {
  DRAFT: 'Draft', ACTIVE: 'Active', ON_HOLD: 'On hold', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const projectToApi: Record<ProjectStatus, string> = {
  Draft: 'DRAFT', Active: 'ACTIVE', 'On hold': 'ON_HOLD', Completed: 'COMPLETED', Cancelled: 'CANCELLED',
}
const riskFromApi: Record<string, PmoRisk> = {
  NOT_STARTED: 'Not started', IN_PROGRESS: 'In progress', MITIGATED: 'Mitigated', ESCALATED: 'Escalated',
}
const riskToApi: Record<PmoRisk, string> = {
  'Not started': 'NOT_STARTED', 'In progress': 'IN_PROGRESS', Mitigated: 'MITIGATED', Escalated: 'ESCALATED',
}
const courseFromApi: Record<string, CourseStatus> = {
  DRAFT: 'Unpublished', PUBLISHED: 'Published', INVITATION_SENT: 'Invitation sent', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const ticketStatusFromApi: Record<string, TicketStatus> = {
  TODO: 'To do', IN_PROGRESS: 'In progress', BLOCKED: 'Blocked', DONE: 'Done',
}
const ticketStatusToApi: Record<TicketStatus, string> = {
  'To do': 'TODO', 'In progress': 'IN_PROGRESS', Blocked: 'BLOCKED', Done: 'DONE',
}
const ticketPriorityFromApi: Record<string, TicketPriority> = {
  CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low',
}
const ticketPriorityToApi: Record<TicketPriority, string> = {
  Critical: 'CRITICAL', High: 'HIGH', Medium: 'MEDIUM', Low: 'LOW',
}

function mapProject(value: WireProject): Project {
  return {
    id: value.id,
    code: value.code,
    name: value.name,
    description: value.description,
    product: value.product,
    owner: value.owner,
    team: value.team,
    qg4: value.qg4Reference,
    status: projectFromApi[value.status] ?? 'Draft',
    milestone: value.milestoneDate ?? '',
    updatedAt: value.milestoneDate ?? 'Not scheduled',
    acquisitionDepartment: '',
    createdBy: value.createdBy,
    acquisitionLinked: value.acquisitionLinked,
  }
}

function mapPmo(value: WirePmoProject): PmoProject {
  return {
    id: value.id,
    code: value.projectCode,
    name: value.name,
    level: value.level === 'L1' ? 'L1' : 'L0',
    parentId: value.parentId,
    acquisitionId: value.acquisitionId,
    capacity: Number(value.capacity ?? 0),
    risk: riskFromApi[value.riskStatus ?? 'NOT_STARTED'] ?? 'Not started',
    mprEscalation: value.mprEscalation,
    keyProject: value.keyProject,
    highlight: value.highlightProject,
    source: value.source,
  }
}

function formatCourseDate(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startAt} - ${endAt}`
  const date = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(start)
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} ${time.format(start)}-${time.format(end)}`
}

function mapCourse(value: WireCourse): Course {
  const trainee = value.trainee ?? ''
  return {
    id: value.id,
    ownerUsername: value.ownerUsername,
    topic: value.topic,
    date: formatCourseDate(value.startAt, value.endAt),
    startAt: value.startAt,
    endAt: value.endAt,
    trainer: value.trainer ?? '',
    coordinator: value.coordinator,
    trainee,
    trainees: trainee ? trainee.split(/[,;]/).filter(Boolean).length : 0,
    status: courseFromApi[value.status] ?? 'Unpublished',
    department: value.trainingDept,
    materialLocation: value.materialLocation,
    description: value.description,
    advancedEmail: value.advancedEmail,
    materialUploaded: value.materialUploaded,
    participationRate: value.participationRate,
  }
}

function mapTicket(value: WireTicket): Ticket {
  return {
    id: value.id,
    key: value.externalKey,
    title: value.summary,
    description: value.description,
    project: value.projectKey,
    status: ticketStatusFromApi[value.status] ?? 'To do',
    priority: ticketPriorityFromApi[value.priority] ?? 'Low',
    dueDate: value.dueDate,
    assignee: value.assignee,
    externalUrl: value.externalUrl,
    source: value.source,
  }
}

function courseCreatePayload(course: CourseInput) {
  return {
    topic: course.topic,
    startAt: new Date(course.startAt).toISOString(),
    endAt: new Date(course.endAt).toISOString(),
    trainer: course.trainer || null,
    coordinator: course.coordinator,
    trainee: course.trainee || null,
    trainingDept: course.trainingDept,
    materialLocation: course.materialLocation || null,
    description: course.description || null,
  }
}

function courseUpdatePayload(course: CourseInput) {
  return {
    topic: course.topic,
    startAt: new Date(course.startAt).toISOString(),
    endAt: new Date(course.endAt).toISOString(),
    trainer: course.trainer || null,
    trainee: course.trainee || null,
    trainingDept: course.trainingDept,
    materialLocation: course.materialLocation || null,
    description: course.description || null,
    advancedEmail: course.advancedEmail || null,
  }
}

export const api = {
  auth: {
    async login(username: string, password: string) {
      const result = await requestData<LoginResult>('/auth/login', {
        method: 'POST', body: JSON.stringify({ username, password }),
      })
      authSession.save(result)
      return result
    },
    async me() {
      const user = await requestData<AuthUser>('/auth/me')
      authSession.saveUser(user)
      return user
    },
    logout: () => authSession.clear(),
  },
  projects: {
    async list(query: ProjectQuery = {}) {
      const data = await requestData<PageEnvelope<WireProject>>(`/projects${queryString({
        q: query.keyword,
        status: query.status && query.status !== 'All' ? projectToApi[query.status] : undefined,
        owner: query.owner,
        page: query.page ?? 0,
        size: query.size ?? 100,
      })}`)
      return data.items.map(mapProject)
    },
    async get(id: string) { return mapProject(await requestData<WireProject>(`/projects/${encodeURIComponent(id)}`)) },
    async create(project: Omit<Project, 'id' | 'updatedAt'>) {
      const payload = {
        code: project.code,
        name: project.name,
        description: project.description || null,
        product: project.product,
        owner: project.owner,
        team: project.team,
        qg4Reference: project.qg4,
        milestoneDate: project.milestone || null,
        acquisitionDepartment: project.acquisitionDepartment,
      }
      return mapProject(await requestData<WireProject>('/projects', { method: 'POST', body: JSON.stringify(payload) }))
    },
    async update(id: string, project: Partial<Project>) {
      const payload = {
        name: project.name,
        description: project.description || null,
        product: project.product,
        owner: project.owner,
        team: project.team,
        milestoneDate: project.milestone || null,
        status: project.status ? projectToApi[project.status] : undefined,
      }
      return mapProject(await requestData<WireProject>(`/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }))
    },
    async export(query: ProjectQuery = {}) {
      const response = await fetchResponse(`/projects/export${queryString({
        q: query.keyword,
        status: query.status && query.status !== 'All' ? projectToApi[query.status] : undefined,
        owner: query.owner,
      })}`)
      return response.blob()
    },
  },
  pmo: {
    async list() {
      const data = await requestData<PageEnvelope<WirePmoProject>>('/pmo/projects?page=0&size=100')
      return data.items.map(mapPmo)
    },
    async create(project: Pick<PmoProject, 'code' | 'name' | 'capacity'> & Partial<PmoProject>) {
      const payload = { projectCode: project.code, name: project.name, capacity: project.capacity, acquisitionId: project.acquisitionId || null }
      return mapPmo(await requestData<WirePmoProject>('/pmo/projects', { method: 'POST', body: JSON.stringify(payload) }))
    },
    async createChild(parentId: string, project: Pick<PmoProject, 'code' | 'name' | 'capacity'>) {
      const payload = { projectCode: project.code, name: project.name, capacity: project.capacity }
      return mapPmo(await requestData<WirePmoProject>(`/pmo/projects/${encodeURIComponent(parentId)}/children`, { method: 'POST', body: JSON.stringify(payload) }))
    },
    async update(id: string, project: Pick<PmoProject, 'name' | 'capacity' | 'risk' | 'keyProject' | 'highlight'> & Partial<PmoProject>) {
      const payload = {
        name: project.name,
        capacity: project.capacity,
        riskStatus: riskToApi[project.risk],
        mprEscalation: project.mprEscalation || null,
        keyProject: project.keyProject,
        highlightProject: project.highlight,
      }
      return mapPmo(await requestData<WirePmoProject>(`/pmo/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }))
    },
    remove: (id: string) => requestVoid(`/pmo/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  market: {
    async summary(year: number, month: number): Promise<MarketSummary> {
      const value = await requestData<WireSalesDistribution>(`/vehicle-market/sales-distribution${queryString({ year, month })}`)
      const changes = value.oems.map((item) => item.shareChange).filter((item): item is number => item !== null && item !== undefined)
      return {
        year: value.year,
        month: value.month,
        totalSales: value.totalVolume,
        yoy: changes.length ? Number((changes.reduce((sum, item) => sum + item, 0) / changes.length).toFixed(2)) : null,
        activeOems: value.oems.length,
        refreshedAt: `${value.year}-${String(value.month).padStart(2, '0')}`,
        oems: value.oems.map((item) => ({ name: item.oem, sales: item.volume, share: item.marketShare, change: item.shareChange ?? null })),
      }
    },
  },
  academy: {
    async list() { return (await requestData<WireCourse[]>('/training/courses')).map(mapCourse) },
    async create(course: CourseInput) {
      return mapCourse(await requestData<WireCourse>('/training/courses', { method: 'POST', body: JSON.stringify(courseCreatePayload(course)) }))
    },
    async update(id: string, course: CourseInput) {
      const payload = courseUpdatePayload(course)
      return mapCourse(await requestData<WireCourse>(`/training/courses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }))
    },
    async publish(id: string) {
      return mapCourse(await requestData<WireCourse>(`/training/courses/${encodeURIComponent(id)}/publish`, { method: 'POST' }))
    },
    async unpublish(id: string) {
      return mapCourse(await requestData<WireCourse>(`/training/courses/${encodeURIComponent(id)}/unpublish`, { method: 'POST' }))
    },
    async cancel(id: string) {
      return mapCourse(await requestData<WireCourse>(`/training/courses/${encodeURIComponent(id)}/cancel`, { method: 'POST' }))
    },
    async complete(id: string, materialUploaded: boolean, participationRate?: number) {
      return mapCourse(await requestData<WireCourse>(`/training/courses/${encodeURIComponent(id)}/complete`, {
        method: 'PATCH', body: JSON.stringify({ materialUploaded, participationRate: participationRate ?? null }),
      }))
    },
  },
  tickets: {
    async list(query?: string) { return (await requestData<WireTicket[]>(`/my-tickets${queryString({ q: query })}`)).map(mapTicket) },
    async update(id: string, ticket: Pick<Ticket, 'priority'> & Partial<Pick<Ticket, 'status'>>) {
      const payload = { priority: ticketPriorityToApi[ticket.priority], status: ticket.status ? ticketStatusToApi[ticket.status] : undefined }
      return mapTicket(await requestData<WireTicket>(`/my-tickets/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }))
    },
  },
  guidelines: {
    async list(): Promise<VideoGuideline[]> {
      const values = await requestData<WireVideoGuideline[]>('/video-guidelines')
      const colors: Array<NonNullable<VideoGuideline['color']>> = ['blue', 'purple', 'green', 'amber']
      return values.map((value, index) => ({
        id: value.id,
        title: value.title,
        category: value.category,
        description: value.description ?? '',
        videoUrl: value.videoUrl,
        thumbnailUrl: value.thumbnailUrl,
        sortOrder: value.sortOrder,
        published: value.published,
        color: colors[index % colors.length],
      }))
    },
  },
}
