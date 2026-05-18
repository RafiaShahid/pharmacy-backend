const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, authorizeRoles('user'), addToCart);
router.get('/', protect, authorizeRoles('user'), getCart);
router.delete('/:id', protect, authorizeRoles('user'), removeFromCart);
router.delete('/', protect, authorizeRoles('user'), clearCart);

module.exports = router;