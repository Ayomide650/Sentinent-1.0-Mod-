// Simple authentication middleware for API endpoints or admin commands
module.exports = (req, res, next) => {
  const apiKey = req.headers['authorization'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
