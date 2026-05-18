const express = require('express');
const router = express.Router();
const {
  getAllMedicines, getMedicineById, addMedicine, updateMedicine, deleteMedicine
} = require('../controllers/medicineController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', getAllMedicines);                                              // public
router.get('/:id', getMedicineById);                                          // public
router.post('/', protect, authorizeRoles('pharmacist', 'admin'), addMedicine);       // pharmacist/admin
router.put('/:id', protect, authorizeRoles('pharmacist', 'admin'), updateMedicine);  // pharmacist/admin
router.delete('/:id', protect, authorizeRoles('admin'), deleteMedicine);             // admin only

module.exports = router;