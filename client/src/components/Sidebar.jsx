import { resolveAssetUrl } from '../lib/assets.js';

export function Sidebar({ user, room, onOpenProfile, onOpenRoom, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="sidebar-head">
        <div>
          <p className="eyebrow">Private Room</p>
          <h2>{room?.name || 'LoveChat'}</h2>
        </div>
        <button className="glass-button mobile-only" onClick={() => setMobileMenuOpen(false)}>Close</button>
      </div>
      <div className="sidebar-profile">
        <img src={resolveAssetUrl(user?.avatarUrl) || `https://api.dicebear.com/9.x/bottts/svg?seed=${user?.email || 'lovechat'}`} alt="profile" />
        <div>
          <strong>{user?.nickname || user?.name}</strong>
          <p>{user?.statusMessage}</p>
        </div>
      </div>
      <button className="sidebar-action" onClick={onOpenProfile}>Profile</button>
      <button className="sidebar-action" onClick={onOpenRoom}>Room settings</button>
      <div className="sidebar-card">
        <p>Love streak</p>
        <strong>{room?.loveStreak || 0} days</strong>
      </div>
      <div className="sidebar-card">
        <p>Daily memory</p>
        <strong>{room?.dailyMemoryMessage || 'Today feels like us.'}</strong>
      </div>
      <button className="sidebar-action mobile-only" onClick={() => setMobileMenuOpen(false)}>Back to chat</button>
    </aside>
  );
}