import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Badge from '../components/Badge.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { BOOKING_LABELS, BOOKING_TONE, fmtDate, fmtTime, isUpcoming } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

export default function MyBookings() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'ADMIN';

  const [everyone, setEveryone] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const data = useLoad(() => (everyone ? api.bookings.all() : api.bookings.mine()), [everyone]);

  const all = data.data || [];
  const isActive = (b) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && isUpcoming(b);
  const upcoming = all.filter(isActive)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  const earlier = all.filter((b) => !isActive(b));
  const shown = tab === 'upcoming' ? upcoming : earlier;

  async function cancel(booking) {
    if (!window.confirm(`Cancel ${booking.resourceName} on ${fmtDate(booking.date)}?`)) return;
    try {
      await api.bookings.cancel(booking.id);
      toast('Booking cancelled');
      data.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <PageHead title={everyone ? 'All bookings' : 'Your bookings'}>
        {everyone ? 'Every booking on campus, newest first.' : 'Cancel anything you no longer need so others can use the slot.'}
      </PageHead>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Which bookings">
          <button type="button" aria-pressed={tab === 'upcoming'} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
          <button type="button" aria-pressed={tab === 'earlier'} onClick={() => setTab('earlier')}>Past and cancelled ({earlier.length})</button>
        </div>
        {isAdmin && (
          <label className="check">
            <input type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} />
            Show everyone's bookings
          </label>
        )}
      </div>

      {data.loading && <Loading />}
      <ErrorNote error={data.error} onRetry={data.reload} />
      {!data.loading && !data.error && shown.length === 0 && (
        <Empty title={tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing here'}>
          {tab === 'upcoming' ? 'Book a resource and it will be listed here.' : 'Past and cancelled bookings will appear here.'}
        </Empty>
      )}

      <ul className="res-list">
        {shown.map((b) => (
          <li key={b.id} className="res">
            <div className="res-head">
              <div>
                <h3>{b.resourceName}</h3>
                <p className="muted">
                  {fmtDate(b.date)}, {fmtTime(b.startTime)} to {fmtTime(b.endTime)}, {b.resourceLocation}
                </p>
                {(everyone || b.purpose) && (
                  <p className="muted">{everyone && `Requested by ${b.userName}. `}{b.purpose}</p>
                )}
                {b.decisionNote && <p className="muted">Admin note: {b.decisionNote}</p>}
              </div>
              <div className="badges">
                {b.status !== 'CONFIRMED' && <Badge tone={BOOKING_TONE[b.status]}>{BOOKING_LABELS[b.status]}</Badge>}
                {b.status === 'CONFIRMED' && isUpcoming(b) && <Badge tone="green">Approved</Badge>}
                {b.status === 'CONFIRMED' && !isUpcoming(b) && <Badge tone="grey">Done</Badge>}
                {isActive(b) && (
                  <button type="button" className="btn small danger" onClick={() => cancel(b)}>
                    {b.status === 'PENDING' ? 'Withdraw' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
