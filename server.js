const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 4000;

const pool = mysql.createPool({
    host: 'mysql1101.db.sakura.ne.jp',
    user: 'tymundofs2018_kintai',
    password: 'yuuuki333',
    database: 'tymundofs2018_kintai',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
});

app.use(express.json());

app.get('/players', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT player_id AS id, family_id, player_name AS name, substitute_count, created_at FROM players'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/players', async (req, res) => {
    const { id, name, family_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO players (player_id, player_name, family_id) VALUES (?, ?, ?)',
            [id, name, family_id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/players/:id', async (req, res) => {
    const { id } = req.params;
    const { family_id } = req.body;
    try {
        await pool.query('UPDATE players SET family_id = ? WHERE player_id = ?', [family_id, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/players/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM players WHERE player_id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/line_user', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, line_user_id, line_user_name AS display_name, picture_url, family_id, status, created_at FROM line_user'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/line_user/:id', async (req, res) => {
    const { id } = req.params;
    const { family_id } = req.body;
    try {
        await pool.query('UPDATE line_user SET family_id = ? WHERE id = ?', [family_id, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});