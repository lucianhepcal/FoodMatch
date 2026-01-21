// index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurare conexiune baza de date
const pool = new Pool({
  user: 'postgres',        // userul tau de postgres
  host: 'localhost',
  database: 'foodmatch',   // numele bazei tale de date
  password: 'admin',   // parola ta
  port: 5432,
});

// --- RUTE API ---

// 1. Get All Recipes (Simplu)
// Frontend-ul va face filtrarea (match percentage) exact cum facea inainte
app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, time, difficulty, image, ingredients, steps FROM recipes');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});