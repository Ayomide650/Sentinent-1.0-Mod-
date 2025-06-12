module.exports = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  truncate(str, max) {
    return str.length > max ? str.slice(0, max - 3) + '...' : str;
  }
};
