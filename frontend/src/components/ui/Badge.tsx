import clsx from 'clsx';

const colors: Record<string, string> = {
  // Visitor
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  CHECKED_IN: 'badge-info',
  CHECKED_OUT: 'badge-gray',
  EXPIRED: 'badge-danger',
  // Bill
  UNPAID: 'badge-warning',
  PARTIALLY_PAID: 'badge-info',
  PAID: 'badge-success',
  OVERDUE: 'badge-danger',
  // Complaint
  SUBMITTED: 'badge-warning',
  ASSIGNED: 'badge-info',
  IN_PROGRESS: 'badge-purple',
  RESOLVED: 'badge-success',
  CLOSED: 'badge-gray',
  // Booking
  CONFIRMED: 'badge-success',
  CANCELLED: 'badge-danger',
  COMPLETED: 'badge-gray',
  // Priority
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-danger',
  URGENT: 'badge-danger',
  // Occupancy
  OCCUPIED: 'badge-success',
  VACANT: 'badge-gray',
  // User status
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-gray',
  SUSPENDED: 'badge-danger',
  // Announcement
  PUBLISHED: 'badge-success',
  DRAFT: 'badge-warning',
  ARCHIVED: 'badge-gray',
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = colors[status] || 'badge-gray';
  return (
    <span className={clsx('badge', colorClass)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <StatusBadge status={priority} />;
}
