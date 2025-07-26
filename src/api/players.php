<?php
// players.php
require __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'];
// ID はクエリパラメータ ?id=xxx で受け取る
$id = isset($_GET['id']) ? $_GET['id'] : null;

// JSON ボディをパース
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            // 全選手取得
            $stmt = $pdo->query(
                "SELECT player_id AS id
                      , player_name AS name
                      , substitute_count
                      , family_id
                 FROM players"
            );
            $rows = $stmt->fetchAll();
            echo json_encode($rows);
            break;

        case 'POST':
            // 新規選手追加
            $stmt = $pdo->prepare(
                "INSERT INTO players
                   (player_id, player_name, substitute_count, family_id, created_at)
                 VALUES (?, ?, ?, ?, NOW())"
            );
            $stmt->execute([
                $input['id'],
                $input['name'],
                $input['substitute_count'] ?? 0,
                $input['family_id'] ?? null,
            ]);
            echo json_encode(['success' => true]);
            break;

        case 'PATCH':
            // family_id or substitute_count 更新
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'MISSING_ID']);
                break;
            }
            $fields = [];
            $params = [];
            if (isset($input['family_id'])) {
                $fields[] = "family_id = ?";
                $params[] = $input['family_id'];
            }
            if (isset($input['substitute_count'])) {
                $fields[] = "substitute_count = ?";
                $params[] = $input['substitute_count'];
            }
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'NO_FIELDS']);
                break;
            }
            $params[] = $id;
            $sql = "UPDATE players SET " . implode(', ', $fields) . " WHERE player_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            // 選手削除
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'MISSING_ID']);
                break;
            }
            $stmt = $pdo->prepare("DELETE FROM players WHERE player_id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'METHOD_NOT_ALLOWED']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'QUERY_FAILED', 'message' => $e->getMessage()]);
}
