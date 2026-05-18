const express = require('express');
const router = express.Router();
const { requestRefill, getMyRefills, getAllRefills, reviewRefill } = require('../controllers/refillController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, authorizeRoles('user'), requestRefill);
router.get('/mine', protect, authorizeRoles('user'), getMyRefills);
router.get('/', protect, authorizeRoles('pharmacist', 'admin'), getAllRefills);
router.put('/:id/review', protect, authorizeRoles('pharmacist', 'admin'), reviewRefill);

module.exports = router;