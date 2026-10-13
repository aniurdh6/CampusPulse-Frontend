export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 20;

export const TYPE_LABELS = { CLASSROOM: 'Classroom', LAB: 'Lab', EQUIPMENT: 'Equipment' };
export const ROLE_LABELS = { STUDENT: 'Student', FACULTY: 'Faculty', ADMIN: 'Admin' };
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

export function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function fmtDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtTime(t) {
  return (t || '').slice(0, 5);
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function toMinutes(t) {
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}

/** "IN_PROGRESS" becomes "In progress". */
export function label(value) {
  if (!value) return '';
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** True when the booking has not finished yet. */
export function isUpcoming(booking) {
  const end = new Date(`${booking.date}T${fmtTime(booking.endTime)}:00`);
  return end.getTime() >= Date.now();
}

export const BOOKING_LABELS = { PENDING: 'Awaiting approval', CONFIRMED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };
export const BOOKING_TONE = { PENDING: 'amber', CONFIRMED: 'green', REJECTED: 'red', CANCELLED: 'grey' };

export const STATUS_TONE = { OPEN: 'amber', ASSIGNED: 'blue', IN_PROGRESS: 'blue', RESOLVED: 'green' };
export const PRIORITY_TONE = { LOW: 'grey', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red' };
