import { useMemo, useState } from 'react';
import PageHead from '../components/PageHead.jsx';
import { Empty, ErrorNote } from '../components/State.jsx';
import { api } from '../lib/api.js';
import { TYPE_LABELS, todayISO } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

export default function Recommend({ route }) {
  const resources = useLoad(() => api.resources.list(), []);
  const [form, setForm] = useState({ type: '', minCapacity: '', date: todayISO(), start: '10:00', end: '12:00' });
  const [features, setFeatures] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Offer the features that actually exist on campus as one-tap filters.
  const allFeatures = useMemo(() => {
    const set = new Set();
    (resources.data || []).filter((r) => r.active && (!form.type || r.type === form.type))
      .forEach((r) => r.features.forEach((f) => set.add(f)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [resources.data, form.type]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggle = (f) => setFeatures((list) => (list.includes(f) ? list.filter((x) => x !== f) : [...list, f]));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.recommend({
        type: form.type || null,
        minCapacity: form.minCapacity ? Number(form.minCapacity) : null,
        features: features.filter((f) => allFeatures.includes(f)),
        date: form.date,
        startTime: form.start,
        endTime: form.end,
      });
      setResults(res);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Find a match">
        Say what you need and when. You'll get only the resources that are free for that whole slot, best fit first.
      </PageHead>

      <div className="split">
        <form className="panel" onSubmit={submit}>
          <h2>What do you need?</h2>

          <label className="field">
            <span>Kind of resource</span>
            <select value={form.type} onChange={set('type')}>
              <option value="">Anything</option>
              {Object.entries(TYPE_LABELS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </label>

          <label className="field">
            <span>People it needs to fit</span>
            <input type="number" min="1" value={form.minCapacity} onChange={set('minCapacity')} placeholder="Any size" />
          </label>

          <fieldset className="field">
            <legend>Must have</legend>
            {resources.loading && <span className="muted">Loading options...</span>}
            <div className="chips pickable">
              {allFeatures.map((f) => (
                <button key={f} type="button" className="chip" aria-pressed={features.includes(f)} onClick={() => toggle(f)}>{f}</button>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Date</span>
            <input type="date" min={todayISO()} value={form.date} onChange={set('date')} required />
          </label>
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

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn wide" disabled={busy}>{busy ? 'Searching' : 'Find matches'}</button>
        </form>

        <section aria-live="polite">
          <ErrorNote error={resources.error} onRetry={resources.reload} />
          {results === null && (
            <div className="panel">
              <Empty title="No search yet">Fill in the form and your matches will appear here.</Empty>
            </div>
          )}
          {results && results.length === 0 && (
            <div className="panel">
              <Empty title="Nothing is free that fits">Try a different time, a smaller group, or fewer required features.</Empty>
            </div>
          )}
          <ul className="res-list">
            {(results || []).map((m) => (
              <li key={m.resource.id} className="res">
                <div className="res-head">
                  <div>
                    <h3>{m.resource.name}</h3>
                    <p className="muted">{TYPE_LABELS[m.resource.type]}, {m.resource.location}</p>
                  </div>
                  <a
                    className="btn small"
                    href={`#/book?resource=${m.resource.id}&date=${form.date}&start=${form.start}&end=${form.end}`}
                  >
                    Book this
                  </a>
                </div>
                <div className="score" aria-label={`${m.score} percent match`}>
                  <span className="score-track"><span style={{ width: `${m.score}%` }} /></span>
                  <span className="score-text">{m.score}% match</span>
                </div>
                <ul className="reasons">
                  {m.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
