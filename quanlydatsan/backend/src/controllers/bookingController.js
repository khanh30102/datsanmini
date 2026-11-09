const Booking = require('../models/Booking');
const Pitch = require('../models/Pitch');
const User = require('../models/User');
const Voucher = require('../models/Voucher');
const Promotion = require('../models/Promotion');
const Review = require('../models/Review');
const { sendAdminPaymentRequest, sendBookingConfirmation, sendBookingUpdate } = require('../utils/email');

const PAYMENT_DEPOSIT_RATE = 0.3;
const CANCELLATION_CUTOFF_HOURS = 12;

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

function todayLocal() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getBookingStart(booking) {
  return new Date(`${booking.bookingDate}T${booking.startTime}:00`);
}

function canChangeBooking(booking) {
  return getBookingStart(booking).getTime() - Date.now() >= CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
}

function isValidTimeRange(bookingDate, startTime, endTime) {
  return isValidDate(bookingDate) && bookingDate >= todayLocal()
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || '')
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(endTime || '')
    && toMinutes(endTime) > toMinutes(startTime)
    && toMinutes(startTime) >= 6 * 60
    && toMinutes(endTime) <= 22 * 60
    && !(bookingDate === todayLocal() && toMinutes(startTime) <= new Date().getHours() * 60 + new Date().getMinutes());
}

function overlaps(startTime, endTime, booking) {
  return toMinutes(startTime) < toMinutes(booking.endTime)
    && toMinutes(endTime) > toMinutes(booking.startTime);
}

function priceMultiplier(bookingDate, startTime) {
  const day = new Date(`${bookingDate}T12:00:00`).getDay();
  const hour = Number(startTime.slice(0, 2));
  let multiplier = day === 0 || day === 6 ? 1.2 : 1;
  if (hour >= 17 && hour < 22) multiplier += 0.15;
  if (hour >= 6 && hour < 9) multiplier -= 0.1;
  return Number(multiplier.toFixed(2));
}

async function calculateTotal(pitch, bookingDate, startTime, endTime, voucherCode, allowInactiveVoucher = false) {
  const durationHours = (toMinutes(endTime) - toMinutes(startTime)) / 60;
  const baseTotal = Math.round(pitch.pricePerHour * durationHours * priceMultiplier(bookingDate, startTime));
  const promotion = await Promotion.findOne({
    active: true,
    startDate: { $lte: bookingDate },
    endDate: { $gte: bookingDate }
  }).sort({ value: -1 });
  const promotionDiscount = promotion ? Math.round(baseTotal * promotion.value / 100) : 0;
  if (!voucherCode) return Math.max(0, baseTotal - promotionDiscount);

  const query = { code: voucherCode.trim().toUpperCase() };
  if (!allowInactiveVoucher) query.active = true;
  const voucher = await Voucher.findOne(query);
  if (!voucher) {
    const error = new Error('Mã khuyến mãi không hợp lệ hoặc đã hết hiệu lực.');
    error.status = 400;
    throw error;
  }

  if (voucher.type === 'offpeak') {
    const hour = Number(startTime.slice(0, 2));
    if (!(hour >= 9 && hour < 17)) {
      const error = new Error('Mã khuyến mãi này không áp dụng cho khung giờ đã chọn.');
      error.status = 400;
      throw error;
    }
  }
  const discount = voucher.type === 'fixed'
    ? Math.min(baseTotal, voucher.value)
    : Math.round(baseTotal * voucher.value / 100);
  return Math.max(0, baseTotal - Math.max(discount, promotionDiscount));
}

async function notifyBooking(booking, subject, message) {
  const [user, pitch] = await Promise.all([
    User.findById(booking.userId),
    Pitch.findById(booking.pitchId)
  ]);
  if (!user || !pitch) return;
  try {
    await sendBookingUpdate(booking, user, pitch, subject, message);
  } catch (error) {
    console.error('Không gửi được email cập nhật đặt sân:', error.message);
  }
}

async function getAvailability(req, res) {
  const { pitchId, date } = req.query;
  if (!pitchId || !isValidDate(date)) {
    return res.status(400).json({ message: 'Cần cung cấp pitchId và ngày hợp lệ.' });
  }
  const bookings = await Booking.find({
    pitchId,
    bookingDate: date,
    status: { $in: ['pending', 'confirmed'] }
  }).select('startTime endTime status');
  return res.json(bookings);
}

