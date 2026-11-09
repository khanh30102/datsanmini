const mongoose = require('mongoose');

const pitchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, required: true, trim: true },
  pricePerHour: { type: Number, required: true, min: 0 },
  images: [{ type: String, trim: true }],
  description: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Pitch', pitchSchema);