const express = require('express');
const { createReview, listPitchReviews } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.get('/pitch/:pitchId', listPitchReviews);
router.post('/', verifyToken, createReview);

module.exports = router;
