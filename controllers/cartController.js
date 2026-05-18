const { pool } = require('../config/db');

const addToCart = async (req, res) => {
  const { medicine_id, quantity } = req.body;
  try {
    const existing = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND medicine_id = $2',
      [req.user.id, medicine_id]
    );
    if (existing.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND medicine_id = $3 RETURNING *',
        [quantity || 1, req.user.id, medicine_id]
      );
      return res.json({ message: 'Cart updated', item: updated.rows[0] });
    }
    const result = await pool.query(
      'INSERT INTO cart (user_id, medicine_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, medicine_id, quantity || 1]
    );
    res.status(201).json({ message: 'Added to cart', item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getCart = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.quantity, m.id AS medicine_id, m.name, m.price, m.requires_prescription,
       (c.quantity * m.price) AS subtotal
       FROM cart c
       JOIN medicines m ON c.medicine_id = m.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    const total = result.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    res.json({ items: result.rows, total: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { addToCart, getCart, removeFromCart, clearCart };