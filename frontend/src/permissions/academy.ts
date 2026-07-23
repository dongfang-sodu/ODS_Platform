import type { AuthUser, Course } from '../types'

const academyManagerRoles = new Set(['COORDINATOR', 'ADMIN'])

export function canCreateAcademyCourse(user: AuthUser | null) {
  return Boolean(user?.roles.some((role) => role === 'TRAINER' || academyManagerRoles.has(role)))
}

export function canManageAcademyCourse(user: AuthUser | null, course: Pick<Course, 'ownerUsername'>) {
  if (!user) return false
  if (user.roles.some((role) => academyManagerRoles.has(role))) return true
  return user.roles.includes('TRAINER') && Boolean(course.ownerUsername) && course.ownerUsername === user.username
}
