// Input validation middleware for commands or API
module.exports = {
  isString(str, min = 1, max = 2000) {
    return typeof str === 'string' && str.length >= min && str.length <= max;
  },
  isNumber(num, min, max) {
    return typeof num === 'number' && num >= min && num <= max;
  },
  isValidId(str) {
    return /^\d{17,20}$/.test(str);
  }
};
