<?php
/**
 * ==========================================================
 * SignAI v2.0 — Modelo User
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'User.php') die('Acceso denegado');

class User {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    // ==========================================================
    // CREATE
    // ==========================================================
    
    public function create(array $data): int {
        $stmt = $this->db->prepare(
            "INSERT INTO users (username, email, password_hash, full_name, avatar, role, lang, email_verified)
             VALUES (:username, :email, :password_hash, :full_name, :avatar, :role, :lang, :email_verified)"
        );
        
        $stmt->execute([
            ':username'       => $data['username'],
            ':email'          => $data['email'],
            ':password_hash'  => $data['password_hash'],
            ':full_name'      => $data['full_name'] ?? null,
            ':avatar'         => $data['avatar'] ?? 'default.png',
            ':role'           => $data['role'] ?? 'user',
            ':lang'           => $data['lang'] ?? 'es',
            ':email_verified' => $data['email_verified'] ?? 0
        ]);
        
        $userId = (int)$this->db->lastInsertId();
        
        // Crear stats y settings vacíos
        $this->db->prepare("INSERT INTO user_stats (user_id) VALUES (?)")
                 ->execute([$userId]);
        $this->db->prepare("INSERT INTO user_settings (user_id) VALUES (?)")
                 ->execute([$userId]);
        
        return $userId;
    }
    
    // ==========================================================
    // READ
    // ==========================================================
    
    public function find(int $id): ?array {
        $stmt = $this->db->prepare(
            "SELECT u.*, s.level, s.xp, s.total_xp, s.streak, s.longest_streak,
                    s.lessons_completed, s.lessons_perfect, s.letters_learned,
                    s.words_learned, s.detections_total, s.detections_correct,
                    s.accuracy, s.time_practiced, s.sessions_count, s.rank_points,
                    st.theme, st.sound_enabled, st.camera_mirror, st.show_skeleton
             FROM users u
             LEFT JOIN user_stats s ON s.user_id = u.id
             LEFT JOIN user_settings st ON st.user_id = u.id
             WHERE u.id = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
    
    public function findByUsername(string $username): ?array {
        $stmt = $this->db->prepare(
            "SELECT u.*, s.level, s.xp, s.streak 
             FROM users u
             LEFT JOIN user_stats s ON s.user_id = u.id
             WHERE u.username = ? LIMIT 1"
        );
        $stmt->execute([$username]);
        return $stmt->fetch() ?: null;
    }
    
    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare(
            "SELECT u.*, s.level, s.xp, s.streak 
             FROM users u
             LEFT JOIN user_stats s ON s.user_id = u.id
             WHERE u.email = ? LIMIT 1"
        );
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }
    
    public function findByUsernameOrEmail(string $identifier): ?array {
        $stmt = $this->db->prepare(
            "SELECT u.*, s.level, s.xp, s.streak 
             FROM users u
             LEFT JOIN user_stats s ON s.user_id = u.id
             WHERE (u.username = ? OR u.email = ?) AND u.is_active = 1
             LIMIT 1"
        );
        $stmt->execute([$identifier, $identifier]);
        return $stmt->fetch() ?: null;
    }
    
    public function getStats(int $userId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM user_stats WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    }
    
    public function getSettings(int $userId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM user_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    }
    
    public function getLeaderboard(int $limit = 50, int $offset = 0): array {
        $stmt = $this->db->prepare(
            "SELECT u.id, u.username, u.avatar, u.full_name,
                    s.level, s.total_xp, s.streak, s.accuracy, s.rank_points
             FROM users u
             INNER JOIN user_stats s ON s.user_id = u.id
             WHERE u.is_active = 1 AND u.is_public = 1
             ORDER BY s.total_xp DESC, s.level DESC
             LIMIT ? OFFSET ?"
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getRank(int $userId): int {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) + 1 as rank
             FROM user_stats s1
             INNER JOIN user_stats s2 ON s2.user_id = ?
             WHERE s1.total_xp > s2.total_xp"
        );
        $stmt->execute([$userId]);
        return (int)$stmt->fetch()['rank'];
    }
    
    public function search(string $query, int $limit = 20): array {
        $stmt = $this->db->prepare(
            "SELECT id, username, avatar, full_name, level
             FROM users u
             LEFT JOIN user_stats s ON s.user_id = u.id
             WHERE (u.username LIKE ? OR u.full_name LIKE ?) 
               AND u.is_active = 1 AND u.is_public = 1
             LIMIT ?"
        );
        $like = '%' . $query . '%';
        $stmt->bindValue(1, $like);
        $stmt->bindValue(2, $like);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // ==========================================================
    // UPDATE
    // ==========================================================
    
    public function update(int $id, array $data): bool {
        $allowed = ['username', 'email', 'full_name', 'avatar', 'bio', 'lang', 'role', 'is_active', 'is_public', 'email_verified', 'two_factor_enabled', 'two_factor_secret'];
        
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowed)) {
                $fields[] = "$key = :$key";
                $values[":$key"] = $value;
            }
        }
        
        if (empty($fields)) return false;
        
        $values[':id'] = $id;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
    
    public function updatePassword(int $userId, string $passwordHash): bool {
        $stmt = $this->db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        return $stmt->execute([$passwordHash, $userId]);
    }
    
    public function updateStats(int $userId, array $data): bool {
        $allowed = ['level', 'xp', 'total_xp', 'streak', 'longest_streak', 'last_practice_date',
                    'lessons_completed', 'lessons_perfect', 'letters_learned', 'words_learned',
                    'detections_total', 'detections_correct', 'accuracy', 'time_practiced',
                    'sessions_count', 'rank_points'];
        
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowed)) {
                $fields[] = "$key = :$key";
                $values[":$key"] = $value;
            }
        }
        
        if (empty($fields)) return false;
        
        $values[':user_id'] = $userId;
        $sql = "UPDATE user_stats SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
    
    public function updateSettings(int $userId, array $data): bool {
        $allowed = ['theme', 'notifications_email', 'notifications_push',
                    'notifications_achievements', 'notifications_streak',
                    'sound_enabled', 'vibration_enabled', 'camera_mirror',
                    'camera_preferred', 'detection_sensitivity', 'show_skeleton',
                    'show_confidence', 'difficulty_preference'];
        
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowed)) {
                $fields[] = "$key = :$key";
                $values[":$key"] = $value;
            }
        }
        
        if (empty($fields)) return false;
        
        $values[':user_id'] = $userId;
        $sql = "UPDATE user_settings SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($values);
    }
    
    public function updateLastLogin(int $userId, string $ip): bool {
        $stmt = $this->db->prepare("UPDATE users SET last_login = NOW(), last_ip = ? WHERE id = ?");
        return $stmt->execute([$ip, $userId]);
    }
    
    // ==========================================================
    // ADD XP / LEVEL UP
    // ==========================================================
    
    public function addXP(int $userId, int $amount): array {
        if ($amount <= 0) return ['success' => false];
        $ownsTransaction = !$this->db->inTransaction();
        if ($ownsTransaction) $this->db->beginTransaction();
        
        try {
            $stmt = $this->db->prepare("SELECT level, xp, total_xp FROM user_stats WHERE user_id = ? FOR UPDATE");
            $stmt->execute([$userId]);
            $stats = $stmt->fetch();
            
            $newXP = (int)$stats['xp'] + $amount;
            $newTotalXP = (int)$stats['total_xp'] + $amount;
            $currentLevel = (int)$stats['level'];
            $newLevel = $currentLevel;
            
            // Subir de nivel
            while ($newLevel < MAX_LEVEL && $newXP >= xp_for_level($newLevel)) {
                $newXP -= xp_for_level($newLevel);
                $newLevel++;
            }
            
            $stmt = $this->db->prepare(
                "UPDATE user_stats SET xp = ?, total_xp = ?, rank_points = rank_points + ?, level = ? WHERE user_id = ?"
            );
            $stmt->execute([$newXP, $newTotalXP, $amount, $newLevel, $userId]);
            
            if ($ownsTransaction) $this->db->commit();
            
            return [
                'success'     => true,
                'old_level'   => $currentLevel,
                'new_level'   => $newLevel,
                'level_up'    => $newLevel > $currentLevel,
                'xp_added'    => $amount,
                'current_xp'  => $newXP,
                'total_xp'    => $newTotalXP,
                'next_level_xp' => xp_for_level($newLevel)
            ];
        } catch (Throwable $e) {
            if ($ownsTransaction && $this->db->inTransaction()) $this->db->rollBack();
            error_log('[SignAI addXP] ' . $e->getMessage());
            if (!$ownsTransaction) throw $e;
            return ['success' => false];
        }
    }
    
    // ==========================================================
    // STREAK
    // ==========================================================
    
    public function updateStreak(int $userId, string $timezone = ''): array {
        $stmt = $this->db->prepare(
            "SELECT streak, longest_streak, last_practice_date FROM user_stats WHERE user_id = ?"
        );
        $stmt->execute([$userId]);
        $stats = $stmt->fetch();
        
        if (!$stats) return ['success' => false];
        
        try { $zone = new DateTimeZone($timezone !== '' ? $timezone : date_default_timezone_get()); }
        catch (Throwable $e) { $zone = new DateTimeZone('America/Mexico_City'); }
        $now = new DateTimeImmutable('now', $zone);
        $today = $now->format('Y-m-d');
        $lastDate = $stats['last_practice_date'];
        
        $newStreak = 1;
        $isNewDay = false;
        
        if ($lastDate === $today) {
            return ['success' => true, 'streak' => (int)$stats['streak'], 'changed' => false];
        }
        
        if ($lastDate) {
            $yesterday = $now->modify('-1 day')->format('Y-m-d');
            if ($lastDate === $yesterday) {
                $newStreak = (int)$stats['streak'] + 1;
                $isNewDay = true;
            } elseif ($lastDate === $today) {
                $newStreak = (int)$stats['streak'];
            }
        } else {
            $isNewDay = true;
        }
        
        $longest = max((int)$stats['longest_streak'], $newStreak);
        
        $stmt = $this->db->prepare(
            "UPDATE user_stats 
             SET streak = ?, longest_streak = ?, last_practice_date = ?
             WHERE user_id = ?"
        );
        $stmt->execute([$newStreak, $longest, $today, $userId]);
        
        return [
            'success'    => true,
            'streak'     => $newStreak,
            'longest'    => $longest,
            'changed'    => $isNewDay,
            'is_new_day' => $isNewDay
        ];
    }
    
    // ==========================================================
    // STATS CALCULADOS
    // ==========================================================
    
    public function recalculateAccuracy(int $userId): float {
        $stmt = $this->db->prepare(
            "SELECT detections_total, detections_correct FROM user_stats WHERE user_id = ?"
        );
        $stmt->execute([$userId]);
        $s = $stmt->fetch();
        
        $total = (int)$s['detections_total'];
        $correct = (int)$s['detections_correct'];
        $accuracy = $total > 0 ? round(($correct / $total) * 100, 2) : 0;
        
        $stmt = $this->db->prepare("UPDATE user_stats SET accuracy = ? WHERE user_id = ?");
        $stmt->execute([$accuracy, $userId]);
        
        return $accuracy;
    }
    
    public function incrementDetection(int $userId, bool $correct): void {
        $field = $correct ? 'detections_correct' : '';
        $sql = "UPDATE user_stats SET detections_total = detections_total + 1";
        if ($correct) $sql .= ", detections_correct = detections_correct + 1";
        $sql .= " WHERE user_id = ?";
        
        $this->db->prepare($sql)->execute([$userId]);
    }
    
    // ==========================================================
    // DELETE
    // ==========================================================
    
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    public function deactivate(int $id): bool {
        $stmt = $this->db->prepare("UPDATE users SET is_active = 0 WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    // ==========================================================
    // UTILIDADES
    // ==========================================================
    
    public function exists(string $username, string $email): bool {
        $stmt = $this->db->prepare(
            "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
        );
        $stmt->execute([$username, $email]);
        return (bool)$stmt->fetch();
    }
    
    public function totalCount(): int {
        return (int)$this->db->query("SELECT COUNT(*) FROM users WHERE is_active = 1")->fetchColumn();
    }
    
    public function getRecent(int $limit = 10): array {
        $stmt = $this->db->prepare(
            "SELECT id, username, avatar, full_name, created_at 
             FROM users WHERE is_active = 1 
             ORDER BY created_at DESC LIMIT ?"
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>
