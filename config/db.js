const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,   // ← THIS auto creates tables!
  logging: false,
  entities: [
    require('../entities/User'),
    require('../entities/PharmacistCode'),
    require('../entities/Medicine'),
    require('../entities/Prescription'),
    require('../entities/Cart'),
    require('../entities/Order'),
    require('../entities/OrderItem'),
    require('../entities/RefillRequest'),
  ],
});

// Keep pool for existing controllers (raw SQL still works)
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = { AppDataSource, pool };