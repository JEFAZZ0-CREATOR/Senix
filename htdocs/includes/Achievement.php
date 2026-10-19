<?php
/**
 * ==========================================================
 * SignAI v2.0 — Modelo Achievement
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Achievement.php') die('Acceso denegado');

class Achievement {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function getAll(bool $includeHidden = false): array {
        $sql = "SELECT * FROM achievements WHERE is_active = 1";
        if (!$includeHidden) $sql .= " AND is_hidden = 0";
        $sql .= " ORDER BY requirement_type, requirement_value";
        return $this->db->query($sql)->fetchAll();
    }
    
    public function find(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM achievements WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
    
    public function getByCode(string $code): ?array {
        $stmt = $this->db->prepare("SELECT * FROM achievements WHERE code = ?");
        $stmt->execute([$code]);
        return $stmt->fetch() ?: null;
    }
    
    public function getUserAchievements(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT a.*, ua.unlocked, ua.progress, ua.unlocked_at
             FROM achievements a
             LEFT JOIN user_achievements ua 
                ON ua.achievement_id = a.id AND ua.user_id = ?
             WHERE a.is_active = 1
             ORDER BY ua.unlocked DESC, a.requirement_type, a.requirement_value"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
    
    public function getUserUnlocked(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT a.*, ua.unlocked_at
             FROM user_achievements ua
             INNER JOIN achievements a ON a.id = ua.achievement_id
             WHERE ua.user_id = ? AND ua.unlocked = 1
             ORDER BY ua.unlocked_at DESC"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
    
    public function unlock(int $userId, int $achievementId): array {
        $ach = $this->find($achievementId);
        if (!$ach) return ['success' => false];
        $ownsTransaction = !$this->db->inTransaction();
        if ($ownsTransaction) $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT unlocked FROM user_achievements WHERE user_id=? AND achievement_id=? FOR UPDATE");
            $stmt->execute([$userId, $achievementId]);
            $existing = $stmt->fetch();
            if ($existing && (int)$existing['unlocked'] === 1) {
                if ($ownsTransaction) $this->db->commit();
                return ['success' => true, 'already_unlocked' => true];
            }
            $newlyUnlocked = false;
            if (!$existing) {
                $insert = $this->db->prepare("INSERT IGNORE INTO user_achievements (user_id,achievement_id,unlocked,unlocked_at) VALUES (?,?,1,UTC_TIMESTAMP())");
                $insert->execute([$userId,$achievementId]);
                $newlyUnlocked = $insert->rowCount() === 1;
                if (!$newlyUnlocked) {
                    $check=$this->db->prepare("SELECT unlocked FROM user_achievements WHERE user_id=? AND achievement_id=? FOR UPDATE");
                    $check->execute([$userId,$achievementId]);
                    if ((int)$check->fetchColumn() === 1) { if ($ownsTransaction) $this->db->commit(); return ['success'=>true,'already_unlocked'=>true]; }
                    $update=$this->db->prepare("UPDATE user_achievements SET unlocked=1,unlocked_at=UTC_TIMESTAMP() WHERE user_id=? AND achievement_id=? AND unlocked=0");
                    $update->execute([$userId,$achievementId]);
                    $newlyUnlocked = $update->rowCount() === 1;
                }
            } else {
                $update = $this->db->prepare("UPDATE user_achievements SET unlocked=1,unlocked_at=UTC_TIMESTAMP() WHERE user_id=? AND achievement_id=? AND unlocked=0");
                $update->execute([$userId,$achievementId]);
                $newlyUnlocked = $update->rowCount() === 1;
            }
            if (!$newlyUnlocked) { if ($ownsTransaction) $this->db->commit(); return ['success'=>true,'already_unlocked'=>true]; }
            $stmt = $this->db->prepare("SELECT unlocked FROM user_achievements WHERE user_id=? AND achievement_id=? FOR UPDATE");
            $stmt->execute([$userId,$achievementId]);
            if ((int)$stmt->fetchColumn() !== 1) throw new RuntimeException('No se pudo guardar el logro.');
            $userModel = new User($this->db);
            $reward = max(0,(int)$ach['xp_reward']);
            if ($reward > 0) $userModel->addXP($userId,$reward);
            $this->db->prepare("INSERT INTO notifications (user_id,type,title,message,icon,link) VALUES (?,'achievement',?,?,?,?)")->execute([$userId,'¡Logro desbloqueado!',$ach['name'].' - '.$ach['description'],$ach['icon'],'menu.php#profile']);
            if ($ownsTransaction) $this->db->commit();
        } catch (Throwable $e) {
            if ($ownsTransaction && $this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
        return [
            'success'      => true,
            'achievement'  => $ach,
            'xp_reward'    => (int)$ach['xp_reward']
        ];
    }
    
    public function checkAll(int $userId): array {
        $unlocked = [];
        $userModel = new User($this->db);
        $allAch = $this->db->query("SELECT * FROM achievements WHERE is_active = 1")->fetchAll();
        
        foreach ($allAch as $ach) {
            $stats = $userModel->getStats($userId) ?: [];
            $current = 0;
            
            switch ($ach['requirement_type']) {
                case 'lessons':    $current = (int)$stats['lessons_completed']; break;
                case 'letters':    $current = (int)$stats['letters_learned']; break;
                case 'words':      $current = (int)$stats['words_learned']; break;
                case 'streak':     $current = (int)$stats['streak']; break;
                case 'level':      $current = (int)$stats['level']; break;
                case 'xp':         $current = (int)$stats['total_xp']; break;
                case 'accuracy':   $current = (int)$stats['accuracy']; break;
                case 'sessions':   $current = (int)$stats['sessions_count']; break;
                case 'detections': $current = (int)$stats['detections_total']; break;
                case 'custom':
                    if (in_array($ach['code'], ['night_owl','early_bird'], true)) {
                        $tz = 'America/Mexico_City';
                        try { $q=$this->db->prepare('SELECT timezone FROM user_curriculum_progress WHERE user_id=? ORDER BY completed_at_utc DESC LIMIT 1');$q->execute([$userId]);$tz=(string)($q->fetchColumn()?:$tz);$zone=new DateTimeZone($tz); }
                        catch (Throwable $e) { $zone=new DateTimeZone('America/Mexico_City'); }
                        $q=$this->db->prepare('SELECT MAX(completed_at_utc) FROM user_curriculum_progress WHERE user_id=?');$q->execute([$userId]);$last=$q->fetchColumn();
                        if($last){$local=(new DateTimeImmutable((string)$last,new DateTimeZone('UTC')))->setTimezone($zone);$hour=(int)$local->format('G');$current=$ach['code']==='night_owl'&&$hour>=22?1:($ach['code']==='early_bird'&&$hour<7?1:0);}
                    }
                    break;
                default:           continue 2;
            }
            
            if ($current >= $ach['requirement_value']) {
                $result = $this->unlock($userId, $ach['id']);
                if ($result['success'] && empty($result['already_unlocked'])) {
                    $unlocked[] = $result['achievement'];
                }
            }
        }
        
        return $unlocked;
    }
    
    public function countUnlocked(int $userId): int {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM user_achievements WHERE user_id = ? AND unlocked = 1"
        );
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }
    
    public function countTotal(): int {
        return (int)$this->db->query("SELECT COUNT(*) FROM achievements WHERE is_active = 1")->fetchColumn();
    }
}
?>
