const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const loginAttempts = new Map();

function getRequestKey(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `${ip}:${email || 'anonymous'}`;
}

function getActiveAttempts(key, now = Date.now()) {
  const current = loginAttempts.get(key) || [];
  return current.filter((timestamp) => now - timestamp < WINDOW_MS);
}

export function loginRateLimit(req, res, next) {
  const key = getRequestKey(req);
  const now = Date.now();
  const attempts = getActiveAttempts(key, now);

  if (attempts.length >= MAX_ATTEMPTS) {
    const oldestAttempt = attempts[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - oldestAttempt)) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message: 'Too many login attempts. Please wait a few minutes and try again.'
    });
  }

  loginAttempts.set(key, attempts);

  res.on('finish', () => {
    const refreshed = getActiveAttempts(key);
    if (res.statusCode === 401) {
      refreshed.push(Date.now());
      loginAttempts.set(key, refreshed);
      return;
    }
    if (res.statusCode < 400) {
      loginAttempts.delete(key);
    }
  });

  return next();
}
