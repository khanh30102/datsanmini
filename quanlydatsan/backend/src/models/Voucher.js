const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 3, maxlength: 30 },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  value: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ['percentage', 'fixed', 'offpeak'], required: true },
  active: { type: Boolean, default: true },
  maxUses: { type: Number, min: 1, default: null },
  usedCount: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
