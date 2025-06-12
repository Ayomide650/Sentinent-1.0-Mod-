// Rate limiting middleware for API endpoints or commands
const rateLimits = new Map();

module.exports = (key, userId, limit, interval) => {
  if (!rateLimits.has(key)) rateLimits.set(key, new Map());
  const userLimits = rateLimits.get(key);
  const now = Date.now();
  if (!userLimits.has(userId)) userLimits.set(userId, []);
  const timestamps = userLimits.get(userId).filter(ts => now - ts < interval);
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  userLimits.set(userId, timestamps);
  return false;
};
