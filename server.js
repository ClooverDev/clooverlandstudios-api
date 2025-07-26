const express = require('express');
const app = express();
const port = process.env.PORT || 1306;

const cors = require('cors');
app.use(cors()); // This enables CORS for all routes

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.qmnursauhkzeqcxelcur:flcloverapi-26072025-clooverlandstudios@aws-0-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// Check the connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the database');
    }
});

// Create table if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        data TEXT
    );
`, (err, res) => {
    if (err) {
        return console.error('Error creating table:', err.message);
    }
    console.log('Table "posts" is ready');
});

// API endpoint
app.get("/", (req, res) => {
    res.send("This is an API service that I made to use in my websites or in my games.");
});

// POST request to save data
app.post('/save/:id', async (req, res) => {
    const { id } = req.params;
    const jsonData = JSON.stringify(req.body);

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid body. Please send valid JSON data.' });
    }

    try {
        await pool.query(
            `INSERT INTO posts (id, data)
            VALUES ($1, $2)
            ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data`,
            [id, jsonData]
        );
        res.status(200).json({ message: `Data saved for ID ${id}.`, saved: req.body });
    } catch (err) {
        res.status(500).json({ error: 'Error saving data to the database.', details: err.message });
    }
});

// GET request to retrieve data
app.get('/get/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT data FROM posts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `No data found for ID ${id}.` });
        }

        const data = JSON.parse(result.rows[0].data);
        res.status(200).json({ id, data });
    } catch (err) {
        res.status(500).json({ error: 'Error querying the database.', details: err.message });
    }
});

// DELETE request to delete data
app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: `No data found to delete for ID ${id}.` });
        }

        res.status(200).json({ message: `Data deleted for ID ${id}.` });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting data from the database.', details: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});