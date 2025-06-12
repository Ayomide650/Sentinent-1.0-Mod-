-- Users table for XP tracking
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  messages INTEGER DEFAULT 0,
  last_message TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  warnings INTEGER DEFAULT 0,
  voice_time INTEGER DEFAULT 0
);

-- Guild settings
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id VARCHAR(32) PRIMARY KEY,
  welcome_channel VARCHAR(32),
  leave_channel VARCHAR(32),
  log_channel VARCHAR(32),
  ban_log_channel VARCHAR(32),
  warn_log_channel VARCHAR(32),
  xp_enabled BOOLEAN DEFAULT TRUE,
  automod_enabled BOOLEAN DEFAULT TRUE,
  antilink_channels TEXT[],
  level_roles JSONB,
  prefix VARCHAR(8) DEFAULT '!',
  settings_json JSONB
);

-- Warning system
CREATE TABLE IF NOT EXISTS warnings (
  id SERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  moderator_id VARCHAR(32) NOT NULL,
  reason TEXT,
  severity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);

-- Custom commands
CREATE TABLE IF NOT EXISTS custom_commands (
  id SERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  response TEXT NOT NULL,
  created_by VARCHAR(32),
  uses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reaction roles
CREATE TABLE IF NOT EXISTS reaction_roles (
  id SERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  message_id VARCHAR(32) NOT NULL,
  channel_id VARCHAR(32) NOT NULL,
  emoji VARCHAR(64) NOT NULL,
  role_id VARCHAR(32) NOT NULL,
  max_uses INTEGER
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS mod_logs (
  id SERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  moderator_id VARCHAR(32),
  action VARCHAR(32) NOT NULL,
  reason TEXT,
  duration VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
