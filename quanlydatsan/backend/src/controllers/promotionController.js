const Promotion = require('../models/Promotion');

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

async function listPromotions(req, res) {
  const query = { active: true };
  if (req.query.date) {
    const date = req.query.date;
    if (!isValidDate(date)) {
      return res.status(400).json({ message: 'Ngày chương trình không hợp lệ.' });
    }
    query.startDate = { $lte: date };
    query.endDate = { $gte: date };
  }
  return res.json(await Promotion.find(query).sort({ value: -1, startDate: 1 }));
}

async function listAllPromotions(_req, res) {
  return res.json(await Promotion.find().sort({ createdAt: -1 }));
}

async function createPromotion(req, res) {
  const { name, value, startDate, endDate, active } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120
      || !Number.isFinite(Number(value)) || Number(value) < 1 || Number(value) > 100
      || !isValidDate(startDate) || !isValidDate(endDate) || endDate < startDate) {
    return res.status(400).json({ message: 'Thông tin chương trình khuyến mãi không hợp lệ.' });
  }
  const promotion = await Promotion.create({
    name: name.trim(),
    value: Number(value),
    startDate,
    endDate,
    active: typeof active === 'boolean' ? active : true
  });
  return res.status(201).json(promotion);
}

async function updatePromotion(req, res) {
  if (typeof req.body.active !== 'boolean') {
    return res.status(400).json({ message: 'Trạng thái chương trình không hợp lệ.' });
  }
  const promotion = await Promotion.findByIdAndUpdate(
    req.params.id,
    { active: req.body.active },
    { new: true, runValidators: true }
  );
  if (!promotion) return res.status(404).json({ message: 'Không tìm thấy chương trình khuyến mãi.' });
  return res.json(promotion);
}

module.exports = { listPromotions, listAllPromotions, createPromotion, updatePromotion };
