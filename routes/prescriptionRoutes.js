const express = require('express');
const router = express.Router();
const {
  upload,
  uploadPrescription,
  getMyPrescriptions,
  getAllPrescriptions,
  reviewPrescription,
  deletePrescription,
} = require('../controllers/prescriptionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/upload', protect, authorizeRoles('user'), upload.single('prescription'), uploadPrescription);
router.get('/mine', protect, authorizeRoles('user'), getMyPrescriptions);
router.get('/', protect, authorizeRoles('pharmacist', 'admin'), getAllPrescriptions);
router.put('/:id/review', protect, authorizeRoles('pharmacist', 'admin'), reviewPrescription);
router.delete('/:id', protect, authorizeRoles('user'), deletePrescription);

module.exports = router;