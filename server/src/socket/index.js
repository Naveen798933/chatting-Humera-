import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { encryptMessage } from '../utils/crypto.js';

const onlineUsers = new Map();

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || !user.isVerified) return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    const roomId = socket.user.roomId?.toString();
    if (roomId) {
      socket.join(roomId);
    }
    onlineUsers.set(userId, socket.id);
    socket.user.isOnline = true;
    socket.user.lastSeenAt = null;
    await socket.user.save();

    if (roomId) {
      io.to(roomId).emit('presence:update', { userId, isOnline: true });
    }

    socket.on('room:open', async ({ roomId: activeRoomId }) => {
      if (!activeRoomId || activeRoomId !== roomId) return;
      socket.to(activeRoomId).emit('room:viewing', { userId, isViewing: true });
      const messages = await Message.find({ roomId: activeRoomId, seenBy: { $ne: socket.user._id } });
      for (const message of messages) {
        message.seenBy.push(socket.user._id);
        await message.save();
        io.to(activeRoomId).emit('message:seen', {
          messageId: message._id,
          seenBy: socket.user._id,
          seenAt: new Date()
        });
      }
    });

    socket.on('typing', ({ roomId: activeRoomId, isTyping }) => {
      if (activeRoomId) {
        socket.to(activeRoomId).emit('typing', { userId, isTyping });
      }
    });

    socket.on('cursor:move', ({ roomId: activeRoomId, x, y }) => {
      if (activeRoomId) {
        socket.to(activeRoomId).emit('cursor:move', { userId, x, y });
      }
    });

    socket.on('reaction:add', async ({ roomId: activeRoomId, messageId, reaction }) => {
      const message = await Message.findById(messageId);
      if (!message || message.roomId.toString() !== activeRoomId) return;
      message.reaction = reaction;
      await message.save();
      io.to(activeRoomId).emit('reaction:update', { messageId, reaction, userId });
    });

    socket.on('music:update', async ({ roomId: activeRoomId, title, url, isPlaying }) => {
      const room = await Room.findById(activeRoomId);
      if (!room) return;
      room.sharedMusic = { title, url, isPlaying, updatedBy: socket.user._id };
      room.lastActiveAt = new Date();
      await room.save();
      io.to(activeRoomId).emit('music:update', { title, url, isPlaying, updatedBy: userId });
    });

    socket.on('mood:update', async ({ roomId: activeRoomId, moodStatus }) => {
      const room = await Room.findById(activeRoomId);
      if (!room) return;
      room.moodStatus = moodStatus;
      await room.save();
      io.to(activeRoomId).emit('mood:update', { moodStatus, userId });
    });

    socket.on('miss-you', ({ roomId: activeRoomId }) => {
      socket.to(activeRoomId).emit('miss-you', { userId, at: new Date() });
    });

    socket.on('message:send', async ({ roomId: activeRoomId, text, messageType = 'text', attachmentUrl = '' }) => {
      const room = await Room.findById(activeRoomId);
      if (!room) return;
      if (room.members.length !== 2) return;
      const payload = text || attachmentUrl || '';
      const encrypted = encryptMessage(payload, room.encryptionSecret);
      const message = await Message.create({
        roomId: activeRoomId,
        sender: socket.user._id,
        senderNickname: socket.user.nickname || socket.user.name,
        encryptedText: encrypted.encryptedText,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        messageType,
        attachmentUrl,
        seenBy: [socket.user._id]
      });
      room.loveCounter += 1;
      room.lastActiveAt = new Date();
      await room.save();
      io.to(activeRoomId).emit('message:new', {
        message: {
          ...message.toObject(),
          plainText: payload
        }
      });
    });

    socket.on('message:delete', async ({ messageId }) => {
      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId) return;
      message.isDeleted = true;
      await message.save();
      io.to(message.roomId.toString()).emit('message:delete', { messageId });
    });

    socket.on('message:edit', async ({ messageId, text }) => {
      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId) return;
      const room = await Room.findById(message.roomId);
      if (!room) return;
      const encrypted = encryptMessage(text, room.encryptionSecret);
      message.encryptedText = encrypted.encryptedText;
      message.iv = encrypted.iv;
      message.authTag = encrypted.authTag;
      message.editedAt = new Date();
      message.editCount = (message.editCount || 0) + 1;
      await message.save();
      io.to(message.roomId.toString()).emit('message:update', {
        messageId,
        text,
        editedAt: message.editedAt,
        editCount: message.editCount
      });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      socket.user.isOnline = false;
      socket.user.lastSeenAt = new Date();
      await socket.user.save();
      if (roomId) {
        io.to(roomId).emit('presence:update', { userId, isOnline: false, lastSeenAt: socket.user.lastSeenAt });
      }
    });
  });

  return io;
}