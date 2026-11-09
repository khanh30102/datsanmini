const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  value: { type: Number, required: true, min: 1, max: 100 },
  startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  active: { type: Boolean, default: true }
}, { timestamps: true });

promotionSchema.index({ active: 1, startDate: 1, endDate: 1 });
module.exports = mongoose.model('Promotion', promotionSchema);
