import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Private Room' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    encryptionSecret: { type: String, required: true },
    loveStreak: { type: Number, default: 0 },
    loveCounter: { type: Number, default: 0 },
    moodStatus: { type: String, default: 'Soft glow' },
    themeMode: { type: String, default: 'night-romantic' },
    sharedMusic: {
      isPlaying: { type: Boolean, default: false },
      title: { type: String, default: '' },
      url: { type: String, default: '' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    dailyMemoryMessage: { type: String, default: 'Today feels like us.' },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);