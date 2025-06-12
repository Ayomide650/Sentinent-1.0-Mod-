module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity('/help | Next-gen bot', { type: 'LISTENING' });
    // Load settings, cache, etc.
  }
};
