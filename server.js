const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('reflect-metadata');

const { AppDataSource } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const adminRoutes = require('./routes/adminRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const refillRoutes = require('./routes/refillRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/refills', refillRoutes);

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected & tables created automatically!');

    // Auto create admin if not exists
    const { pool } = require('./config/db');
    const adminExists = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@pharmacy.com'"
    );
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ['Admin', 'admin@pharmacy.com', hash, 'admin']
      );
      console.log(' Admin user created automatically!');
    }

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });