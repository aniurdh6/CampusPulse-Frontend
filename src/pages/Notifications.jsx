import PageHead from '../components/PageHead.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { api } from '../lib/api.js';
import { fmtDateTime } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

export default function Notifications({ refreshUnread }) {
  const list = useLoad(() => api.notifications.list(), []);
  const items = list.data || [];
  const unread = items.filter((n) => !n.seen).length;

  async function markRead(n) {
    if (n.seen) return;
    try {
      await api.notifications.markRead(n.id);
      await list.reload();
      refreshUnread();
    } catch { /* leave it unread; the next refresh will show the truth */ }
  }

  async function markAll() {
    try {
      await api.notifications.markAllRead();
      await list.reload();
      refreshUnread();
    } catch { /* same as above */ }
  }

  return (
    <>
      <PageHead
        title="Notifications"
        actions={unread > 0 && <button type="button" className="btn secondary small" onClick={markAll}>Mark all as read</button>}
      >
        Booking confirmations, issue updates and role changes.
      </PageHead>

      {list.loading && <Loading />}
      <ErrorNote error={list.error} onRetry={list.reload} />
      {!list.loading && !list.error && items.length === 0 && (
        <Empty title="All quiet">Updates about your bookings and issues will show up here.</Empty>
      )}

      <ul className="notes">
        {items.map((n) => (
          <li key={n.id} className={n.seen ? 'seen' : 'unseen'}>
            <button type="button" onClick={() => markRead(n)} aria-label={n.seen ? undefined : 'Mark as read'}>
              <span className="note-text">{n.message}</span>
              <span className="muted">{fmtDateTime(n.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
