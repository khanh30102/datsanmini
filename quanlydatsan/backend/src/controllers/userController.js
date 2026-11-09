const mongoose = require('mongoose');
const User = require('../models/User');

function accountResponse(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt
  };
}

async function listAccounts(_req, res) {
  const users = await User.find()
    .select('name email phone role createdAt')
    .sort({ createdAt: -1 })
    .lean();
  return res.json(users.map(accountResponse));
}

async function updateAccountRole(req, res) {
  const { role } = req.body;
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Mã tài khoản không hợp lệ.' });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Vai trò tài khoản không hợp lệ.' });
  }
  if (String(req.user.sub) === req.params.id) {
    return res.status(400).json({ message: 'Không thể thay đổi vai trò của chính tài khoản đang đăng nhập.' });
  }

  const account = await User.findById(req.params.id);
  if (!account) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });

  if (account.role === 'admin' && role === 'user') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(409).json({ message: 'Không thể hạ quyền quản trị viên cuối cùng.' });
    }
  }

  account.role = role;
  await account.save();
  return res.json(accountResponse(account));
}

module.exports = { listAccounts, updateAccountRole };
