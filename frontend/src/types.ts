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
  refreshToken: string
  expiresInSeconds: number
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

export interface ProjectPage {
  items: Project[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AcquisitionStatus {
  projectId: string
  offlineStatus: string
  committeeStatus: string
  salesforceStatus: string
  ownerDepartment: string
}

export type AcquisitionStatusUpdate = Pick<
  AcquisitionStatus,
  'offlineStatus' | 'committeeStatus' | 'salesforceStatus'
>

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

export type TraceDirection = 'FORWARD' | 'REVERSE'
export type ChangeType = 'PARAMETER' | 'HARDWARE' | 'GOAL' | 'OTHER'
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'EXCLUDED'

export interface TraceArtifactType {
  id: string
  code: string
  name: string
  active: boolean
}

export interface TraceRelationType {
  id: string
  code: string
  name: string
  directionDescription: string
  propagationMode: 'FORWARD' | 'REVERSE' | 'BOTH'
  baseWeight: number
  active: boolean
}

export interface TraceArtifactVersion {
  id: string
  versionLabel: string
  displayName: string
  status: string
  owner?: string
  contentSummary?: string
  createdAt: string
}

export interface TraceArtifact {
  id: string
  sourceModule: string
  sourceObjectType: string
  sourceObjectId: string
  sourceStatus: string
  type: TraceArtifactType
  currentVersionId: string
  currentVersion: TraceArtifactVersion
  versions: TraceArtifactVersion[]
  restricted: boolean
}

export interface TraceRelation {
  id: string
  sourceVersionId: string
  sourceName: string
  targetVersionId: string
  targetName: string
  type: TraceRelationType
  rationale: string
  createdBy: string
  active: boolean
  deactivatedReason?: string
  createdAt: string
}

export interface TraceNode {
  versionId: string
  artifactId: string
  artifactTypeCode: string
  displayName: string
  versionLabel: string
  sourceModule: string
  restricted: boolean
}

export interface TraceEdge {
  relationId: string
  relationTypeCode: string
  sourceVersionId: string
  targetVersionId: string
  traversalDirection: TraceDirection
}

export interface TracePath {
  targetVersionId: string
  length: number
  steps: TraceEdge[]
}

export interface TraceQueryResult {
  sourceVersionId: string
  direction: TraceDirection
  maxDepth: number
  maxNodes: number
  nodes: TraceNode[]
  relations: TraceEdge[]
  paths: TracePath[]
  truncatedByDepth: boolean
  truncatedByNodeLimit: boolean
  restrictedCount: number
  durationMs: number
}

export interface ChangeRecordView {
  id: string
  sourceVersionId: string
  sourceName: string
  changeType: ChangeType
  beforeContent?: string
  afterContent?: string
  description: string
  createdBy: string
  createdAt: string
}

export interface CreatedImpactTicket {
  id: string
  externalKey: string
  summary: string
  assignee: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: string
  dueDate?: string
}

export interface ImpactPathStep extends TraceEdge {
  sequenceNo: number
  relationWeight: number
  stepScore: number
}

export interface ImpactPath {
  pathRank: number
  totalScore: number
  length: number
  primary: boolean
  steps: ImpactPathStep[]
}

export interface ImpactCandidate {
  id: string
  target: TraceNode
  initialScore: number
  initialLevel: ImpactLevel
  reviewStatus: ReviewStatus
  reviewComment?: string
  reviewedBy?: string
  reviewedAt?: string
  paths: ImpactPath[]
  tickets: CreatedImpactTicket[]
}

export interface ImpactReport {
  id: string
  change: ChangeRecordView
  status: 'GENERATED' | 'UNDER_REVIEW' | 'REVIEWED' | 'TICKETS_CREATED' | 'CLOSED'
  maxDepth: number
  maxNodes: number
  scoringRuleVersion: string
  candidateCount: number
  truncatedByDepth: boolean
  truncatedByNodeLimit: boolean
  createdBy: string
  version: number
  createdAt: string
  candidates: ImpactCandidate[]
}
