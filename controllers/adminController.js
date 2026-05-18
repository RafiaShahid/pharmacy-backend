const { pool } = require('../config/db');
const crypto = require('crypto');

// Generate a pharmacist verification code
const generatePharmacistCode = async (req, res) => {
  try {
    const code = 'PHARM-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const result = await pool.query(
      'INSERT INTO pharmacist_codes (code, created_by) VALUES ($1, $2) RETURNING *',
      [code, req.user.id]
    );

    res.status(201).json({
      message: 'Pharmacist code generated',
      code: result.rows[0].code,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// View all pharmacist codes
const getAllCodes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pharmacist_codes ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// View all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND role != $2 RETURNING *',
      [req.params.id, 'admin']
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found or cannot delete admin' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { generatePharmacistCode, getAllCodes, getAllUsers, deleteUser };

