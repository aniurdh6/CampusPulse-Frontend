import { ROLE_LABELS } from '../lib/format.js';

function Mark() {
  // The brand mark: a heartbeat line.
  return (
    <svg className="brand-mark" viewBox="0 0 32 20" aria-hidden="true">
      <path d="M0 10 H8 L11 3 L16 17 L20 7 L22 10 H32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar({ routes, currentPath, user, unread, pending, onLogout }) {
  const main = routes.filter((r) => !r.admin);
  const admin = routes.filter((r) => r.admin);

  const renderLink = (r) => (
    <li key={r.path}>
      <a href={`#${r.path}`} aria-current={r.path === currentPath ? 'page' : undefined}>
        {r.label}
        {r.path === '/notifications' && unread > 0 && <span className="count">{unread}</span>}
        {r.path === '/admin/approvals' && pending > 0 && <span className="count">{pending}</span>}
      </a>
    </li>
  );

  return (
    <aside className="rail">
      <a className="brand" href="#/">
        <Mark />
        <span>CampusPulse</span>
      </a>

      <nav aria-label="Main">
        <ul>{main.map(renderLink)}</ul>
        {admin.length > 0 && (
          <>
            <p className="rail-group">Administration</p>
            <ul>{admin.map(renderLink)}</ul>
          </>
        )}
      </nav>

      <div className="rail-user">
        <strong>{user.name}</strong>
        <span>{ROLE_LABELS[user.role]}{user.department ? `, ${user.department}` : ''}</span>
        <button type="button" onClick={onLogout}>Sign out</button>
      </div>
    </aside>
  );
}
