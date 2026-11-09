const express = require('express');
const { login, requestRegistrationOtp, verifyRegistrationOtp } = require('../controllers/authController');

const router = express.Router();
router.post('/register/request-otp', requestRegistrationOtp);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/login', login);

module.exports = router;