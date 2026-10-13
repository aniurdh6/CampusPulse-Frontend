import { useEffect, useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Timeline from '../components/Timeline.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { TYPE_LABELS, fmtDate, fmtTime, todayISO } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

const FILTERS = [['ALL', 'All'], ['CLASSROOM', 'Classrooms'], ['LAB', 'Labs'], ['EQUIPMENT', 'Equipment']];

export default function Book({ route }) {
  const q = route.query;
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';

  const [date, setDate] = useState(q.date || todayISO());
  const [type, setType] = useState('ALL');
  const [openId, setOpenId] = useState(q.resource ? Number(q.resource) : null);
  const [form, setForm] = useState({ start: q.start || '09:00', end: q.end || '10:00', purpose: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resources = useLoad(() => api.resources.list(), []);
  const avail = useLoad(() => api.resources.availability(date), [date]);

  // Availability is refreshed every 20 seconds so a slot someone else just took shows up.
  useEffect(() => {
    const timer = setInterval(avail.reload, 20000);
    return () => clearInterval(timer);
  }, [avail.reload]);

  const list = (resources.data || []).filter((r) => r.active && (type === 'ALL' || r.type === type));
  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setError(''); };

  async function submit(e, resource) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.bookings.create({
        resourceId: resource.id,
        date,
        startTime: form.start,
        endTime: form.end,
        purpose: form.purpose,
      });
      const slot = `${resource.name}, ${fmtTime(form.start)} to ${fmtTime(form.end)}`;
      toast(isAdmin ? `Booked ${slot}` : `Request sent for ${slot}. An admin will approve it.`);
      setOpenId(null);
      setForm((f) => ({ ...f, purpose: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      avail.reload();
    }
  }

  return (
    <>
      <PageHead title="Book a resource">
        Dark blocks on each timeline are taken and striped blocks are waiting for approval.
        {isAdmin ? ' Pick a free stretch and confirm.' : ' Pick a free stretch and send a request. An admin approves it.'}
      </PageHead>

      <div className="toolbar">
        <label className="field inline">
          <span>Date</span>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => { setDate(e.target.value || todayISO()); setError(''); }}
          />
        </label>
        <div className="seg" role="group" aria-label="Resource type">
          {FILTERS.map(([value, text]) => (
            <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)}>{text}</button>
          ))}
        </div>
      </div>

      {resources.loading && <Loading text="Loading resources" />}
      <ErrorNote error={resources.error} onRetry={resources.reload} />
      <ErrorNote error={avail.error} onRetry={avail.reload} />
      {!resources.loading && !resources.error && list.length === 0 && (
        <Empty title="Nothing here yet">No resources match this filter.</Empty>
      )}

      <ul className="res-list">
        {list.map((r) => {
          const open = openId === r.id;
          const slots = (avail.data && avail.data[r.id]) || [];
          return (
            <li key={r.id} className={`res ${open ? 'open' : ''}`}>
              <div className="res-head">
                <div>
                  <h3>{r.name}</h3>
                  <p className="muted">
                    {TYPE_LABELS[r.type]}, {r.location}
                    {r.type !== 'EQUIPMENT' && `, seats ${r.capacity}`}
                  </p>
                </div>
                <button
                  type="button"
                  className={open ? 'btn small secondary' : 'btn small'}
                  aria-expanded={open}
                  onClick={() => { setOpenId(open ? null : r.id); setError(''); }}
                >
                  {open ? 'Close' : isAdmin ? 'Book' : 'Request'}
                </button>
              </div>

              {r.features.length > 0 && (
                <ul className="chips">
                  {r.features.map((f) => <li key={f} className="chip">{f}</li>)}
                </ul>
              )}

              <Timeline slots={slots} name={r.name} pick={open ? { start: form.start, end: form.end } : undefined} />

              {open && (
                <form className="book-form" onSubmit={(e) => submit(e, r)}>
                  {r.description && <p className="muted">{r.description}</p>}
                  <div className="row">
                    <label className="field">
                      <span>From</span>
                      <input type="time" min="08:00" max="20:00" step="900" value={form.start} onChange={set('start')} required />
                    </label>
                    <label className="field">
                      <span>To</span>
                      <input type="time" min="08:00" max="20:00" step="900" value={form.end} onChange={set('end')} required />
                    </label>
                  </div>
                  <label className="field">
                    <span>What is it for? (optional)</span>
                    <input maxLength={255} value={form.purpose} onChange={set('purpose')} placeholder="Project review" />
                  </label>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  {!isAdmin && <p className="muted">This sends a request. The slot is yours once an admin approves it, and you'll get a notification either way.</p>}
                  <button className="btn" disabled={busy}>
                    {busy ? 'Sending' : isAdmin ? `Confirm booking for ${fmtDate(date)}` : `Send request for ${fmtDate(date)}`}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
