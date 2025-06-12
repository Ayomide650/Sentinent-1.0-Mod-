const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Recreate this channel and delete all messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const channel = interaction.channel;
    const position = channel.position;
    const newChannel = await channel.clone();
    await newChannel.setPosition(position);
    await channel.delete();
    await newChannel.send('Channel nuked and recreated.');
  }
};