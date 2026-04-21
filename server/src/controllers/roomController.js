import Room from '../models/Room.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { decryptMessage, encryptMessage } from '../utils/crypto.js';
import { sanitizeUser } from './authController.js';

export async function getRoom(req, res) {
  const room = await Room.findById(req.params.roomId).populate('members', 'name email avatarUrl nickname mood isOnline lastSeenAt statusMessage');
  const messages = await Message.find({ roomId: room._id })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('sender', 'name email avatarUrl nickname')
    .populate('replyTo', 'encryptedText iv authTag isDeleted messageType attachmentUrl senderNickname');
  const payload = messages.map((message) => ({
    ...message.toObject(),
    plainText: message.isDeleted ? 'Message deleted' : decryptMessage(message, room.encryptionSecret),
    replyPreview: message.replyPreview || (message.replyTo
      ? (message.replyTo.isDeleted
        ? 'Message deleted'
        : (message.replyTo.messageType === 'image'
          ? 'Image'
          : decryptMessage(message.replyTo, room.encryptionSecret).slice(0, 100)))
      : '')
  }));
  res.json({ room, messages: payload });
}

export async function updateProfile(req, res) {
  const { nickname, mood, statusMessage } = req.body;
  if (typeof nickname === 'string') req.user.nickname = nickname.slice(0, 40);
  if (typeof mood === 'string') req.user.mood = mood.slice(0, 40);
  if (typeof statusMessage === 'string') req.user.statusMessage = statusMessage.slice(0, 120);
  if (req.file) req.user.avatarUrl = `/uploads/${req.file.filename}`;
  await req.user.save();
  res.json({ user: sanitizeUser(req.user) });
}

export async function updateRoomSettings(req, res) {
  const { moodStatus, themeMode, dailyMemoryMessage } = req.body;
  if (typeof moodStatus === 'string') req.room.moodStatus = moodStatus.slice(0, 100);
  if (typeof themeMode === 'string') req.room.themeMode = themeMode.slice(0, 60);
  if (typeof dailyMemoryMessage === 'string') req.room.dailyMemoryMessage = dailyMemoryMessage.slice(0, 240);
  req.room.lastActiveAt = new Date();
  await req.room.save();
  res.json({ room: req.room });
}

export async function sendMessage(req, res) {
  const { text, messageType = 'text', attachmentUrl = '', replyTo = null } = req.body;
  const room = req.room;
  const encrypted = encryptMessage(text || attachmentUrl || '', room.encryptionSecret);

  let replyMessage = null;
  let replyPreview = '';
  if (replyTo) {
    replyMessage = await Message.findById(replyTo);
    if (replyMessage && replyMessage.roomId.toString() === room._id.toString()) {
      replyPreview = replyMessage.isDeleted
        ? 'Message deleted'
        : (replyMessage.messageType === 'image'
          ? 'Image'
          : decryptMessage(replyMessage, room.encryptionSecret).slice(0, 100));
    }
  }

  const message = await Message.create({
    roomId: room._id,
    sender: req.user._id,
    senderNickname: req.user.nickname || req.user.name,
    encryptedText: encrypted.encryptedText,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    messageType,
    attachmentUrl,
    replyTo: replyMessage?._id || null,
    replyPreview,
    seenBy: [req.user._id]
  });

  room.loveCounter += 1;
  room.lastActiveAt = new Date();
  await room.save();
  await User.updateMany({ _id: { $in: room.members } }, { $set: { roomId: room._id } });

  res.status(201).json({
    message: {
      ...message.toObject(),
      plainText: decryptMessage(message, room.encryptionSecret),
      replyPreview
    }
  });
}

export async function togglePinMessage(req, res) {
  const { messageId } = req.params;
  const { isPinned } = req.body || {};
  const room = req.room;

  const message = await Message.findById(messageId);
  if (!message || message.roomId.toString() !== room._id.toString()) {
    return res.status(404).json({ message: 'Message not found in room' });
  }

  const pinSet = new Set((room.pinnedMessageIds || []).map((item) => item.toString()));
  const shouldPin = typeof isPinned === 'boolean' ? isPinned : !pinSet.has(messageId);

  if (shouldPin) {
    pinSet.add(messageId);
  } else {
    pinSet.delete(messageId);
  }

  room.pinnedMessageIds = Array.from(pinSet);
  room.lastActiveAt = new Date();
  await room.save();

  return res.json({
    pinnedMessageIds: room.pinnedMessageIds.map((item) => item.toString()),
    messageId,
    isPinned: shouldPin
  });
}

export async function deleteMessage(req, res) {
  const message = await Message.findById(req.params.messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not allowed' });
  }
  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();
  res.json({ message: 'Deleted' });
}

export async function editMessage(req, res) {
  const message = await Message.findById(req.params.messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found' });
  }
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  const room = req.room || (await Room.findById(message.roomId));
  const encrypted = encryptMessage(text.trim(), room.encryptionSecret);
  message.encryptedText = encrypted.encryptedText;
  message.iv = encrypted.iv;
  message.authTag = encrypted.authTag;
  message.editedAt = new Date();
  message.editCount += 1;
  await message.save();

  res.json({
    message: {
      ...message.toObject(),
      plainText: decryptMessage(message, room.encryptionSecret)
    }
  });
}