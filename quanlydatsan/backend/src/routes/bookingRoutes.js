const express = require('express');
const {
  createBooking,
  getAllBookings,
  getAvailability,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  requestPayment,
  updatePaymentStatus,
  updateBookingStatus
} = require('../controllers/bookingController');
const { isAdmin, verifyToken } = require('../middleware/auth');

const router = express.Router();
router.get('/availability', getAvailability);
router.post('/', verifyToken, createBooking);
router.get('/my-bookings', verifyToken, getMyBookings);
router.get('/admin/all', verifyToken, isAdmin, getAllBookings);
router.put('/:id/cancel', verifyToken, cancelBooking);
router.put('/:id/reschedule', verifyToken, rescheduleBooking);
router.put('/:id/payment-request', verifyToken, requestPayment);
router.put('/:id/payment-status', verifyToken, isAdmin, updatePaymentStatus);
router.put('/:id/status', verifyToken, isAdmin, updateBookingStatus);

module.exports = router;