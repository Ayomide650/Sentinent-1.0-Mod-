module.exports = {
  hasPermission(member, requiredPerms) {
    if (!requiredPerms || requiredPerms.length === 0) return true;
    return requiredPerms.every(perm => member.permissions.has(perm));
  }
};
