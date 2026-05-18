const { pool } = require('../config/db');

// Request a refill
const requestRefill = async (req, res) => {
  const { prescription_id } = req.body;
  try {
    // Check prescription belongs to user and is approved
    const prescription = await pool.query(
      `SELECT * FROM prescriptions WHERE id = $1 AND user_id = $2 AND status = 'approved'`,
      [prescription_id, req.user.id]
    );

    if (prescription.rows.length === 0)
      return res.status(400).json({ message: 'No approved prescription found with this ID' });

    const result = await pool.query(
      'INSERT INTO refill_requests (user_id, prescription_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, prescription_id]
    );

    res.status(201).json({ message: 'Refill requested', refill: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get my refill requests (user)
const getMyRefills = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS reviewed_by_name
       FROM refill_requests r
       LEFT JOIN users u ON r.reviewed_by = u.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all refill requests (pharmacist/admin)
const getAllRefills = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS patient_name
       FROM refill_requests r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Review refill request (pharmacist)
const reviewRefill = async (req, res) => {
  const { status, notes } = req.body;

  if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be approved or rejected' });

  try {
    const result = await pool.query(
      `UPDATE refill_requests
       SET status = $1, notes = $2, reviewed_by = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, notes || null, req.user.id, req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Refill request not found' });

    res.json({ message: `Refill ${status}`, refill: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { requestRefill, getMyRefills, getAllRefills, reviewRefill };