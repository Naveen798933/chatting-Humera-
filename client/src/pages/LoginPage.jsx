import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');

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
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>LoveChat</h1>
        <p className="subtle">Private, secure, and romantic.</p>
        {state?.successMessage ? <p className="success-text">{state.successMessage}</p> : null}
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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