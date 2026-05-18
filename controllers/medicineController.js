const { pool } = require('../config/db');

// Get all medicines (public)
const getAllMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM medicines WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single medicine
const getMedicineById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Medicine not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add medicine (pharmacist/admin only)
const addMedicine = async (req, res) => {
  const { name, description, price, stock, category, requires_prescription } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO medicines (name, description, price, stock, category, requires_prescription)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, stock, category, requires_prescription || false]
    );
    res.status(201).json({ message: 'Medicine added', medicine: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update medicine (pharmacist/admin only)
const updateMedicine = async (req, res) => {
  const { name, description, price, stock, category, requires_prescription } = req.body;
  try {
    const result = await pool.query(
      `UPDATE medicines SET name=$1, description=$2, price=$3, stock=$4,
       category=$5, requires_prescription=$6 WHERE id=$7 RETURNING *`,
      [name, description, price, stock, category, requires_prescription, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Medicine not found' });
    res.json({ message: 'Medicine updated', medicine: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete medicine (admin only)
const deleteMedicine = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM medicines WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Medicine not found' });
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAllMedicines, getMedicineById, addMedicine, updateMedicine, deleteMedicine };