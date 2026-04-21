import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveAssetUrl } from '../lib/assets.js';

function buildFeedbackMailto({ user, room, feedback, subject }) {
  const bodyLines = [
    `From: ${user?.name || 'Unknown'} (${user?.email || 'no email'})`,
    `Room: ${room?.name || 'Private room'}`,
    '',
    feedback.trim()
  ];
  const body = bodyLines.join('\n');
  return `mailto:support@lovechat.local?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ProfilePage() {
  const { isAuthenticated, user, room, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nickname: '', mood: '', statusMessage: '' });
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    setForm({
      nickname: user?.nickname || '',
      mood: user?.mood || '',
      statusMessage: user?.statusMessage || ''
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const avatarSrc = useMemo(
    () => previewUrl || resolveAssetUrl(user?.avatarUrl) || `https://api.dicebear.com/9.x/bottts/svg?seed=${user?.email || 'lovechat'}`,
    [previewUrl, user?.avatarUrl, user?.email]
  );

  if (!isAuthenticated && !localStorage.getItem('lovechat_token')) {
    return <Navigate to="/login" replace />;
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextPreview = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await updateProfile(formData);
      setPreviewUrl(nextPreview);
      setStatus('Profile picture updated.');
    } catch (error) {
      URL.revokeObjectURL(nextPreview);
      setStatus(error.response?.data?.message || 'Profile picture update failed.');
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    try {
      await updateProfile({
        nickname: form.nickname,
        mood: form.mood,
        statusMessage: form.statusMessage
      });
      setStatus('Profile saved successfully.');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Profile save failed.');
    }
  }

  function handleFeedbackSubmit(event) {
    event.preventDefault();
    if (!feedback.trim()) {
      setStatus('Write a short feedback note first.');
      return;
    }
    window.location.href = buildFeedbackMailto({
      user,
      room,
      feedback,
      subject: 'LoveChat feedback'
    });
    setStatus('Opening your mail app with the feedback draft.');
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="auth-page profile-page">
      <div className="auth-glow" />
      <motion.div className="profile-shell glass-panel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h1>Your space</h1>
            <p className="subtle">Avatar, status, feedback, and account actions live here.</p>
          </div>
          <div className="profile-header-actions">
            <button type="button" className="glass-button" onClick={() => navigate('/chat')}>Back to chat</button>
            <button type="button" className="glass-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="profile-summary">
          <div className="summary-chip">
            <span>Current mood</span>
            <strong>{user?.mood || 'Quiet romance'}</strong>
          </div>
          <div className="summary-chip">
            <span>Room</span>
            <strong>{room?.name || 'Private room'}</strong>
          </div>
          <div className="summary-chip">
            <span>Love streak</span>
            <strong>{room?.loveStreak || 0} days</strong>
          </div>
        </div>

        <div className="profile-layout">
          <section className="profile-card glass-panel">
            <div className="profile-avatar-wrap">
              <img className="profile-avatar" src={avatarSrc} alt="Profile" />
              <div className="profile-avatar-copy">
                <label className="profile-avatar-button">
                  Change photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
                <p className="profile-note">Use a clear face shot so the sidebar and room view stay recognizable.</p>
              </div>
            </div>
            <form className="profile-form" onSubmit={handleSave}>
              <div className="profile-card-title">
                <p className="section-label">Profile details</p>
                <h2>Refine how you show up</h2>
                <p>Keep this short and personal. The chat should feel like a shared space, not a settings form.</p>
              </div>
              <label>
                Nickname
                <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="Your nickname" />
              </label>
              <label>
                Mood
                <input value={form.mood} onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))} placeholder="Feeling cute, calm, excited..." />
              </label>
              <label>
                Status message
                <input value={form.statusMessage} onChange={(event) => setForm((current) => ({ ...current, statusMessage: event.target.value }))} placeholder="A short status for your profile" />
              </label>
              <button className="primary-button">Save profile</button>
            </form>
          </section>

          <section className="profile-card glass-panel">
            <div className="profile-card-title">
              <p className="section-label">Account details</p>
              <h2>What the app knows</h2>
              <p>Useful account facts, quick actions, and small reminders stay grouped here.</p>
            </div>
            <div className="profile-details">
              <div>
                <span>Email</span>
                <strong>{user?.email || 'Unknown'}</strong>
              </div>
              <div>
                <span>Name</span>
                <strong>{user?.name || 'Unknown'}</strong>
              </div>
              <div>
                <span>Room</span>
                <strong>{room?.name || 'Private room'}</strong>
              </div>
              <div>
                <span>Love streak</span>
                <strong>{room?.loveStreak || 0} days</strong>
              </div>
            </div>

            <div className="profile-actions-grid">
              <button type="button" className="glass-button" onClick={() => navigate('/forgot-password')}>Reset password</button>
              <button type="button" className="glass-button" onClick={() => navigator.clipboard.writeText(user?.email || '')}>Copy email</button>
            </div>

            <div className="profile-more">
              <p className="section-kicker">More</p>
              <h3>Small habits that improve the experience</h3>
              <ul>
                <li>Keep your avatar current so the sidebar stays recognizable.</li>
                <li>Use mood and status to show how you feel without sending a message.</li>
                <li>Send feedback from this page so the chat screen stays focused on conversation.</li>
              </ul>
            </div>
          </section>

          <section className="profile-card glass-panel profile-feedback-card">
            <div className="profile-card-title">
              <p className="section-label">Feedback</p>
              <h2>Leave a product note</h2>
              <p>Short, direct feedback is the easiest to act on.</p>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="profile-form">
              <textarea
                rows={6}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Tell us what feels good, what is missing, or what should be improved..."
                className="profile-feedback"
              />
              <button className="primary-button">Send feedback</button>
            </form>
            {status ? <p className="success-text">{status}</p> : null}
          </section>
        </div>
      </motion.div>
    </div>
  );
}