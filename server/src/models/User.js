import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    nickname: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, default: '' },
    otpExpiresAt: { type: Date },
    passwordResetOtpHash: { type: String, default: '' },
    passwordResetOtpExpiresAt: { type: Date },
    statusMessage: { type: String, default: 'Available for love notes' },
    mood: { type: String, default: 'Romantic' },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);