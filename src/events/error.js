```javascript
module.exports = {
  name: 'error',
  execute(error) {
    // Log errors, send to error log channel/webhook
    console.error('Bot Error:', error);
    // ...existing code...
  }
};
```