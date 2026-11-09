const express = require('express');
const { listAccounts, updateAccountRole } = require('../controllers/userController');
const { isAdmin, verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/users', verifyToken, isAdmin, listAccounts);
router.patch('/users/:id/role', verifyToken, isAdmin, updateAccountRole);

router.get('/status', verifyToken, isAdmin, (_req, res) => {
  return res.json({
    customerEmailEnabled: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    adminPaymentEmailEnabled: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL)
  });
});

module.exports = router;
