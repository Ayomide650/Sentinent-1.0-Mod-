module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    // Log channel updates: before/after
    console.log(`Channel updated: ${oldChannel.name} -> ${newChannel.name}`);
  }
};
