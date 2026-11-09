const Voucher = require('../models/Voucher');

async function listVouchers(req, res) {
  return res.json(await Voucher.find({
    active: true,
    $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }]
  }).sort({ createdAt: -1 }));
}

async function listAllVouchers(_req, res) {
  return res.json(await Voucher.find().sort({ createdAt: -1 }));
}

async function createVoucher(req, res) {
  const { code, description, value, type, active, maxUses } = req.body;
  if (!code || !description || !['percentage', 'fixed', 'offpeak'].includes(type)
      || !Number.isFinite(Number(value)) || Number(value) < 1
      || (type === 'percentage' && Number(value) > 100)
      || (maxUses !== undefined && maxUses !== null
        && (!Number.isInteger(Number(maxUses)) || Number(maxUses) < 1))) {
    return res.status(400).json({ message: 'Thông tin voucher không hợp lệ.' });
  }
  const voucher = await Voucher.create({
    code,
    description,
    value,
    type,
    active,
    maxUses: maxUses === undefined || maxUses === null || maxUses === '' ? null : Number(maxUses)
  });
  return res.status(201).json(voucher);
}

async function updateVoucher(req, res) {
  const update = {};
  if (typeof req.body.active === 'boolean') update.active = req.body.active;
  if (!Object.keys(update).length) return res.status(400).json({ message: 'Không có thay đổi hợp lệ.' });
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher.' });
  return res.json(voucher);
}

module.exports = { listVouchers, listAllVouchers, createVoucher, updateVoucher };
