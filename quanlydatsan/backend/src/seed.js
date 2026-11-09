require('dotenv').config();

const mongoose = require('mongoose');
const Pitch = require('./models/Pitch');

const samplePitches = [
  {
    name: 'Sân Vườn Cầu Giấy',
    type: 'Sân 7',
    pricePerHour: 650000,
    location: 'Cầu Giấy, Hà Nội',
    description: 'Mặt cỏ nhân tạo mới, đèn thi đấu sáng đều và khu vực gửi xe rộng rãi.',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Phố Bóng Mỹ Đình',
    type: 'Sân 5',
    pricePerHour: 420000,
    location: 'Nam Từ Liêm, Hà Nội',
    description: 'Sân 5 người gọn gàng, phù hợp những trận đấu nhanh sau giờ làm.',
    images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Thành Công Riverside',
    type: 'Sân 7',
    pricePerHour: 700000,
    location: 'Ba Đình, Hà Nội',
    description: 'Không gian thoáng, cỏ êm và đầy đủ phòng thay đồ cho cả đội.',
    images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1000&q=85']
  }
];

const additionalSamplePitches = [
  {
    name: 'Sân Phủi Tây Hồ',
    type: 'Sân 7',
    pricePerHour: 680000,
    location: 'Tây Hồ, Hà Nội',
    description: 'Sân cỏ nhân tạo thoáng mát, hệ thống chiếu sáng phù hợp cho các trận đấu buổi tối.',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Cầu Diễn Arena',
    type: 'Sân 5',
    pricePerHour: 450000,
    location: 'Nam Từ Liêm, Hà Nội',
    description: 'Sân 5 nhỏ gọn với mặt cỏ êm, thích hợp cho những trận đấu tốc độ.',
    images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Hoàng Mai Sport',
    type: 'Sân 7',
    pricePerHour: 620000,
    location: 'Hoàng Mai, Hà Nội',
    description: 'Khu sân rộng rãi, có khu vực nghỉ và gửi xe thuận tiện cho các đội bóng.',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Long Biên Green',
    type: 'Sân 11',
    pricePerHour: 1100000,
    location: 'Long Biên, Hà Nội',
    description: 'Sân 11 tiêu chuẩn với không gian rộng, phù hợp cho các trận giao hữu đông người.',
    images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Đống Đa Mini',
    type: 'Sân 5',
    pricePerHour: 400000,
    location: 'Đống Đa, Hà Nội',
    description: 'Sân bóng tiện di chuyển trong nội thành, phù hợp đặt nhanh sau giờ làm.',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Gia Lâm United',
    type: 'Sân 7',
    pricePerHour: 550000,
    location: 'Gia Lâm, Hà Nội',
    description: 'Mặt sân sạch, cỏ đều và có đầy đủ đèn cho lịch đá buổi tối.',
    images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1000&q=85']
  },
  {
    name: 'Sân Hà Đông Stadium',
    type: 'Sân 11',
    pricePerHour: 950000,
    location: 'Hà Đông, Hà Nội',
    description: 'Sân 11 rộng rãi, phù hợp tổ chức thi đấu và giao lưu giữa các đội.',
    images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=85']
  }
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI trong file .env.');
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await Pitch.countDocuments();
  if (!count) {
    await Pitch.insertMany(samplePitches);
  }

  const sampleNames = additionalSamplePitches.map((pitch) => pitch.name);
  const existing = await Pitch.find({ name: { $in: sampleNames } }).select('name').lean();
  const existingNames = new Set(existing.map((pitch) => pitch.name));
  const missing = additionalSamplePitches.filter((pitch) => !existingNames.has(pitch.name));
  if (missing.length) await Pitch.insertMany(missing);
  console.log(`Đã bổ sung ${missing.length} sân mẫu; hiện có ${await Pitch.countDocuments()} sân trong database.`);
}

seed().catch((error) => {
  console.error('Không thể thêm sân mẫu:', error.message);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});