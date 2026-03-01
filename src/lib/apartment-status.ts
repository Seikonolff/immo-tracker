import type { ApartmentStatus } from '@/types/database'

export const STATUS_CONFIG: Record<
  ApartmentStatus,
  { label: string; className: string }
> = {
  to_visit: {
    label: 'À visiter',
    className: 'bg-secondary text-secondary-foreground',
  },
  visit_planned: {
    label: 'Visite planifiée',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  visited: {
    label: 'Visité',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  application_sent: {
    label: 'Candidature envoyée',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  rejected: {
    label: 'Refusé',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
}

export const STATUS_ORDER: ApartmentStatus[] = [
  'to_visit',
  'visit_planned',
  'visited',
  'application_sent',
  'rejected',
]
