<?php
require_once __DIR__ . '/includes/learning-tools.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}
$token = (string)($_POST['csrf_token'] ?? '');
if ($token === '' || !hash_equals((string)($_SESSION['learn_csrf'] ?? ''), $token)) {
    http_response_code(419);
    echo json_encode(['success' => false, 'message' => 'La sesión expiró. Actualiza la página e inténtalo de nuevo.']);
    exit;
}
$action = (string)($_POST['action'] ?? '');
try {
    if ($action === 'list') {
        $items = $notificationModel->getForUser($learnUserId, 12, false);
        $items = array_map(static function (array $item): array {
            return [
                'id' => (int)$item['id'],
                'title' => (string)($item['title'] ?? 'Aviso de SENIX'),
                'message' => (string)($item['message'] ?? ''),
                'icon' => (string)($item['icon'] ?? '✦'),
                'link' => (string)($item['link'] ?? ''),
                'is_read' => (int)($item['is_read'] ?? 0),
                'created_at' => (string)($item['created_at'] ?? ''),
            ];
        }, $items);
        echo json_encode(['success' => true, 'items' => $items, 'unread' => $notificationModel->countUnread($learnUserId)], JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }
    if ($action === 'read') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || !$notificationModel->markAsRead((int)$id, $learnUserId)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No encontramos esa notificación.']);
            exit;
        }
    } elseif ($action === 'read-all') {
        $notificationModel->markAllAsRead($learnUserId);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
        exit;
    }
    echo json_encode(['success' => true, 'unread' => $notificationModel->countUnread($learnUserId)]);
} catch (Throwable $error) {
    error_log('[Senix notification center] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No se pudieron cargar las notificaciones.']);
}
