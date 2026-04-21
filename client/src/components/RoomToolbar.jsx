export function RoomToolbar({ room, onSendMusic, onUpdateMood, onUpdateMemory }) {
  return (
    <div className="glass-panel room-toolbar">
      <label className="toolbar-field">
        <span>Mood status</span>
        <input defaultValue={room?.moodStatus || ''} placeholder="Set the current room mood" onBlur={(event) => onUpdateMood(event.target.value)} />
      </label>
      <label className="toolbar-field">
        <span>Daily memory</span>
        <input defaultValue={room?.dailyMemoryMessage || ''} placeholder="Add a one-line memory" onBlur={(event) => onUpdateMemory(event.target.value)} />
      </label>
      <label className="toolbar-field">
        <span>Shared music</span>
        <input placeholder="Paste a music URL" onBlur={(event) => onSendMusic(event.target.value)} />
      </label>
    </div>
  );
}