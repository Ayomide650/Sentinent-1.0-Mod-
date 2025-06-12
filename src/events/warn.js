```javascript
module.exports = {
  name: 'warn',
  execute(info) {
    // Log warnings, send to warn log channel/webhook
    console.warn('Bot Warning:', info);
    // ...existing code...
  }
};
```