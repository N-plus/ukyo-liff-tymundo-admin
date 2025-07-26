// server.js
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 4000;

// MySQL プール設定
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    connectTimeout: 10000,
});

// ミドルウェア
app.use(morgan('dev'));
app.use(express.json());

// 選手一覧取得
app.get('/players', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT player_id AS id, player_name AS name, substitute_count, family_id
       FROM players`
        );
        console.log('[MySQL] /players returned', rows.length, 'rows');
        res.json(rows);
    } catch (err) {
        console.error('[MySQL] /players query failed:', err);
        res.status(500).json({ error: err.code, message: err.message });
    }
});

// 保護者一覧取得
app.get('/line_user', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id
             , line_user_id
             , line_user_name AS display_name
             , picture_url
             , family_id
             , status
             , created_at
       FROM line_user`
        );
        console.log('[MySQL] /line_user returned', rows.length, 'rows');
        res.json(rows);
    } catch (err) {
        console.error('[MySQL] /line_user query failed:', err);
        res.status(500).json({ error: err.code, message: err.message });
    }
});

//（以下、省略。POST/PATCH/DELETE も同様に async/await + pool.query）

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
