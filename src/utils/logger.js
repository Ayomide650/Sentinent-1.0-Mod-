const fs = require('fs');
const path = require('path');

function logToFile(filename, message) {
  const logPath = path.join(__dirname, '../../logs', filename);
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

module.exports = {
  info(msg) {
    console.log(`INFO: ${msg}`);
    logToFile('bot.log', `INFO: ${msg}`);
  },
  warn(msg) {
    console.warn(`WARN: ${msg}`);
    logToFile('error.log', `WARN: ${msg}`);
  },
  error(msg) {
    console.error(`ERROR: ${msg}`);
    logToFile('error.log', `ERROR: ${msg}`);
  },
  command(msg) {
    logToFile('commands.log', msg);
  },
  moderation(msg) {
    logToFile('moderation.log', msg);
  },
  xp(msg) {
    logToFile('xp.log', msg);
  }
};
