module.exports = {
  async assignMilestoneRole(member, level, milestoneRoles) {
    // milestoneRoles: { [level]: roleId }
    const roleId = milestoneRoles[level];
    if (!roleId) return;
    await member.roles.add(roleId);
    // Remove previous milestone roles
    for (const [lvl, id] of Object.entries(milestoneRoles)) {
      if (parseInt(lvl) < level && member.roles.cache.has(id)) {
        await member.roles.remove(id);
      }
    }
  }
};
