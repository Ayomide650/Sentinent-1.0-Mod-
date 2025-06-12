// Command cooldown middleware for Discord interactions
const cooldowns = new Map();

module.exports = (commandName, userId, cooldownSeconds) => {
  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  if (timestamps.has(userId)) {
    const expiration = timestamps.get(userId) + cooldownSeconds * 1000;
    if (now < expiration) return (expiration - now) / 1000;
  }
  timestamps.set(userId, now);
  return 0;
};
