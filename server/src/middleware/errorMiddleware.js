export function notFound(_req, res, _next) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  const response = { message: err.message || 'Server error' };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }
  res.status(status).json(response);
}