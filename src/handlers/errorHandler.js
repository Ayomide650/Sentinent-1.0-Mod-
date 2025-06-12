module.exports = (client) => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    // Optionally log to a channel or webhook
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Optionally log to a channel or webhook
  });
  client.on('error', (error) => {
    console.error('Client Error:', error);
  });
  client.on('warn', (info) => {
    console.warn('Client Warning:', info);
  });
};
