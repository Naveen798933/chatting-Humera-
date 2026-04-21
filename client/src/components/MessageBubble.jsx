import { motion } from 'framer-motion';

export function MessageBubble({
  message,
  isMine,
  onDelete,
  onReact,
  onEdit,
  onToggleStar,
  onReply,
  onTogglePin,
  isPinned = false,
  isStarred = false
}) {
  async function handleCopy() {
    const text = message.plainText || message.text || '';
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors in unsupported browsers
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      id={`message-${message._id}`}
      className={`message-row ${isMine ? 'mine' : 'theirs'}`}
    >
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
        {message.replyPreview ? <div className="reply-preview">Replying to: {message.replyPreview}</div> : null}
        {message.messageType === 'image' && message.attachmentUrl ? (
          <img src={message.attachmentUrl} alt="attachment" className="message-image" loading="lazy" />
        ) : (
          <p className="message-text">{message.isDeleted ? 'Message deleted' : message.plainText || message.text || 'Encrypted message'}</p>
        )}
        {isPinned ? <span className="message-pinned">Pinned</span> : null}
        {message.reaction ? <span className="message-reaction">{message.reaction}</span> : null}
        <div className="message-meta">
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isMine ? <span>{message.seenBy?.length > 1 ? 'Seen ✓✓' : 'Sent ✓'}</span> : null}
        </div>
        {message.editedAt ? <div className="message-edited">Edited</div> : null}
        <div className="message-actions">
          <button type="button" className={`pin-chip ${isPinned ? 'active' : ''}`} onClick={() => onTogglePin(message._id)}>{isPinned ? 'Unpin' : 'Pin'}</button>
          <button type="button" className={`star-chip ${isStarred ? 'active' : ''}`} onClick={() => onToggleStar(message._id)}>{isStarred ? '★' : '☆'}</button>
          <button type="button" onClick={() => onReply(message)}>Reply</button>
          <button type="button" className={`reaction-chip ${message.reaction === '💖' ? 'active' : ''}`} onClick={() => onReact(message._id, '💖')}>💖</button>
          <button type="button" className={`reaction-chip ${message.reaction === '😍' ? 'active' : ''}`} onClick={() => onReact(message._id, '😍')}>😍</button>
          <button type="button" className={`reaction-chip ${message.reaction === '🔥' ? 'active' : ''}`} onClick={() => onReact(message._id, '🔥')}>🔥</button>
          <button type="button" className={`reaction-chip ${message.reaction === '😂' ? 'active' : ''}`} onClick={() => onReact(message._id, '😂')}>😂</button>
          {message.messageType !== 'image' ? <button type="button" onClick={handleCopy}>Copy</button> : null}
          {isMine ? <button type="button" onClick={() => onEdit(message)}>Edit</button> : null}
          {isMine ? <button type="button" onClick={() => onDelete(message._id)}>Delete</button> : null}
        </div>
      </div>
    </motion.div>
  );
}