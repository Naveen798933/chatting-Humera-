export function PresencePill({ online, label }) {
  return (
    <span className={`presence-pill ${online ? 'online' : 'offline'}`}>
      <span className="presence-dot" />
      {label}
    </span>
  );
}