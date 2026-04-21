import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await signup(form);
      setOtpSent(true);
      setDebugOtp(data.debugOtp || '');
      navigate('/verify-otp', {
        state: {
          email: form.email,
          debugOtp: data.debugOtp || '',
          mailError: data.mailError || ''
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Signup failed');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow alt" />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="cartoon-hero cartoon-hero-alt" aria-hidden="true">
          <div className="cartoon-mascot">🐰</div>
          <div className="cartoon-copy">
            <span className="cartoon-chip">Create your duo</span>
            <div className="cartoon-speech">Sweet invites, warm vibes</div>
          </div>
          <div className="cartoon-hearts">
            <span>🌸</span>
            <span>💖</span>
            <span>🌷</span>
          </div>
        </div>
        <p className="eyebrow">Join the private room</p>
        <h1>Create account</h1>
        <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="password-field">
          <input placeholder="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {otpSent ? <p className="success-text">OTP sent{debugOtp ? ` - dev code: ${debugOtp}` : ''}</p> : null}
        <button className="primary-button">Create account</button>
        <div className="auth-links">
          <Link to="/login">Login</Link>
          <Link to="/forgot-password">Forgot password</Link>
        </div>
      </form>
    </div>
  );
}