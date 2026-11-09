const nodemailer = require('nodemailer');

async function sendBookingConfirmation(booking, user, pitch) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Xác nhận đặt sân bóng',
    text: `Bạn đã đặt ${pitch.name} ngày ${booking.bookingDate}, ${booking.startTime}-${booking.endTime}. Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VND. Tiền cọc mô phỏng 30%: ${booking.depositAmount.toLocaleString('vi-VN')} VND.`
  });
  return true;
}

async function sendBookingUpdate(booking, user, pitch, subject, message) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject,
    text: `${message}\nSân: ${pitch.name}\nLịch: ${booking.bookingDate}, ${booking.startTime}-${booking.endTime}.\nTổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')} VND.`
  });
  return true;
}

async function sendAdminPaymentRequest(booking, user, pitch) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) return false;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'Khách yêu cầu xác nhận tiền cọc',
    text: `${user.name} (${user.email}) báo đã chuyển tiền cọc ${booking.depositAmount.toLocaleString('vi-VN')} VND cho ${pitch.name}, ngày ${booking.bookingDate} ${booking.startTime}-${booking.endTime}. Hãy xác nhận trong trang quản trị.`
  });
  return true;
}

module.exports = { sendBookingConfirmation, sendBookingUpdate, sendAdminPaymentRequest };