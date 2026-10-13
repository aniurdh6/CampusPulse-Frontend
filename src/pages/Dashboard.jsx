import { useAuth } from '../context/AuthContext.jsx';
import PageHead from '../components/PageHead.jsx';
import Badge from '../components/Badge.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { api } from '../lib/api.js';
import { PRIORITY_TONE, STATUS_TONE, fmtDate, fmtTime, greeting, isUpcoming, label } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

export default function Dashboard() {
  const { user } = useAuth();
  const canSeeStats = user.role !== 'STUDENT';

  const bookings = useLoad(() => api.bookings.mine(), []);
  const issues = useLoad(() => api.maintenance.mine(), []);
  const stats = useLoad(() => (canSeeStats ? api.analytics() : Promise.resolve(null)), [canSeeStats]);

  const upcoming = (bookings.data || [])
    .filter((b) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && isUpcoming(b))
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, 5);
  const openIssues = (issues.data || []).filter((i) => i.status !== 'RESOLVED');
  const s = stats.data;

  return (
    <>
      <PageHead title={`${greeting()}, ${user.name}`}>Your next bookings and open issues are below.</PageHead>

      <div className="quick">
        <a className="btn" href="#/book">Book a resource</a>
        <a className="btn secondary" href="#/recommend">Find a match</a>
        <a className="btn secondary" href="#/maintenance">Report an issue</a>
        {user.role === 'ADMIN' && <a className="btn secondary" href="#/admin/approvals">Booking requests</a>}
      </div>

      {s && (
        <dl className="stat-strip">
          <div><dt>Bookings today</dt><dd>{s.bookingsToday}</dd></div>
          <div><dt>Resources in use today</dt><dd>{s.utilizationPercent}%</dd></div>
          <div><dt>Open issues</dt><dd>{s.openIssues}</dd></div>
          <div><dt>Active resources</dt><dd>{s.activeResources}</dd></div>
        </dl>
      )}

      <div className="grid-2">
        <section className="panel">
          <h2>Upcoming bookings</h2>
          {bookings.loading && <Loading />}
          <ErrorNote error={bookings.error} onRetry={bookings.reload} />
          {!bookings.loading && !bookings.error && upcoming.length === 0 && (
            <Empty title="Nothing booked">Pick a room, lab or piece of equipment and it will show up here.</Empty>
          )}
          <ul className="rows">
            {upcoming.map((b) => (
              <li key={b.id}>
                <div>
                  <strong>{b.resourceName}</strong>
                  <span className="muted">{b.resourceLocation}</span>
                </div>
                <div className="when">
                  {fmtDate(b.date)}
                  <span className="muted">{fmtTime(b.startTime)} to {fmtTime(b.endTime)}</span>
                  {b.status === 'PENDING' && <Badge tone="amber">Awaiting approval</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Your open issues</h2>
          {issues.loading && <Loading />}
          <ErrorNote error={issues.error} onRetry={issues.reload} />
          {!issues.loading && !issues.error && openIssues.length === 0 && (
            <Empty title="No open issues">Anything you report will be tracked here until it is resolved.</Empty>
          )}
          <ul className="rows">
            {openIssues.slice(0, 5).map((i) => (
              <li key={i.id}>
                <div>
                  <strong>{i.title}</strong>
                  <span className="muted">{i.location}</span>
                </div>
                <div className="badges">
                  <Badge tone={PRIORITY_TONE[i.priority]}>{label(i.priority)}</Badge>
                  <Badge tone={STATUS_TONE[i.status]}>{label(i.status)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
