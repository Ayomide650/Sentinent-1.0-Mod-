module.exports = {
  hasAdmin(member) {
    return member.permissions.has('Administrator');
  },
  hasPermission(member, perm) {
    return member.permissions.has(perm);
  }
};
