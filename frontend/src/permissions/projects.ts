import type { AuthUser } from '../types'

const projectCreatorRoles = new Set(['TPJM', 'ADMIN'])
const projectEditorRoles = new Set(['TPJM', 'PJM', 'LPM', 'ADMIN'])

export function canCreateProject(user: AuthUser | null) {
  return Boolean(user?.roles.some((role) => projectCreatorRoles.has(role)))
}

export function canEditProject(user: AuthUser | null) {
  return Boolean(user?.roles.some((role) => projectEditorRoles.has(role)))
}
