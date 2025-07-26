<?php
// db.php
// ── データベース接続情報 ──────────────────────
$host = 'mysql1101.db.sakura.ne.jp';
$dbname = 'tymundofs2018_kintai';
$user = 'tymundofs2018_kintai';
$pass = 'yuuuki333';
$charset = 'utf8mb4';

// PDO 接続
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'DB_CONNECT_FAILED', 'message' => $e->getMessage()]);
    exit;
}
