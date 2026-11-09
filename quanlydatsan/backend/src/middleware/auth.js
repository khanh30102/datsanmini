const jwt = require('jsonwebtoken');
const User = require('../models/User');

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

async function isAdmin(req, res, next) {
  const user = await User.findById(req.user?.sub).select('role').lean();
  if (user?.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
  }
  return next();
}

module.exports = { verifyToken, isAdmin };