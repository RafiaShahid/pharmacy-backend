const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a file' });
    const { medicine_id } = req.body;
    const image_url = req.file.filename;
    const result = await pool.query(
      `INSERT INTO prescriptions (user_id, medicine_id, image_url) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, medicine_id || null, image_url]
    );
    res.status(201).json({ message: 'Prescription uploaded successfully', prescription: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyPrescriptions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, m.name AS medicine_name, u.name AS reviewed_by_name
       FROM prescriptions p
       LEFT JOIN medicines m ON p.medicine_id = m.id
       LEFT JOIN users u ON p.reviewed_by = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllPrescriptions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT p.*, m.name AS medicine_name, u.name AS patient_name
      FROM prescriptions p
      LEFT JOIN medicines m ON p.medicine_id = m.id
      LEFT JOIN users u ON p.user_id = u.id
    `;
    const params = [];
    if (status) { params.push(status); query += ` WHERE p.status = $1`; }
    query += ' ORDER BY p.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const reviewPrescription = async (req, res) => {
  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }
  try {
    const result = await pool.query(
      `UPDATE prescriptions SET status = $1, notes = $2, reviewed_by = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, notes || null, req.user.id, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Prescription not found' });

    const prescription = result.rows[0];

    if (status === 'approved' && prescription.medicine_id) {
      const userId = prescription.user_id;
      const cartItems = await pool.query(
        `SELECT c.quantity, m.id AS medicine_id, m.price, m.stock
         FROM cart c JOIN medicines m ON c.medicine_id = m.id
         WHERE c.user_id = $1 AND c.medicine_id = $2`,
        [userId, prescription.medicine_id]
      );
      if (cartItems.rows.length > 0) {
        const item = cartItems.rows[0];
        if (item.stock >= item.quantity) {
          const total = parseFloat(item.price) * item.quantity;
          const order = await pool.query(
            'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
            [userId, total.toFixed(2)]
          );
          await pool.query(
            'INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [order.rows[0].id, item.medicine_id, item.quantity, item.price]
          );
          await pool.query('UPDATE medicines SET stock = stock - $1 WHERE id = $2', [item.quantity, item.medicine_id]);
          await pool.query('DELETE FROM cart WHERE user_id = $1 AND medicine_id = $2', [userId, prescription.medicine_id]);
          return res.json({
            message: 'Prescription approved and order automatically placed',
            prescription,
            order: order.rows[0],
            autoOrdered: true,
          });
        }
      }
    }

    res.json({ message: `Prescription ${status}`, prescription, autoOrdered: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete prescription — only owner can delete, and only if still pending
const deletePrescription = async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT * FROM prescriptions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (check.rows.length === 0)
      return res.status(404).json({ message: 'Prescription not found' });

    if (check.rows[0].status === 'approved')
      return res.status(400).json({ message: 'Cannot delete an approved prescription' });

    await pool.query('DELETE FROM prescriptions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  upload,
  uploadPrescription,
  getMyPrescriptions,
  getAllPrescriptions,
  reviewPrescription,
  deletePrescription,
};