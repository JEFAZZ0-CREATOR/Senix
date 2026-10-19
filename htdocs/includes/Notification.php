<?php
/**
 * ==========================================================
 * SignAI v2.0 — Modelo Notification
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Notification.php') die('Acceso denegado');

class Notification {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function create(int $userId, string $type, string $title, string $message = '', array $options = []): int {
        $stmt = $this->db->prepare(
            "INSERT INTO notifications (user_id, type, title, message, icon, link)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId,
            $type,
            $title,
            $message,
            $options['icon'] ?? null,
            $options['link'] ?? null
        ]);
        return (int)$this->db->lastInsertId();
    }
    
    public function getForUser(int $userId, int $limit = 20, bool $unreadOnly = false): array {
        $sql = "SELECT * FROM notifications WHERE user_id = ?";
        if ($unreadOnly) $sql .= " AND is_read = 0";
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function countUnread(int $userId): int {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0"
        );
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }
    
    public function markAsRead(int $id, int $userId): bool {
        $stmt = $this->db->prepare(
            "UPDATE notifications SET is_read = 1, read_at = NOW() 
             WHERE id = ? AND user_id = ?"
        );
        return $stmt->execute([$id, $userId]);
    }
    
    public function markAllAsRead(int $userId): bool {
        $stmt = $this->db->prepare(
            "UPDATE notifications SET is_read = 1, read_at = NOW() 
             WHERE user_id = ? AND is_read = 0"
        );
        return $stmt->execute([$userId]);
    }
    
    public function delete(int $id, int $userId): bool {
        $stmt = $this->db->prepare(
            "DELETE FROM notifications WHERE id = ? AND user_id = ?"
        );
        return $stmt->execute([$id, $userId]);
    }
    
    public function deleteAll(int $userId): bool {
        $stmt = $this->db->prepare("DELETE FROM notifications WHERE user_id = ?");
        return $stmt->execute([$userId]);
    }
    
    public function deleteOld(int $days = 30): int {
        $stmt = $this->db->prepare(
            "DELETE FROM notifications WHERE is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)"
        );
        $stmt->execute([$days]);
        return $stmt->rowCount();
    }
}
?>