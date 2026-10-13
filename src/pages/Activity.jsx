import PageHead from '../components/PageHead.jsx';
import { Empty, ErrorNote, Loading } from '../components/State.jsx';
import { api } from '../lib/api.js';
import { fmtDateTime, label } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

export default function Activity() {
  const list = useLoad(() => api.logs(), []);
  const items = list.data || [];

  return (
    <>
      <PageHead
        title="Activity log"
        actions={<button type="button" className="btn secondary small" onClick={list.reload}>Refresh</button>}
      >
        The latest 100 things that happened in the system.
      </PageHead>

      {list.loading && <Loading />}
      <ErrorNote error={list.error} onRetry={list.reload} />
      {!list.loading && !list.error && items.length === 0 && <Empty title="No activity yet" />}

      {items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="nowrap">{fmtDateTime(l.createdAt)}</td>
                  <td>{l.actor}</td>
                  <td>{label(l.action)}</td>
                  <td>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
