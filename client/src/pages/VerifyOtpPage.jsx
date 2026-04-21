import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const apiBaseUrl = import.meta.env.VITE_API_URL;

export function VerifyOtpPage() {
  const { verifyOtp } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: state?.email || '', otp: state?.debugOtp || '' });
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState(state?.mailError ? `Email delivery failed: ${state.mailError}.` : '');
  const [resendLoading, setResendLoading] = useState(false);

  async function resendOtp() {
    if (!form.email) return;
    setResendLoading(true);
    setError('');
    if (!apiBaseUrl) {
      setError('API URL is not configured. Please set VITE_API_URL in client/.env');
      setResendLoading(false);
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to resend OTP');
      }
      setForm((current) => ({ ...current, otp: data.debugOtp || '' }));
      setResendMessage(data.mailError ? `Email delivery failed: ${data.mailError}.` : 'Verification OTP sent again.');
      if (data.debugOtp) {
        setError('OTP is available on screen because email delivery is not configured or failed.');
      }
    } catch (err) {
      console.error('OTP resend failed:', err);
      setError(err.message || 'Unable to resend OTP');
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await verifyOtp(form);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Verify OTP</p>
        {resendMessage ? <p className="success-text">{resendMessage}</p> : null}
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="6 digit OTP" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} />
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button">Verify</button>
        <button type="button" className="glass-button" onClick={resendOtp} disabled={resendLoading}>
          {resendLoading ? 'Sending...' : 'Resend OTP'}
        </button>
      </form>
    </div>
  );
}