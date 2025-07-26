<?php
// line_user.php
require __DIR__ . 'db.php';
header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'];
// ID はクエリパラメータ ?id=xxx
$id = isset($_GET['id']) ? $_GET['id'] : null;
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            // 全保護者取得
            $stmt = $pdo->query(
                "SELECT id
                      , line_user_id
                      , line_user_name AS display_name
                      , picture_url
                      , family_id
                      , status
                      , created_at
                 FROM line_user"
            );
            $rows = $stmt->fetchAll();
            echo json_encode($rows);
            break;

        case 'PATCH':
            // family_id 更新
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'MISSING_ID']);
                break;
            }
            if (!array_key_exists('family_id', $input)) {
                http_response_code(400);
                echo json_encode(['error' => 'NO_FIELDS']);
                break;
            }
            $stmt = $pdo->prepare(
                "UPDATE line_user SET family_id = ? WHERE id = ?"
            );
            $stmt->execute([$input['family_id'], $id]);
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
