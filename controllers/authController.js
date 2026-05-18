const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
const register = async (req, res) => {
  const { name, email, password, role, pharmacist_code } = req.body;

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Email already registered' });

    // If registering as pharmacist, verify the code
    if (role === 'pharmacist') {
      const codeCheck = await pool.query(
        'SELECT * FROM pharmacist_codes WHERE code = $1 AND is_used = FALSE',
        [pharmacist_code]
      );
      if (codeCheck.rows.length === 0)
        return res.status(400).json({ message: 'Invalid or already used pharmacist code' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role || 'user']
    );

    // Mark pharmacist code as used
    if (role === 'pharmacist') {
      await pool.query(
        'UPDATE pharmacist_codes SET is_used = TRUE, used_by = $1 WHERE code = $2',
        [newUser.rows[0].id, pharmacist_code]
      );
    }

    res.status(201).json({ message: 'Registration successful', user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0)
      return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get profile (protected)
const getProfile = async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getProfile };