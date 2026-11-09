const Pitch = require('../models/Pitch');

async function listPitches(req, res) {
  const query = req.user?.role === 'admin' && req.query.all === 'true' ? {} : { status: 'active' };
  const pitches = await Pitch.find(query).sort({ createdAt: -1 });
  return res.json(pitches);
}

async function listAllPitches(_req, res) {
  const pitches = await Pitch.find().sort({ createdAt: -1 });
  return res.json(pitches);
}

async function getPitch(req, res) {
  const pitch = await Pitch.findOne({ _id: req.params.id, status: 'active' });
  if (!pitch) return res.status(404).json({ message: 'Không tìm thấy sân.' });
  return res.json(pitch);
}

async function createPitch(req, res) {
  const pitch = await Pitch.create(req.body);
  return res.status(201).json(pitch);
}

async function updatePitch(req, res) {
  const pitch = await Pitch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!pitch) return res.status(404).json({ message: 'Không tìm thấy sân.' });
  return res.json(pitch);
}

async function deletePitch(req, res) {
  const pitch = await Pitch.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  if (!pitch) return res.status(404).json({ message: 'Không tìm thấy sân.' });
  return res.json({ message: 'Đã ngừng kinh doanh sân.', pitch });
}

module.exports = { listPitches, listAllPitches, getPitch, createPitch, updatePitch, deletePitch };