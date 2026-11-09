const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  attempts: { type: Number, default: 0, min: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
