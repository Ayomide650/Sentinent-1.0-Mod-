```javascript
module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    // Log channel creation: info, creator
    console.log(`Channel created: ${channel.name} (ID: ${channel.id})`);
  }
};
```
