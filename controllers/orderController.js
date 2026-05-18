const { pool } = require('../config/db');

// Place order from cart (all items — legacy, kept for compatibility)
const placeOrder = async (req, res) => {
  try {
    const cartItems = await pool.query(
      `SELECT c.quantity, m.id AS medicine_id, m.price, m.stock, m.requires_prescription
       FROM cart c JOIN medicines m ON c.medicine_id = m.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartItems.rows.length === 0)
      return res.status(400).json({ message: 'Your cart is empty' });

    for (const item of cartItems.rows) {
      if (item.stock < item.quantity)
        return res.status(400).json({ message: 'Not enough stock for a medicine' });

      if (item.requires_prescription) {
        const approved = await pool.query(
          `SELECT * FROM prescriptions WHERE user_id = $1 AND medicine_id = $2 AND status = 'approved'`,
          [req.user.id, item.medicine_id]
        );
        if (approved.rows.length === 0)
          return res.status(400).json({ message: 'Approved prescription required for one or more medicines' });
      }
    }

    const total = cartItems.rows.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
    );

    const order = await pool.query(
      'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
      [req.user.id, total.toFixed(2)]
    );

    for (const item of cartItems.rows) {
      await pool.query(
        'INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.rows[0].id, item.medicine_id, item.quantity, item.price]
      );
      await pool.query(
        'UPDATE medicines SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.medicine_id]
      );
    }

    await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);

    res.status(201).json({ message: 'Order placed successfully', order: order.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Place order for a single cart item — used by per-item Place Order button
const placeSingleOrder = async (req, res) => {
  const { medicine_id, quantity } = req.body;
  try {
    const medResult = await pool.query(
      'SELECT * FROM medicines WHERE id = $1',
      [medicine_id]
    );
    if (medResult.rows.length === 0)
      return res.status(404).json({ message: 'Medicine not found' });

    const medicine = medResult.rows[0];

    if (medicine.stock < quantity)
      return res.status(400).json({ message: 'Insufficient stock' });

    // Block if prescription required but not approved
    if (medicine.requires_prescription) {
      const approved = await pool.query(
        `SELECT * FROM prescriptions WHERE user_id = $1 AND medicine_id = $2 AND status = 'approved'`,
        [req.user.id, medicine_id]
      );
      if (approved.rows.length === 0)
        return res.status(400).json({ message: 'An approved prescription is required for this medicine' });
    }

    const total = parseFloat(medicine.price) * quantity;

    const order = await pool.query(
      'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
      [req.user.id, total.toFixed(2)]
    );

    await pool.query(
      'INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES ($1, $2, $3, $4)',
      [order.rows[0].id, medicine_id, quantity, medicine.price]
    );

    await pool.query(
      'UPDATE medicines SET stock = stock - $1 WHERE id = $2',
      [quantity, medicine_id]
    );

    // Remove only this item from cart
    await pool.query(
      'DELETE FROM cart WHERE user_id = $1 AND medicine_id = $2',
      [req.user.id, medicine_id]
    );

    res.status(201).json({ message: 'Order placed successfully', order: order.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const order of orders.rows) {
      const items = await pool.query(
        `SELECT oi.*, m.name FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = items.rows;
    }
    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, u.name AS customer_name
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { placeOrder, placeSingleOrder, getMyOrders, getAllOrders, updateOrderStatus };