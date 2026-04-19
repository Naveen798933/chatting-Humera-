export function RoomToolbar({ room, onSendMusic, onUpdateMood, onUpdateMemory }) {
  return (
    <div className="glass-panel room-toolbar">
      <input defaultValue={room?.moodStatus || ''} placeholder="Mood status" onBlur={(event) => onUpdateMood(event.target.value)} />
      <input defaultValue={room?.dailyMemoryMessage || ''} placeholder="Daily memory" onBlur={(event) => onUpdateMemory(event.target.value)} />
      <input placeholder="Shared music URL" onBlur={(event) => onSendMusic(event.target.value)} />
    </div>
  );
}