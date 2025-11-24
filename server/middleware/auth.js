const jwt = require('jsonwebtoken');
const { mysqlPool } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours et n'est pas banni
    const [users] = await mysqlPool.execute(
      'SELECT id, username, email, role, is_banned FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (users[0].is_banned) {
      return res.status(403).json({ error: 'User is banned' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };

