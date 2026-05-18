const express = require('express');
const router = express.Router();
const { placeOrder, placeSingleOrder, getMyOrders, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, authorizeRoles('user'), placeOrder);
router.post('/single', protect, authorizeRoles('user'), placeSingleOrder);
router.get('/mine', protect, authorizeRoles('user'), getMyOrders);
router.get('/', protect, authorizeRoles('admin', 'pharmacist'), getAllOrders);
router.put('/:id/status', protect, authorizeRoles('admin', 'pharmacist'), updateOrderStatus);

module.exports = router;