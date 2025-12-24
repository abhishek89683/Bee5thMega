const jwt = require('jsonwebtoken');
const User = require('../models/User');

function protect(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, isAdmin: decoded.isAdmin };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
}

function admin(req, res, next) {
  if (req.user && req.user.isAdmin) return next();
  return res.status(403).json({ message: 'Admin access required' });
}

module.exports = { protect, admin };
