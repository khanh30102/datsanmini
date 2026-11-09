const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pitch', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });

reviewSchema.index({ pitchId:  1, createdAt: -1 });
module.exports = mongoose.model('Review', reviewSchema);
