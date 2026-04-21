export function ChatComposer({ value, onChange, onSend, onTyping, onImagePick, keyboardInset = 0, isEditing = false }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="composer" style={{ paddingBottom: `${Math.max(0, keyboardInset)}px` }}>
      <label className="composer-media">
        +
        <input type="file" accept="image/*" onChange={onImagePick} hidden />
      </label>
      <textarea
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          onTyping(event.target.value);
        }}
        placeholder={isEditing ? 'Update your message...' : 'Write a love note...'}
        className="composer-input"
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <button type="button" className="composer-send" onClick={onSend}>{isEditing ? 'Save' : 'Send'}</button>
    </div>
  );
}