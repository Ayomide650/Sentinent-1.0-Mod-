```javascript
module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    // Log role updates: before/after
    console.log(`Role updated: ${oldRole.name} -> ${newRole.name}`);
  }
};
```