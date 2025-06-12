# 🤖 Sentinent-1.0-Mod- — Advanced Discord Bot

## 🌟 Overview

Sentinent-1.0-Mod- is a next-generation Discord bot designed to completely surpass MEE6 and Dyno with advanced features, superior performance, and unmatched functionality. Built with discord.js v14 and deployed on Render.

---

## 🎯 Features

### Leveling System
- XP progression with anti-spam, voice/reaction XP, and milestone roles (5–100)
- Automatic role management and cleanup
- Weekly/monthly leaderboards, analytics, and customizable rewards

### Moderation System
- Advanced moderation commands: ban, kick, mute, warn, clear, slowmode, lock, unlock, lockdown, nuke, massban, purge, antilink
- Progressive discipline and escalation
- Comprehensive logging and audit trails
- Auto-moderation: word filter, anti-spam, anti-raid, link protection

### Utility & Info
- Bot info, uptime, invite, support, server/user info, avatar/banner, roles/permissions, analytics, prefix, autorole, settings

### Welcome & Leave System
- Customizable welcome/leave messages and cards
- Autorole assignment and member count channels

### Reaction Roles & Custom Commands
- Advanced reaction role panels and management
- Server-specific custom commands with placeholders

### Fun & Social (add your own in `src/commands/fun/`)
- Meme, joke, 8ball, coinflip, roll, rps, trivia, riddle, quote, fact, advice, compliment, roast, ship, ascii, reverse, mock, zalgo, choose, poll

### Logging & Analytics
- Message/member/server/voice/moderation logs
- Ban logging, audit trails, usage analytics

### Security & Performance
- Permission validation, input sanitization, rate limiting, error recovery, advanced caching, scalable to 1000+ servers

---

## 📦 Project Structure

- `src/commands/` — All command modules (leveling, moderation, utility, admin, fun)
- `src/events/` — Discord event handlers
- `src/handlers/` — Command/event/error/cooldown/permission/validation/rateLimit/cache handlers
- `src/utils/` — Utilities for logging, embeds, canvas, permissions, time, formatting, XP, roles, images, text parsing
- `src/database/` — Database connection, models, migrations, seeds
- `src/middleware/` — Middleware for auth, cooldown, permissions, rate limiting, validation, logging
- `src/services/` — Service layer for XP, leveling, moderation, welcome, logging, automod, reaction roles, custom commands, analytics, backup
- `config/` — Configuration files
- `assets/` — Images, fonts, templates for cards and branding
- `logs/` — Log files

---

## 🛠️ Setup & Deployment

1. **Clone the repo and install dependencies:**
   ```bash
   git clone <repo-url>
   cd Sentinent-1.0-Mod-
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your secrets.

3. **Set up the database:**
   - Run the SQL in `src/database/migrations/001_init.sql` on your Supabase instance.
   - (Optional) Seed with demo data:
     ```bash
     node src/database/seeds/seed.js
     ```

4. **Deploy on Render or run locally:**
   ```bash
   npm start
   ```

---

## 🚀 Why Sentinent-1.0-Mod- Surpasses MEE6 and Dyno

- **Superior Leveling:** Detailed analytics, milestone roles, customizable rewards
- **Smarter Moderation:** Context-aware filtering, escalation, audit trails, mass tools
- **More Fun:** Interactive games, text tools, meme generation, social features
- **Better UX:** Context-aware help, public info, fast response, beautiful embeds
- **Advanced Tech:** Real-time stats, cross-server lookup, robust error handling

---

## 📈 Success Metrics

- 500+ servers, 50,000+ users, 24/7 uptime, sub-200ms response, <200MB memory

---

## 📚 Documentation

See the [full feature documentation](./docs/FEATURES.md) for command details and advanced setup.

---

## 📝 License

MIT (see LICENSE)