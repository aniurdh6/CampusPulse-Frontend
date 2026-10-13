import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const isLogin = mode === 'login';

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-intro">
        <h1>CampusPulse</h1>
        <p>Book a room, borrow equipment, report what's broken, and see when it's fixed.</p>
        <svg className="pulse-line" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            pathLength="1"
            d="M0 64 H170 L196 64 L222 18 L252 104 L278 40 L298 64 H600"
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </section>

      <section className="auth-form">
        <form onSubmit={submit} noValidate>
          <h2>{isLogin ? 'Sign in' : 'Create your account'}</h2>

          {!isLogin && (
            <label className="field">
              <span>Full name</span>
              <input value={form.name} onChange={set('name')} autoComplete="name" required />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {!isLogin && (
            <div className="row">
              <label className="field">
                <span>I am a</span>
                <select value={form.role} onChange={set('role')}>
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty member</option>
                </select>
              </label>
              <label className="field">
                <span>Department</span>
                <input value={form.department} onChange={set('department')} placeholder="ECE" />
              </label>
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="btn wide" disabled={busy}>
            {busy ? 'Please wait' : isLogin ? 'Sign in' : 'Create account'}
          </button>

          <p className="switch">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" className="link" onClick={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
