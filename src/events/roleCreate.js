module.exports = {
  name: 'roleCreate',
  async execute(role) {
    // Log role creation: info, creator
    console.log(`Role Created: ${role.name} by ${role.guild.ownerId}`);
  }
};
