import PageHead from '../components/PageHead.jsx';
import { ErrorNote, Loading } from '../components/State.jsx';
import { api } from '../lib/api.js';
import { TYPE_LABELS, label } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

function Bars({ rows, tone = 'ink' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track"><span className={`bar-fill ${tone}`} style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="bar-value">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Analytics() {
  const { data: s, loading, error, reload } = useLoad(() => api.analytics(), []);

  const week = s ? s.bookingsLast7Days : [];
  const weekMax = Math.max(1, ...week.map((d) => d.count));

  return (
    <>
      <PageHead title="Analytics">How resources are being used and how fast problems get fixed.</PageHead>
      {loading && <Loading />}
      <ErrorNote error={error} onRetry={reload} />

      {s && (
        <>
          <dl className="stat-strip">
            <div><dt>Bookings today</dt><dd>{s.bookingsToday}</dd></div>
            <div><dt>Resources in use today</dt><dd>{s.utilizationPercent}%</dd></div>
            <div><dt>Open issues</dt><dd>{s.openIssues}</dd></div>
            <div>
              <dt>Average time to resolve</dt>
              <dd>{s.avgResolutionHours > 0 ? `${s.avgResolutionHours} h` : 'No data yet'}</dd>
            </div>
          </dl>

          <div className="grid-2">
            <section className="panel">
              <h2>Bookings in the last 7 days</h2>
              <div className="columns" role="img" aria-label={`Bookings per day: ${week.map((d) => `${d.date} ${d.count}`).join(', ')}`}>
                {week.map((d) => (
                  <div key={d.date} className="col">
                    <span className="col-value">{d.count}</span>
                    <span className="col-bar" style={{ height: `${(d.count / weekMax) * 100}%` }} />
                    <span className="col-label">{new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Most booked resources</h2>
              {s.topResources.length === 0
                ? <p className="muted">No bookings yet.</p>
                : <Bars rows={s.topResources.map((t) => ({ label: t.name, value: t.count }))} />}
            </section>

            <section className="panel">
              <h2>Bookings by type</h2>
              <Bars rows={Object.entries(s.bookingsByType).map(([k, v]) => ({ label: TYPE_LABELS[k], value: v }))} />
            </section>

            <section className="panel">
              <h2>Issues by status</h2>
              <Bars tone="blue" rows={Object.entries(s.issuesByStatus).map(([k, v]) => ({ label: label(k), value: v }))} />
            </section>

            <section className="panel">
              <h2>Open issues by priority</h2>
              <Bars tone="red" rows={Object.entries(s.openIssuesByPriority).map(([k, v]) => ({ label: label(k), value: v }))} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
