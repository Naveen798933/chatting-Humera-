export function TypingIndicator({ text = 'Typing...' }) {
  return (
    <div className="typing-indicator">
      <span className="typing-avatar" />
      <span>{text}</span>
      <span className="typing-dots"><i /><i /><i /></span>
    </div>
  );
}