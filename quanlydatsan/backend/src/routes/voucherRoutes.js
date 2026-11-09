const express = require('express');
const { createVoucher, listAllVouchers, listVouchers, updateVoucher } = require('../controllers/voucherController');
const { isAdmin, verifyToken } = require('../middleware/auth');

const router = express.Router();
router.get('/', listVouchers);
router.get('/admin/all', verifyToken, isAdmin, listAllVouchers);
router.post('/', verifyToken, isAdmin, createVoucher);
router.put('/:id', verifyToken, isAdmin, updateVoucher);

module.exports = router;
