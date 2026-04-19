import crypto from 'crypto';
import nodemailer from 'nodemailer';

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

export function verifyOtp(otp, hash) {
  return hashOtp(otp) === hash;
}

export async function sendOtpEmail({ to, subject, otp }) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`OTP for ${to}: ${otp}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: host === 'smtp.gmail.com' ? 'gmail' : undefined,
    host: host === 'smtp.gmail.com' ? undefined : host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LoveChat <no-reply@lovechat.local>',
    to,
    subject,
    text: `Your LoveChat OTP is ${otp}`,
    html: `<div style="font-family:sans-serif"><h2>LoveChat OTP</h2><p>Your verification code is <strong>${otp}</strong>.</p></div>`
  });

  return true;
}