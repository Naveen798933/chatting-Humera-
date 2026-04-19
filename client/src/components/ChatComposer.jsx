export function ChatComposer({ value, onChange, onSend, onTyping, onImagePick, keyboardInset = 0 }) {
  return (
    <div className="composer" style={{ paddingBottom: `${Math.max(0, keyboardInset)}px` }}>
      <label className="composer-media">
        +
        <input type="file" accept="image/*" onChange={onImagePick} hidden />
      </label>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          onTyping(event.target.value);
        }}
        placeholder="Write a love note..."
        className="composer-input"
        onKeyDown={(event) => event.key === 'Enter' && onSend()}
      />
      <button type="button" className="composer-send" onClick={onSend}>Send</button>
    </div>
  );
}