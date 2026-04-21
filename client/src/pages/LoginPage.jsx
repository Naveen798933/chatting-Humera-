import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/chat');
    } catch (err) {
      if (err.response?.data?.requiresOtp) {
        navigate('/verify-otp', { state: { email: err.response.data.email || form.email } });
        setError(err.response?.data?.message || 'Please verify your OTP first');
        return;
      }
      if (err.code === 'ECONNABORTED') {
        setError('Login request timed out. Please verify backend URL and server status.');
        return;
      }
      if (err.message === 'Network Error') {
        setError('Unable to reach server. Check if backend is running and API URL is correct.');
        return;
      }
      if (err.response?.status === 401) {
        setError('Invalid credentials. Check email/password, and confirm this account exists on the current server/database.');
        return;
      }
      if (err.response?.status === 429) {
        setError('Too many failed attempts from this network. Wait a few minutes, then try again with the correct password.');
        return;
      }
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="cartoon-hero" aria-hidden="true">
          <div className="cartoon-mascot">🐻‍❄️</div>
          <div className="cartoon-copy">
            <span className="cartoon-chip">Love mode</span>
            <div className="cartoon-speech">Private, playful, and cute</div>
          </div>
          <div className="cartoon-hearts">
            <span>💗</span>
            <span>💞</span>
            <span>💘</span>
          </div>
        </div>
        <p className="eyebrow">Welcome back</p>
        <h1>LoveChat</h1>
        <p className="subtle">Private, secure, and romantic.</p>
        {state?.successMessage ? <p className="success-text">{state.successMessage}</p> : null}
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="password-field">
          <input placeholder="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })} />
          Remember me
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button">Login</button>
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </form>
    </div>
  );
}