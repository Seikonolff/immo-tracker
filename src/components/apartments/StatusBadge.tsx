import { STATUS_CONFIG } from '@/lib/apartment-status'
import type { ApartmentStatus } from '@/types/database'

export function StatusBadge({ status }: { status: ApartmentStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0 ${className}`}>
      {label}
    </span>
  )
}
