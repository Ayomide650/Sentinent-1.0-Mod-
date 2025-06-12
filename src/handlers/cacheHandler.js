const cache = new Map();

module.exports = {
  set(key, value, ttl = 60000) {
    cache.set(key, { value, expires: Date.now() + ttl });
  },
  get(key) {
    const data = cache.get(key);
    if (!data) return null;
    if (Date.now() > data.expires) {
      cache.delete(key);
      return null;
    }
    return data.value;
  },
  delete(key) {
    cache.delete(key);
  },
  clear() {
    cache.clear();
  }
};