async function createBooking(req, res) {
  const { pitchId, bookingDate, startTime, endTime, voucherCode } = req.body;
  if (!pitchId || !isValidTimeRange(bookingDate, startTime, endTime)) {
    return res.status(400).json({ message: 'Thông tin ngày hoặc khung giờ không hợp lệ.' });
  }

  const pitch = await Pitch.findOne({ _id: pitchId, status: 'active' });
  if (!pitch) return res.status(404).json({ message: 'Không tìm thấy sân đang hoạt động.' });

  const conflicts = await Booking.find({
    pitchId,
    bookingDate,
    status: { $in: ['pending', 'confirmed'] }
  }).select('startTime endTime');
  if (conflicts.some((booking) => overlaps(startTime, endTime, booking))) {
    return res.status(409).json({ message: 'Khung giờ này vừa được đặt. Vui lòng chọn giờ khác.' });
  }

  const totalPrice = await calculateTotal(pitch, bookingDate, startTime, endTime, voucherCode);
  let reservedVoucher = null;
  if (voucherCode) {
    reservedVoucher = await Voucher.findOneAndUpdate({
      code: voucherCode.trim().toUpperCase(),
      active: true,
      $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }]
    }, { $inc: { usedCount: 1 } }, { new: true });
    if (!reservedVoucher) {
      return res.status(400).json({ message: 'Voucher đã hết lượt sử dụng hoặc không còn hiệu lực.' });
    }
  }

  let booking;
  try {
    booking = await Booking.create({
      userId: req.user.sub,
      pitchId,
      bookingDate,
      startTime,
      endTime,
      totalPrice,
      depositAmount: Math.ceil(totalPrice * PAYMENT_DEPOSIT_RATE),
      voucherCode: voucherCode?.trim().toUpperCase()
    });
  } catch (error) {
    if (reservedVoucher) {
      try {
        await Voucher.updateOne({ _id: reservedVoucher._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
      } catch (rollbackError) {
        console.error('Không thể hoàn lại lượt sử dụng voucher sau khi tạo đơn thất bại:', rollbackError.message);
      }
    }
    throw error;
  }

  const user = await User.findById(req.user.sub);
  let emailSent = false;
  try {
    emailSent = await sendBookingConfirmation(booking, user, pitch);
  } catch (error) {
    console.error('Không gửi được email xác nhận:', error.message);
  }
  return res.status(201).json({ booking, emailSent, message: 'Đặt sân thành công.' });
}

async function getMyBookings(req, res) {
  const bookings = await Booking.find({ userId: req.user.sub })
    .populate('pitchId', 'name type images location pricePerHour')
    .sort({ bookingDate: -1, startTime: -1 })
    .lean();
  const reviewedIds = await Review.distinct('bookingId', { userId: req.user.sub });
  const reviewed = new Set(reviewedIds.map(String));
  return res.json(bookings.map((booking) => ({
    ...booking,
    reviewSubmitted: reviewed.has(String(booking._id))
  })));
}

async function getAllBookings(_req, res) {
  const bookings = await Booking.find()
    .populate('userId', 'name email phone')
    .populate('pitchId', 'name type location')
    .sort({ bookingDate: -1, startTime: -1 });
  return res.json(bookings);
}

async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân.' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Đơn đặt sân đã được hủy.' });
  if (!canChangeBooking(booking)) {
    return res.status(400).json({ message: 'Chỉ có thể hủy trước giờ đá ít nhất 12 tiếng.' });
  }
  booking.status = 'cancelled';
  booking.cancellationReason = 'Khách hàng chủ động hủy đơn.';
  if (booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  await booking.save();
  await notifyBooking(booking, 'Lịch đặt sân đã được hủy', 'Lịch đặt sân của bạn đã được hủy. Tiền cọc (nếu có) được ghi nhận hoàn lại.');
  return res.json({ booking, message: 'Đã hủy lịch đặt sân.' });
}

