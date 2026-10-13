import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Badge from '../components/Badge.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { PRIORITIES, PRIORITY_TONE, STATUSES, STATUS_TONE, fmtDateTime, label } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

const EMPTY = { resourceId: '', location: '', title: '', description: '', priority: 'MEDIUM' };

function Issue({ item, admin, onSaved }) {
  const toast = useToast();
  const choices = STATUSES.filter((s) => STATUSES.indexOf(s) >= STATUSES.indexOf(item.status));
  const [edit, setEdit] = useState({ status: item.status, assignedTo: item.assignedTo || '', note: '' });
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.maintenance.updateStatus(item.id, edit);
      toast('Issue updated');
      onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="res">
      <div className="res-head">
        <div>
          <h3>{item.title}</h3>
          <p className="muted">
            {item.location}
            {admin && `, reported by ${item.reporterName}`}, {fmtDateTime(item.createdAt)}
          </p>
        </div>
        <div className="badges">
          <Badge tone={PRIORITY_TONE[item.priority]}>{label(item.priority)}</Badge>
          <Badge tone={STATUS_TONE[item.status]}>{label(item.status)}</Badge>
        </div>
      </div>
      <p>{item.description}</p>
      {item.assignedTo && <p className="muted">Assigned to {item.assignedTo}</p>}
      {item.adminNote && <p className="muted">Note from admin: {item.adminNote}</p>}

      {admin && item.status !== 'RESOLVED' && (
        <form className="inline-form" onSubmit={save}>
          <label className="field">
            <span>Status</span>
            <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              {choices.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Assigned to</span>
            <input value={edit.assignedTo} onChange={(e) => setEdit({ ...edit, assignedTo: e.target.value })} placeholder="Technician name" />
          </label>
          <label className="field grow">
            <span>Note for the reporter</span>
            <input value={edit.note} maxLength={500} onChange={(e) => setEdit({ ...edit, note: e.target.value })} />
          </label>
          <button className="btn small" disabled={busy}>Save update</button>
        </form>
      )}
    </li>
  );
}

export default function Maintenance() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'ADMIN';

  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resources = useLoad(() => api.resources.list(), []);
  const list = useLoad(
    () => (isAdmin ? api.maintenance.all(filter === 'ALL' ? undefined : filter) : api.maintenance.mine()),
    [isAdmin, filter]
  );

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function pickResource(e) {
    const id = e.target.value;
    const r = (resources.data || []).find((x) => String(x.id) === id);
    setForm({ ...form, resourceId: id, location: r && !form.location ? `${r.name}, ${r.location}` : form.location });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.maintenance.create({ ...form, resourceId: form.resourceId ? Number(form.resourceId) : null });
      toast('Issue reported. You will be notified as it moves along.');
      setForm(EMPTY);
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Maintenance">
        {isAdmin ? 'Review reports, assign them and move them to resolved.' : 'Report something broken and follow it until it is fixed.'}
      </PageHead>

      <div className="split">
        <form className="panel" onSubmit={submit}>
          <h2>Report an issue</h2>

          <label className="field">
            <span>Resource (optional)</span>
            <select value={form.resourceId} onChange={pickResource}>
              <option value="">Not a listed resource</option>
              {(resources.data || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Where is it?</span>
            <input value={form.location} onChange={set('location')} maxLength={150} placeholder="Block C, bench 4" required />
          </label>
          <label className="field">
            <span>Short title</span>
            <input value={form.title} onChange={set('title')} maxLength={150} placeholder="Projector won't turn on" required />
          </label>
          <label className="field">
            <span>What is wrong?</span>
            <textarea rows={4} value={form.description} onChange={set('description')} maxLength={1000} required />
          </label>
          <label className="field">
            <span>Priority</span>
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
            </select>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn wide" disabled={busy}>{busy ? 'Sending' : 'Report issue'}</button>
        </form>

        <section>
          {isAdmin && (
            <div className="toolbar">
              <div className="seg" role="group" aria-label="Filter by status">
                {['ALL', ...STATUSES].map((s) => (
                  <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                    {s === 'ALL' ? 'All' : label(s)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {list.loading && <Loading />}
          <ErrorNote error={list.error} onRetry={list.reload} />
          {!list.loading && !list.error && (list.data || []).length === 0 && (
            <div className="panel">
              <Empty title="No issues">{isAdmin ? 'Nothing matches this filter.' : 'You have not reported anything yet.'}</Empty>
            </div>
          )}
          <ul className="res-list">
            {(list.data || []).map((item) => (
              <Issue key={`${item.id}-${item.status}-${item.updatedAt}`} item={item} admin={isAdmin} onSaved={list.reload} />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
