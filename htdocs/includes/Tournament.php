<?php
/**
 * ==========================================================
 * SignAI v2.0 — Modelo Tournament
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Tournament.php') die('Acceso denegado');

class Tournament {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function getCurrent(): ?array {
        $stmt = $this->db->prepare(
            "SELECT * FROM tournaments 
             WHERE is_active = 1 AND starts_at <= NOW() AND ends_at >= NOW()
             ORDER BY starts_at DESC LIMIT 1"
        );
        $stmt->execute();
        return $stmt->fetch() ?: null;
    }
    
    public function getUpcoming(int $limit = 5): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM tournaments 
             WHERE is_active = 1 AND starts_at > NOW()
             ORDER BY starts_at ASC LIMIT ?"
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getPast(int $limit = 10): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM tournaments 
             WHERE ends_at < NOW()
             ORDER BY ends_at DESC LIMIT ?"
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function find(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM tournaments WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
    
    public function isUserJoined(int $tournamentId, int $userId): bool {
        $stmt = $this->db->prepare(
            "SELECT id FROM tournament_participants WHERE tournament_id = ? AND user_id = ? LIMIT 1"
        );
        $stmt->execute([$tournamentId, $userId]);
        return (bool)$stmt->fetch();
    }
    
    public function join(int $tournamentId, int $userId): array {
        $tournament = $this->find($tournamentId);
        if (!$tournament) return ['success' => false, 'error' => 'Torneo no encontrado'];
        
        if (!$tournament['is_active']) return ['success' => false, 'error' => 'Torneo inactivo'];
        if (strtotime($tournament['starts_at']) > time()) {
            return ['success' => false, 'error' => 'El torneo aún no comienza'];
        }
        if (strtotime($tournament['ends_at']) < time()) {
            return ['success' => false, 'error' => 'El torneo ya terminó'];
        }
        
        if ($this->isUserJoined($tournamentId, $userId)) {
            return ['success' => false, 'error' => 'Ya estás inscrito'];
        }
        
        // Verificar límite de participantes
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = ?"
        );
        $stmt->execute([$tournamentId]);
        $count = (int)$stmt->fetchColumn();
        
        if ($count >= $tournament['max_participants']) {
            return ['success' => false, 'error' => 'Torneo lleno'];
        }
        
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)"
            );
            $stmt->execute([$tournamentId, $userId]);
            
            // Notificación
            $this->db->prepare(
                "INSERT INTO notifications (user_id, type, title, message, icon, link)
                 VALUES (?, 'info', '¡Inscrito al torneo!', ?, '🏆', '/tournament.php?id=' || ?)"
            )->execute([$userId, $tournament['title'], $tournamentId]);
            
            return ['success' => true, 'tournament' => $tournament];
        } catch (Exception $e) {
            error_log('[Tournament join] ' . $e->getMessage());
            return ['success' => false, 'error' => 'Error al inscribirse'];
        }
    }
    
    public function updateScore(int $tournamentId, int $userId, array $data): bool {
        $allowed = ['score', 'correct_detections', 'total_detections', 'time_spent'];
        $fields = [];
        $values = [];
        
        foreach ($data as $k => $v) {
            if (in_array($k, $allowed)) {
                $fields[] = "$k = $k + :$k";
                $values[":$k"] = (int)$v;
            }
        }
        
        if (empty($fields)) return false;
        
        $values[':tournament_id'] = $tournamentId;
        $values[':user_id'] = $userId;
        
        $sql = "UPDATE tournament_participants SET " . implode(', ', $fields) . 
               " WHERE tournament_id = :tournament_id AND user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
    
    public function getLeaderboard(int $tournamentId, int $limit = 50): array {
        $stmt = $this->db->prepare(
            "SELECT tp.*, u.username, u.avatar, u.full_name
             FROM tournament_participants tp
             INNER JOIN users u ON u.id = tp.user_id
             WHERE tp.tournament_id = ?
             ORDER BY tp.score DESC, tp.correct_detections DESC, tp.time_spent ASC
             LIMIT ?"
        );
        $stmt->bindValue(1, $tournamentId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getUserRank(int $tournamentId, int $userId): int {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) + 1 FROM tournament_participants 
             WHERE tournament_id = ? AND score > (
                SELECT score FROM tournament_participants 
                WHERE tournament_id = ? AND user_id = ?
             )"
        );
        $stmt->execute([$tournamentId, $tournamentId, $userId]);
        return (int)$stmt->fetchColumn();
    }
    
    public function create(array $data): int {
        $stmt = $this->db->prepare(
            "INSERT INTO tournaments (title, description, difficulty, theme, starts_at, ends_at, max_participants, prize_xp, prize_badge)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['title'],
            $data['description'] ?? '',
            $data['difficulty'] ?? 'medium',
            $data['theme'] ?? 'abecedario',
            $data['starts_at'],
            $data['ends_at'],
            $data['max_participants'] ?? 100,
            $data['prize_xp'] ?? 500,
            $data['prize_badge'] ?? '🥇'
        ]);
        return (int)$this->db->lastInsertId();
    }
    
    public function finish(int $tournamentId): array {
        $tournament = $this->find($tournamentId);
        if (!$tournament) return ['success' => false];
        
        $leaderboard = $this->getLeaderboard($tournamentId, 3);
        $winners = [];
        
        // Actualizar ranks
        $all = $this->getLeaderboard($tournamentId, 9999);
        foreach ($all as $i => $p) {
            $this->db->prepare(
                "UPDATE tournament_participants SET rank = ? WHERE id = ?"
            )->execute([$i + 1, $p['id']]);
        }
        
        // Dar premios al top 3
        foreach ($leaderboard as $i => $p) {
            $xp = (int)floor($tournament['prize_xp'] / ($i + 1));
            $this->db->prepare("UPDATE user_stats SET total_xp = total_xp + ? WHERE user_id = ?")
                     ->execute([$xp, $p['user_id']]);
            
            $this->db->prepare(
                "INSERT INTO notifications (user_id, type, title, message, icon, link)
                 VALUES (?, 'success', ?, ?, ?, '/tournament.php')"
            )->execute([
                $p['user_id'],
                '¡Ganaste el torneo!',
                'Quedaste en posición #' . ($i + 1) . '. Recibiste ' . $xp . ' XP',
                $i === 0 ? '🥇' : ($i === 1 ? '🥈' : '🥉')
            ]);
            
            $winners[] = ['user_id' => $p['user_id'], 'rank' => $i + 1, 'xp' => $xp];
        }
        
        $this->db->prepare("UPDATE tournaments SET is_active = 0 WHERE id = ?")
                 ->execute([$tournamentId]);
        
        return ['success' => true, 'winners' => $winners];
    }
}
?>