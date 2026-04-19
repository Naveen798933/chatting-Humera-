import Room from '../models/Room.js';

export async function requirePrivateRoom(req, res, next) {
  const room = await Room.findById(req.params.roomId || req.body.roomId);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  const memberIds = room.members.map((member) => member.toString());
  if (!memberIds.includes(req.user._id.toString())) {
    return res.status(403).json({ message: 'Access denied' });
  }
  req.room = room;
  next();
}