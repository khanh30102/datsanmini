const jwt = require('jsonwebtoken');
const PendingRegistration = require('../models/PendingRegistration');
const User = require('../models/User');
const { checkPhoneVerification, requestPhoneVerification } = require('../utils/sms');

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function normalizePhone(value) {
  if (typeof value !== 'string') return null;
  let phone = value.trim().replace(/[\s()-]/g, '');
  if (/^0\d{9}$/.test(phone)) phone = `+84${phone.slice(1)}`;
  else if (/^84\d{9}$/.test(phone)) phone = `+${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

async function requestRegistrationOtp(req, res) {
  const { name, email, password } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100
      || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      || typeof password !== 'string' || password.length < 8 || !phone) {
    return res.status(400).json({ message: 'Vui lòng nhập tên, email hợp lệ, mật khẩu tối thiểu 8 ký tự và số điện thoại hợp lệ.' });
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('Thiếu JWT_SECRET trong cấu hình.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'Email đã được sử dụng.' });
  }

  const now = new Date();
  let pending = await PendingRegistration.findOne({ phone });
  if (pending && now.getTime() - pending.lastSentAt.getTime() < OTP_RESEND_DELAY_MS) {
    return res.status(429).json({ message: 'Vui lòng chờ 1 phút trước khi gửi lại mã OTP.' });
  }

  const registration = {
    name: name.trim(),
    email: normalizedEmail,
    phone,
    attempts: 0,
    lastSentAt: now,
    expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS)
  };
  try {
    if (pending) {
      Object.assign(pending, registration);
      await pending.save();
    } else {
      pending = await PendingRegistration.create(registration);
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(429).json({ message: 'Đã có yêu cầu gửi mã OTP cho số điện thoại này. Vui lòng thử lại sau.' });
    }
    throw error;
  }

  try {
    await requestPhoneVerification(phone);
  } catch (error) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    if (error.status === 503) {
      return res.status(503).json({ message: 'Dịch vụ gửi SMS chưa được cấu hình.' });
    }
    console.error('Không yêu cầu được OTP qua Twilio Verify:', error.message);
    return res.status(502).json({ message: 'Không gửi được mã OTP. Kiểm tra cấu hình Twilio, số nhận đã xác minh và thử lại.' });
  }
  return res.json({ message: 'Đã gửi mã OTP đến số điện thoại của bạn.', expiresInSeconds: OTP_LIFETIME_MS / 1000 });
}

async function verifyRegistrationOtp(req, res) {
  const phone = normalizePhone(req.body.phone);
  const { code, password } = req.body;
  if (!phone || typeof code !== 'string' || !/^\d{6}$/.test(code)
      || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Mã OTP hoặc mật khẩu không hợp lệ.' });
  }

  const pending = await PendingRegistration.findOne({ phone, expiresAt: { $gt: new Date() } });
  if (!pending) {
    return res.status(400).json({ message: 'Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' });
  }
  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    return res.status(429).json({ message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.' });
  }

  let isApproved;
  try {
    isApproved = await checkPhoneVerification(phone, code);
  } catch (error) {
    if (error.status === 503) {
      return res.status(503).json({ message: 'Dịch vụ xác minh SMS chưa được cấu hình.' });
    }
    console.error('Không xác minh được OTP qua Twilio Verify:', error.message);
    return res.status(502).json({ message: 'Không thể xác minh mã OTP lúc này. Vui lòng thử lại.' });
  }
  if (!isApproved) {
    pending.attempts += 1;
    await pending.save();
    return res.status(pending.attempts >= OTP_MAX_ATTEMPTS ? 429 : 400).json({
      message: pending.attempts >= OTP_MAX_ATTEMPTS
        ? 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.'
        : 'Mã OTP không chính xác.'
    });
  }

  try {
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password
    });
    await PendingRegistration.deleteOne({ _id: pending._id });
    return res.status(201).json({ token: createToken(user), user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).json({ message: 'Email đã được sử dụng.' });
    }
    throw error;
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
  }
  return res.json({ token: createToken(user), user: safeUser(user) });
}

module.exports = { login, requestRegistrationOtp, verifyRegistrationOtp };