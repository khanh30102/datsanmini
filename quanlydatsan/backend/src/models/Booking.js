const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pitch', required: true },
  bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  totalPrice: { type: Number, required: true, min: 0 },
  depositAmount: { type: Number, required: true, min: 0 },
  voucherCode: { type: String, trim: true, uppercase: true },
  cancellationReason: { type: String, trim: true, maxlength: 500, default: '' },
  paymentStatus: { type: String, enum: ['unpaid', 'payment_requested', 'paid', 'refunded'], default: 'unpaid' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

bookingSchema.index({ pitchId: 1, bookingDate: 1, status: 1 });
module.exports = mongoose.model('Booking', bookingSchema);