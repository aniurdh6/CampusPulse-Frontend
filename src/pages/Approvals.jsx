import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { TYPE_LABELS, fmtDate, fmtDateTime, fmtTime } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

function Request({ b, onDone }) {
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action, message) {
    setBusy(true);
    try {
      await action();
      toast(message);
      onDone();
    } catch (err) {
      // For example: someone else already holds that slot. The request stays pending.
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="res">
      <div className="res-head">
        <div>
          <h3>{b.resourceName}</h3>
          <p className="muted">
            {TYPE_LABELS[b.resourceType]}, {b.resourceLocation}
          </p>
        </div>
        <div className="badges">
          <button type="button" className="btn small" disabled={busy} onClick={() => run(() => api.bookings.approve(b.id), 'Request approved')}>
            Approve
          </button>
          <button type="button" className="btn small danger" disabled={busy} onClick={() => setRejecting(!rejecting)} aria-expanded={rejecting}>
            Reject
          </button>
        </div>
      </div>

      <p><strong>{fmtDate(b.date)}, {fmtTime(b.startTime)} to {fmtTime(b.endTime)}</strong></p>
      <p className="muted">
        Requested by {b.userName} on {fmtDateTime(b.createdAt)}
        {b.purpose && `. Purpose: ${b.purpose}`}
      </p>

      {rejecting && (
        <form
          className="inline-form"
          onSubmit={(e) => { e.preventDefault(); run(() => api.bookings.reject(b.id, note), 'Request rejected'); }}
        >
          <label className="field grow">
            <span>Reason for the requester (optional)</span>
            <input value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} placeholder="Lab is reserved for exams" />
          </label>
          <button className="btn small danger" disabled={busy}>Reject request</button>
        </form>
      )}
    </li>
  );
}

export default function Approvals({ refreshPending }) {
  const list = useLoad(() => api.bookings.pending(), []);
  const items = list.data || [];

  function done() {
    list.reload();
    refreshPending();
  }

  return (
    <>
      <PageHead title="Booking requests">
        Students and faculty send requests. Nothing is booked until you approve it.
      </PageHead>

      {list.loading && <Loading />}
      <ErrorNote error={list.error} onRetry={list.reload} />
      {!list.loading && !list.error && items.length === 0 && (
        <div className="panel">
          <Empty title="No requests waiting">New requests will show up here and in the sidebar count.</Empty>
        </div>
      )}

      <ul className="res-list">
        {items.map((b) => <Request key={b.id} b={b} onDone={done} />)}
      </ul>
    </>
  );
}
