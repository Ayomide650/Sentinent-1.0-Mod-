module.exports = {
  isValidUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  },
  isValidId(str) {
    return /^\d{17,20}$/.test(str);
  }
};
