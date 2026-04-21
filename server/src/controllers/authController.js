import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { createRoomSecret } from '../utils/crypto.js';
import { generateOtp, hashOtp, sendOtpEmail, verifyOtp } from '../utils/otp.js';
import { signToken } from '../middleware/authMiddleware.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function asString(value) {
  return String(value || '');
}


async function getOrCreatePrivateRoom() {
  let room = await Room.findOne();
  if (!room) {
    room = await Room.create({
      name: process.env.APP_DEFAULT_ROOM_NAME || 'Private Room',
      encryptionSecret: createRoomSecret(),
      members: []
    });
  }
  return room;
}

export async function signup(req, res) {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = asString(name).trim();
  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Account already exists' });
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  const room = await getOrCreatePrivateRoom();
  user.roomId = room._id;
  await user.save();
  if (room.members.length < 2 && !room.members.find((member) => member.toString() === user._id.toString())) {
    room.members.push(user._id);
    await room.save();
  }

  let delivered = false;
  let mailError = '';
  try {
    delivered = await sendOtpEmail({ to: user.email, subject: 'Verify your LoveChat account', otp });
  } catch (error) {
    mailError = error.message || 'Unable to send OTP email';
    console.error('OTP email error:', error);
  }

  return res.status(201).json({
    message: 'Signup successful. Verify OTP to continue.',
    requiresOtp: true,
    userId: user._id,
    debugOtp: !delivered || process.env.NODE_ENV === 'development' ? otp : undefined,
    mailError: mailError || undefined
  });
}

export async function verifyOtpRoute(req, res) {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.otpHash || !user.otpExpiresAt) {
    return res.status(400).json({ message: 'OTP not found' });
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (!verifyOtp(otp, user.otpHash)) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.isVerified = true;
  user.otpHash = '';
  user.otpExpiresAt = null;
  await user.save();

  const token = signToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false });
  return res.json({
    message: 'OTP verified',
    token,
    user: sanitizeUser(user)
  });
}

export async function resendVerificationOtp(req, res) {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(404).json({ message: 'Account not found' });
  }
  if (user.isVerified) {
    return res.status(400).json({ message: 'Account already verified' });
  }

  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  let delivered = false;
  let mailError = '';
  try {
    delivered = await sendOtpEmail({ to: user.email, subject: 'Verify your LoveChat account', otp });
  } catch (error) {
    mailError = error.message || 'Unable to send OTP email';
    console.error('Resend OTP email error:', error);
  }

  return res.json({
    message: 'Verification OTP sent.',
    debugOtp: !delivered || process.env.NODE_ENV === 'development' ? otp : undefined,
    mailError: mailError || undefined
  });
}

export async function login(req, res) {
  const { email, password, rememberMe } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = asString(password);
  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: 'Account not verified. Please verify your OTP first.',
      requiresOtp: true,
      email: user.email
    });
  }

  const valid = await bcrypt.compare(normalizedPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined
  });

  return res.json({ token, user: sanitizeUser(user) });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.json({ message: 'If the account exists, an OTP was sent.' });
  }

  const otp = generateOtp();
  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  let delivered = false;
  let mailError = '';
  try {
    delivered = await sendOtpEmail({ to: user.email, subject: 'Reset your LoveChat password', otp });
  } catch (error) {
    mailError = error.message || 'Unable to send OTP email';
    console.error('Password reset OTP email error:', error);
  }

  return res.json({
    message: 'If the account exists, an OTP was sent.',
    debugOtp: !delivered || process.env.NODE_ENV === 'development' ? otp : undefined,
    mailError: mailError || undefined
  });
}

export async function resetPassword(req, res) {
  const { email, otp, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otp || !password) {
    return res.status(400).json({ message: 'Email, OTP, and password are required' });
  }
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    return res.status(400).json({ message: 'OTP not found' });
  }
  if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (!verifyOtp(otp, user.passwordResetOtpHash)) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetOtpHash = '';
  user.passwordResetOtpExpiresAt = null;
  await user.save();

  return res.json({ message: 'Password reset successful' });
}

export async function me(req, res) {
  const user = req.user;
  const room = user.roomId ? await Room.findById(user.roomId).populate('members', 'name email avatarUrl nickname mood isOnline lastSeenAt') : null;
  res.json({ user: sanitizeUser(user), room });
}

export function logout(_req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

export function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    nickname: user.nickname,
    statusMessage: user.statusMessage,
    mood: user.mood,
    isOnline: user.isOnline,
    lastSeenAt: user.lastSeenAt,
    roomId: user.roomId
  };
}