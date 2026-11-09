require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const path = require('path');
const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const pitchRoutes = require('./src/routes/pitchRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const voucherRoutes = require('./src/routes/voucherRoutes');
const promotionRoutes = require('./src/routes/promotionRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/pitches', pitchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use((_req, res) => res.status(404).json({ message: 'Không tìm thấy API.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Lỗi máy chủ.' });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu MONGODB_URI trong file .env.');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('Thiếu JWT_SECRET trong file .env.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  await Booking.updateMany(
    { $or: [{ depositAmount: { $exists: false } }, { paymentStatus: { $exists: false } }] },
    [{
      $set: {
        depositAmount: { $ifNull: ['$depositAmount', { $ceil: { $multiply: [{ $ifNull: ['$totalPrice', 0] }, 0.3] } }] },
        paymentStatus: { $ifNull: ['$paymentStatus', { $literal: 'unpaid' }] }
      }
    }]
  );
  app.listen(port, () => console.log(`API đang chạy tại http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Không thể khởi động API:', error.message);
    process.exit(1);
  });
}

module.exports = app;