<?php
/**
 * ==========================================================
 * SignAI v2.0 — Modelo Chat (Simulador)
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Chat.php') die('Acceso denegado');

class Chat {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function startSession(int $userId, string $scenario, string $difficulty, string $name = ''): int {
        $stmt = $this->db->prepare(
            "INSERT INTO chat_sessions (user_id, session_name, scenario, difficulty)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $name ?: 'Sesión ' . date('d/m H:i'), $scenario, $difficulty]);
        return (int)$this->db->lastInsertId();
    }
    
    public function findSession(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM chat_sessions WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
    
    public function getSessionMessages(int $sessionId): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at"
        );
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll();
    }
    
    public function addMessage(int $sessionId, string $sender, string $content, array $options = []): int {
        $stmt = $this->db->prepare(
            "INSERT INTO chat_messages 
                (session_id, sender, content, detected_sign, confidence, is_correct)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $sessionId,
            $sender,
            $content,
            $options['detected_sign'] ?? null,
            $options['confidence'] ?? null,
            $options['is_correct'] ?? null
        ]);
        return (int)$this->db->lastInsertId();
    }
    
    public function finishSession(int $sessionId, array $results): bool {
        $stmt = $this->db->prepare(
            "UPDATE chat_sessions 
             SET score = ?, words_completed = ?, accuracy = ?, time_spent = ?, finished_at = NOW()
             WHERE id = ?"
        );
        return $stmt->execute([
            $results['score'] ?? 0,
            $results['words_completed'] ?? 0,
            $results['accuracy'] ?? 0,
            $results['time_spent'] ?? 0,
            $sessionId
        ]);
    }
    
    public function getUserSessions(int $userId, int $limit = 20): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM chat_sessions WHERE user_id = ? 
             ORDER BY started_at DESC LIMIT ?"
        );
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getBestScore(int $userId, ?string $scenario = null): int {
        $sql = "SELECT MAX(score) FROM chat_sessions WHERE user_id = ?";
        $params = [$userId];
        if ($scenario) {
            $sql .= " AND scenario = ?";
            $params[] = $scenario;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }
}
?>