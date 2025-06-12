module.exports = {
  isValidString(str, min = 1, max = 2000) {
    return typeof str === 'string' && str.length >= min && str.length <= max;
  },
  isValidNumber(num, min, max) {
    return typeof num === 'number' && num >= min && num <= max;
  }
};
