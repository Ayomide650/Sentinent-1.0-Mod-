// Permission checking middleware for Discord commands
module.exports = (interaction, requiredPerms = []) => {
  if (!interaction.member) return false;
  if (requiredPerms.length === 0) return true;
  return requiredPerms.every(perm => interaction.member.permissions.has(perm));
};
