import PageHead from '../components/PageHead.jsx';
import { ErrorNote, Loading } from '../components/State.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { ROLE_LABELS } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const list = useLoad(() => api.users.list(), []);

  async function changeRole(u, role) {
    try {
      await api.users.changeRole(u.id, role);
      toast(`${u.name} is now ${ROLE_LABELS[role].toLowerCase()}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      list.reload();
    }
  }

  return (
    <>
      <PageHead title="Users">Everyone with an account. Promote a faculty member to admin here.</PageHead>
      {list.loading && <Loading />}
      <ErrorNote error={list.error} onRetry={list.reload} />

      {list.data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th></tr>
            </thead>
            <tbody>
              {list.data.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === me.id && <span className="muted"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td>{u.department || ''}</td>
                  <td>
                    <select
                      aria-label={`Role for ${u.name}`}
                      value={u.role}
                      disabled={u.id === me.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      {Object.entries(ROLE_LABELS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
