import type { ReactNode } from 'react'
import { useLanguage } from '../i18n'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  const { t } = useLanguage()
  const keys: Record<string, string> = {
    'Good morning, You': 'page.goodMorning',
    'Your workspace': 'page.workspace',
    'A clear view of projects, tasks and insights across One Driving System.': 'page.workspaceDescription',
    'Digital Project Management': 'page.digitalProjectManagement',
    'Project list': 'page.projectList',
    'Find, track and maintain every QG4 project in one place.': 'page.projectListDescription',
    'PMO project list': 'page.pmoProjectList',
    'Maintain L0/L1 projects, capacity and risk signals from the PMO perspective.': 'page.pmoDescription',
    'Digital Knowledge': 'page.digitalKnowledge',
    'Academy library': 'page.academy',
    'Discover training materials and manage Trims Academy courses from one workspace.': 'page.academyDescription',
    'Digital Operation / Market': 'page.digitalOperationMarket',
    'Vehicle market': 'page.vehicleMarket',
    'Track overall sales distribution and OEM market share from the configured market data service.': 'page.marketDescription',
    'Engineering Traceability': 'page.engineeringTraceability',
    '工件追溯与变更分析': 'page.traceTitle',
    '使用有限深度关系查询、可解释影响排序和人工确认，把AEB变更连接到项目、车型说明、培训、指南和工单。': 'page.traceDescription',
    'Digital Workspace': 'page.digitalWorkspace',
    'My ticket': 'page.myTicket',
    'A focused daily queue for tickets assigned to you across ODS projects.': 'page.ticketDescription',
    'Video guideline': 'page.videoGuideline',
    'Short, practical walkthroughs to help you get the most from One Driving System.': 'page.videoDescription',
    'Account security': 'page.accountSecurity',
  }
  const localize = (value: string) => t(keys[value] ?? value)
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{localize(eyebrow)}</span>}
        <h1>{localize(title)}</h1>
        {description && <p>{localize(description)}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}
