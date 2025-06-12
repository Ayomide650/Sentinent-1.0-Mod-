const db = require('../database');

// Example seed data for users, guilds, and roles
async function seed() {
  // Guild
  await db.from('guild_settings').upsert({
    guild_id: '123456789012345678',
    welcome_channel: '987654321098765432',
    log_channel: '987654321098765433',
    ban_log_channel: '987654321098765434',
    warn_log_channel: '987654321098765435',
    xp_enabled: true,
    automod_enabled: true,
    prefix: '!',
    level_roles: JSON.stringify({ "5": "111", "10": "222", "20": "333" }),
    settings_json: { blacklist: ['badword', 'spam'] }
  });

  // Users
  await db.from('users').upsert([
    {
      guild_id: '123456789012345678',
      user_id: '111111111111111111',
      xp: 500,
      level: 5,
      messages: 100
    },
    {
      guild_id: '123456789012345678',
      user_id: '222222222222222222',
      xp: 1200,
      level: 10,
      messages: 250
    }
  ]);

  // Warnings
  await db.from('warnings').insert({
    guild_id: '123456789012345678',
    user_id: '111111111111111111',
    moderator_id: '333333333333333333',
    reason: 'Spamming',
    severity: 1
  });

  // Custom Command
  await db.from('custom_commands').insert({
    guild_id: '123456789012345678',
    name: 'hello',
    response: 'Hello, world!',
    created_by: '333333333333333333'
  });

  // Reaction Role
  await db.from('reaction_roles').insert({
    guild_id: '123456789012345678',
    message_id: '444444444444444444',
    channel_id: '987654321098765432',
    emoji: '🔥',
    role_id: '555555555555555555'
  });

  // Mod Log
  await db.from('mod_logs').insert({
    guild_id: '123456789012345678',
    user_id: '111111111111111111',
    moderator_id: '333333333333333333',
    action: 'ban',
    reason: 'Serious violation',
    duration: '7d'
  });

  console.log('Seed data inserted!');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
