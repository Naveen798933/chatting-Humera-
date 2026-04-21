import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', otp: '', password: '' });
  const [message, setMessage] = useState('');

  async function sendOtp(event) {
    event.preventDefault();
    try {
      const { data } = await forgotPassword({ email: form.email });
      setMessage(data.debugOtp ? `Dev OTP: ${data.debugOtp}` : data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Unable to send OTP');
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    try {
      const { data } = await resetPassword(form);
      setMessage(data.message);
      navigate('/login', { replace: true, state: { successMessage: 'Password reset successful. Please log in with your new password.' } });
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Password reset failed');
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={step === 1 ? sendOtp : submitReset}>
        <p className="eyebrow">Reset password</p>
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {step === 2 ? <input placeholder="OTP" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} /> : null}
        {step === 2 ? <input placeholder="New password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /> : null}
        {message ? <p className="success-text">{message}</p> : null}
        <button className="primary-button">{step === 1 ? 'Send OTP' : 'Reset password'}</button>
      </form>
    </div>
  );
}