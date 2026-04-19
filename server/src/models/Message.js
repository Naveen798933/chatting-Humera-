import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderNickname: { type: String, default: '' },
    encryptedText: { type: String, default: '' },
    iv: { type: String, default: '' },
    authTag: { type: String, default: '' },
    messageType: { type: String, enum: ['text', 'image', 'voice', 'emoji', 'system'], default: 'text' },
    attachmentUrl: { type: String, default: '' },
    reaction: { type: String, default: '' },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    editedAt: { type: Date, default: null },
    editCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);