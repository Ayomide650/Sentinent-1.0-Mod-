module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    // Log channel deletion: info, deleter
    console.log(`Channel deleted: ${channel.name} (ID: ${channel.id})`);
  }
};
