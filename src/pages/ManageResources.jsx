import { useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import Badge from '../components/Badge.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { TYPE_LABELS } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

const BLANK = { name: '', type: 'CLASSROOM', location: '', capacity: 30, features: '', description: '', active: true };

export default function ManageResources() {
  const toast = useToast();
  const list = useLoad(() => api.resources.list(), []);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function edit(r) {
    setEditingId(r.id);
    setForm({
      name: r.name, type: r.type, location: r.location, capacity: r.capacity,
      features: r.features.join(', '), description: r.description || '', active: r.active,
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditingId(null);
    setForm(BLANK);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body = { ...form, capacity: Number(form.capacity) };
    try {
      if (editingId) await api.resources.update(editingId, body);
      else await api.resources.create(body);
      toast(editingId ? 'Resource updated' : 'Resource added');
      reset();
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(r) {
    if (!window.confirm(`Delete ${r.name}? This can't be undone.`)) return;
    try {
      await api.resources.remove(r.id);
      toast('Resource deleted');
      if (editingId === r.id) reset();
      list.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <PageHead title="Resources">Add rooms, labs and equipment, or take something out of service.</PageHead>

      <div className="split">
        <form className="panel" onSubmit={submit}>
          <h2>{editingId ? 'Edit resource' : 'Add a resource'}</h2>

          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={set('name')} maxLength={120} required />
          </label>
          <div className="row">
            <label className="field">
              <span>Type</span>
              <select value={form.type} onChange={set('type')}>
                {Object.entries(TYPE_LABELS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Capacity</span>
              <input type="number" min="1" value={form.capacity} onChange={set('capacity')} required />
            </label>
          </div>
          <label className="field">
            <span>Location</span>
            <input value={form.location} onChange={set('location')} maxLength={150} required />
          </label>
          <label className="field">
            <span>Features, separated by commas</span>
            <input value={form.features} onChange={set('features')} placeholder="Projector, AC, Whiteboard" />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={set('description')} maxLength={500} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Available for booking
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="btn-row">
            <button className="btn" disabled={busy}>{editingId ? 'Save changes' : 'Add resource'}</button>
            {editingId && <button type="button" className="btn secondary" onClick={reset}>Cancel</button>}
          </div>
        </form>

        <section>
          {list.loading && <Loading />}
          <ErrorNote error={list.error} onRetry={list.reload} />
          {!list.loading && !list.error && (list.data || []).length === 0 && (
            <div className="panel"><Empty title="No resources yet">Add the first one with the form.</Empty></div>
          )}
          <ul className="res-list">
            {(list.data || []).map((r) => (
              <li key={r.id} className="res">
                <div className="res-head">
                  <div>
                    <h3>{r.name}</h3>
                    <p className="muted">{TYPE_LABELS[r.type]}, {r.location}, capacity {r.capacity}</p>
                  </div>
                  <div className="badges">
                    {!r.active && <Badge tone="amber">Out of service</Badge>}
                    <button type="button" className="btn small secondary" onClick={() => edit(r)}>Edit</button>
                    <button type="button" className="btn small danger" onClick={() => remove(r)}>Delete</button>
                  </div>
                </div>
                {r.features.length > 0 && (
                  <ul className="chips">{r.features.map((f) => <li key={f} className="chip">{f}</li>)}</ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
