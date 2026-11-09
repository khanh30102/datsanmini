const express = require('express');
const { createPitch, deletePitch, getPitch, listAllPitches, listPitches, updatePitch } = require('../controllers/pitchController');
const { isAdmin, verifyToken } = require('../middleware/auth');
const uploadPitchImages = require('../middleware/pitchImageUpload');

const router = express.Router();
router.get('/', listPitches);
router.get('/admin/all', verifyToken, isAdmin, listAllPitches);
router.post('/upload', verifyToken, isAdmin, uploadPitchImages, (req, res) => {
	const images = (req.files || []).map((file) => `${req.protocol}://${req.get('host')}/uploads/pitches/${file.filename}`);
	return res.json({ images });
});
router.get('/:id', getPitch);
router.post('/', verifyToken, isAdmin, createPitch);
router.put('/:id', verifyToken, isAdmin, updatePitch);
router.delete('/:id', verifyToken, isAdmin, deletePitch);

module.exports = router;