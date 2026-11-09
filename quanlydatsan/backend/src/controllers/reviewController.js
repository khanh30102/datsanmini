const Booking = require('../models/Booking');
const Review = require('../models/Review');

async function listPitchReviews(req, res) {
  const reviews = await Review.find({ pitchId: req.params.pitchId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  const average = reviews.length
    ? Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length * 10) / 10
    : 0;
  return res.json({ reviews, average, count: reviews.length });
}

async function createReview(req, res) {
  const { bookingId, rating, comment = '' } = req.body;
  if (!bookingId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5
      || typeof comment !== 'string' || comment.length > 1000) {
    return res.status(400).json({ message: 'Nội dung đánh giá không hợp lệ.' });
  }
  const booking = await Booking.findOne({ _id: bookingId, userId: req.user.sub, status: 'confirmed' });
  if (!booking) return res.status(404).json({ message: 'Chỉ có thể đánh giá sân đã đặt và được xác nhận.' });
  const bookingEnd = new Date(`${booking.bookingDate}T${booking.endTime}:00`);
  if (bookingEnd.getTime() > Date.now()) {
    return res.status(400).json({ message: 'Bạn chỉ có thể đánh giá sau khi trận đấu kết thúc.' });
  }
  const existing = await Review.findOne({ bookingId });
  if (existing) return res.status(409).json({ message: 'Đơn đặt sân này đã được đánh giá.' });
  const review = await Review.create({
    bookingId,
    userId: req.user.sub,
    pitchId: booking.pitchId,
    rating: Number(rating),
    comment: comment.trim()
  });
  await review.populate('userId', 'name');
  return res.status(201).json(review);
}

module.exports = { listPitchReviews, createReview };
