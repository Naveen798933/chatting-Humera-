export function notFound(_req, res, _next) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({ message: err.message || 'Server error' });
}