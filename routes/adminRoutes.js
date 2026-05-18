const express = require('express');
const router = express.Router();
const { generatePharmacistCode, getAllCodes, getAllUsers, deleteUser } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Only admin can access these
router.post('/generate-code', protect, authorizeRoles('admin'), generatePharmacistCode);
router.get('/codes', protect, authorizeRoles('admin'), getAllCodes);
router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;