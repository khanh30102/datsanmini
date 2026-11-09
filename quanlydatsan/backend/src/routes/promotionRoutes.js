const express = require('express');
const {
  createPromotion,
  listAllPromotions,
  listPromotions,
  updatePromotion
} = require('../controllers/promotionController');
const { isAdmin, verifyToken } = require('../middleware/auth');

const router = express.Router();
router.get('/', listPromotions);
router.get('/admin/all', verifyToken, isAdmin, listAllPromotions);
router.post('/', verifyToken, isAdmin, createPromotion);
router.put('/:id', verifyToken, isAdmin, updatePromotion);

module.exports = router;