async function rescheduleBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân.' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Không thể đổi lịch đã hủy.' });
  if (!canChangeBooking(booking)) {
    return res.status(400).json({ message: 'Chỉ có thể đổi lịch trước giờ đá ít nhất 12 tiếng.' });
  }

  const { bookingDate, startTime, endTime } = req.body;
  if (!isValidTimeRange(bookingDate, startTime, endTime)) {
    return res.status(400).json({ message: 'Thông tin ngày hoặc khung giờ mới không hợp lệ.' });
  }
  const pitch = await Pitch.findById(booking.pitchId);
  if (!pitch || pitch.status !== 'active') return res.status(404).json({ message: 'Không tìm thấy sân đang hoạt động.' });
  const conflicts = await Booking.find({
    _id: { $ne: booking._id },
    pitchId: booking.pitchId,
    bookingDate,
    status: { $in: ['pending', 'confirmed'] }
  }).select('startTime endTime');
  if (conflicts.some((item) => overlaps(startTime, endTime, item))) {
    return res.status(409).json({ message: 'Khung giờ mới đã có người đặt. Vui lòng chọn giờ khác.' });
  }

  booking.bookingDate = bookingDate;
  booking.startTime = startTime;
  booking.endTime = endTime;
  booking.totalPrice = await calculateTotal(pitch, bookingDate, startTime, endTime, booking.voucherCode, true);
  booking.depositAmount = Math.ceil(booking.totalPrice * PAYMENT_DEPOSIT_RATE);
  booking.status = 'pending';
  booking.paymentStatus = booking.paymentStatus === 'paid' ? 'refunded' : 'unpaid';
  await booking.save();
  await notifyBooking(booking, 'Lịch đặt sân đã được đổi', 'Lịch mới đang chờ sân xác nhận. Tiền cọc cũ (nếu đã nhận) được ghi nhận hoàn lại; vui lòng đặt cọc theo thông tin cập nhật.');
  return res.json({ booking, message: 'Đã đổi lịch. Đơn đặt mới đang chờ sân xác nhận.' });
}

async function requestPayment(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn đặt sân.' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Đơn đặt sân đã bị hủy.' });
  if (!['unpaid', 'refunded'].includes(booking.paymentStatus)) {
    return res.status(400).json({ message: 'Yêu cầu đặt cọc đã được gửi hoặc xử lý.' });
  }
  booking.paymentStatus = 'payment_requested';
  await booking.save();
  const [user, pitch] = await Promise.all([User.findById(booking.userId), Pitch.findById(booking.pitchId)]);
  if (user && pitch) {
    try {
      await sendAdminPaymentRequest(booking, user, pitch);
    } catch (error) {
      console.error('Không gửi được email yêu cầu xác nhận cọc:', error.message);
    }
  }
  return res.json({ booking, message: 'Đã gửi yêu cầu xác nhận tiền cọc.' });
}

async function updatePaymentStatus(req, res) {
  const { paymentStatus } = req.body;
  if (paymentStatus !== 'paid') {
    return res.status(400).json({ message: 'Trạng thái thanh toán không hợp lệ.' });
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking.' });
  if (booking.paymentStatus !== 'payment_requested') {
    return res.status(400).json({ message: 'Khách chưa gửi yêu cầu xác nhận tiền cọc.' });
  }
  booking.paymentStatus = paymentStatus;
  await booking.save();
  await notifyBooking(booking, 'Đã xác nhận tiền cọc', 'Sân đã xác nhận tiền cọc của bạn.');
  return res.json(booking);
}

async function updateBookingStatus(req, res) {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái booking không hợp lệ.' });
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking.' });
  let cancellationReason = '';
  if (status === 'cancelled') {
    cancellationReason = typeof req.body.cancellationReason === 'string' ? req.body.cancellationReason.trim() : '';
    if (!cancellationReason) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do hủy đơn.' });
    }
    if (cancellationReason.length > 500) {
      return res.status(400).json({ message: 'Lý do hủy không được vượt quá 500 ký tự.' });
    }
  }
  if (status === 'confirmed' && booking.status !== 'confirmed') {
    const conflicts = await Booking.find({
      _id: { $ne: booking._id },
      pitchId: booking.pitchId,
      bookingDate: booking.bookingDate,
      status: { $in: ['pending', 'confirmed'] }
    }).select('startTime endTime');
    if (conflicts.some((item) => overlaps(booking.startTime, booking.endTime, item))) {
      return res.status(409).json({ message: 'Không thể khôi phục đơn vì khung giờ này đã có đơn khác chiếm lịch.' });
    }
  }
  booking.status = status;
  booking.cancellationReason = status === 'cancelled' ? cancellationReason : '';
  if (status === 'cancelled' && booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  await booking.save();
  const message = status === 'confirmed' ? 'Sân đã xác nhận lịch đặt của bạn.'
    : status === 'cancelled' ? `Lịch đặt sân của bạn đã bị hủy. Lý do: ${cancellationReason}` : 'Lịch đặt sân của bạn đang chờ xác nhận.';
  await notifyBooking(booking, 'Cập nhật trạng thái đặt sân', message);
  return res.json(booking);
}

module.exports = {
  getAvailability, createBooking, getMyBookings, getAllBookings, updateBookingStatus,
  cancelBooking, rescheduleBooking, requestPayment, updatePaymentStatus, priceMultiplier
};
