import { motion } from 'framer-motion';

export function MessageBubble({ message, isMine, onDelete, onReact, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`message-row ${isMine ? 'mine' : 'theirs'}`}
    >
      <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
        {message.messageType === 'image' && message.attachmentUrl ? (
          <img src={message.attachmentUrl} alt="attachment" className="message-image" loading="lazy" />
        ) : (
          <p className="message-text">{message.isDeleted ? 'Message deleted' : message.plainText || message.text || 'Encrypted message'}</p>
        )}
        {message.reaction ? <span className="message-reaction">{message.reaction}</span> : null}
        <div className="message-meta">
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isMine ? <span>{message.seenBy?.length > 1 ? 'Seen ✓✓' : 'Sent ✓'}</span> : null}
        </div>
        {message.editedAt ? <div className="message-edited">Edited</div> : null}
        <div className="message-actions">
          <button type="button" onClick={() => onReact(message._id, '💖')}>💖</button>
          {isMine ? <button type="button" onClick={() => onEdit(message)}>Edit</button> : null}
          {isMine ? <button type="button" onClick={() => onDelete(message._id)}>Delete</button> : null}
        </div>
      </div>
    </motion.div>
  );
}