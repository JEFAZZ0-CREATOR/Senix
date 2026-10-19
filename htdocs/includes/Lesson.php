<?php
/**
 * ==========================================================
 * SignAI v2.0 — Modelo Lesson
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Lesson.php') die('Acceso denegado');

class Lesson {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function find(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM lessons WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
    
    public function findBySlug(string $slug): ?array {
        $stmt = $this->db->prepare("SELECT * FROM lessons WHERE slug = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$slug]);
        return $stmt->fetch() ?: null;
    }
    
    public function getAll(bool $activeOnly = true): array {
        $sql = "SELECT * FROM lessons";
        if ($activeOnly) $sql .= " WHERE is_active = 1";
        $sql .= " ORDER BY level, order_index";
        
        return $this->db->query($sql)->fetchAll();
    }
    
    public function getByCategory(string $category): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM lessons WHERE category = ? AND is_active = 1 ORDER BY order_index"
        );
        $stmt->execute([$category]);
        return $stmt->fetchAll();
    }
    
    public function getByLevel(int $level): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM lessons WHERE level = ? AND is_active = 1 ORDER BY order_index"
        );
        $stmt->execute([$level]);
        return $stmt->fetchAll();
    }
    
    public function getItems(int $lessonId): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM lesson_items WHERE lesson_id = ? ORDER BY order_index"
        );
        $stmt->execute([$lessonId]);
        return $stmt->fetchAll();
    }
    
    public function getWithItems(int $lessonId): ?array {
        $lesson = $this->find($lessonId);
        if (!$lesson) return null;
        
        $lesson['items'] = $this->getItems($lessonId);
        
        // Enriquecer con datos de letras/palabras
        foreach ($lesson['items'] as &$item) {
            if ($item['item_type'] === 'letter') {
                $stmt = $this->db->prepare("SELECT * FROM letters WHERE letter = ? LIMIT 1");
                $stmt->execute([$item['item_value']]);
                $item['details'] = $stmt->fetch() ?: null;
            } elseif ($item['item_type'] === 'word') {
                $stmt = $this->db->prepare("SELECT * FROM words WHERE word = ? LIMIT 1");
                $stmt->execute([$item['item_value']]);
                $item['details'] = $stmt->fetch() ?: null;
            }
        }
        
        return $lesson;
    }
    
    public function getUserProgress(int $userId, int $lessonId): ?array {
        $stmt = $this->db->prepare(
            "SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ? LIMIT 1"
        );
        $stmt->execute([$userId, $lessonId]);
        return $stmt->fetch() ?: null;
    }
    
    public function getUserLessons(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT l.*, 
                    COALESCE(p.completed, 0) as completed,
                    COALESCE(p.score, 0) as user_score,
                    COALESCE(p.accuracy, 0) as user_accuracy,
                    COALESCE(p.perfect, 0) as perfect,
                    p.completed_at
             FROM lessons l
             LEFT JOIN user_progress p ON p.lesson_id = l.id AND p.user_id = ?
             WHERE l.is_active = 1
             ORDER BY l.level, l.order_index"
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        $previousComplete = true;
        foreach ($rows as &$row) {
            $row['is_unlocked'] = $previousComplete;
            if ((int)$row['completed'] !== 1) $previousComplete = false;
        }
        unset($row);
        return $rows;
    }

    public function isUnlocked(int $userId, int $lessonId): bool {
        $stmt = $this->db->prepare(
            "SELECT l.id, COALESCE(p.completed,0) AS completed
             FROM lessons l
             LEFT JOIN user_progress p ON p.lesson_id=l.id AND p.user_id=?
             WHERE l.is_active=1
             ORDER BY l.level,l.order_index,l.id"
        );
        $stmt->execute([$userId]);
        $previousComplete = true;
        foreach ($stmt->fetchAll() as $row) {
            if ((int)$row['id'] === $lessonId) return $previousComplete;
            if ((int)$row['completed'] !== 1) $previousComplete = false;
        }
        return false;
    }
    
    public function getNextLesson(int $userId): ?array {
        $stmt = $this->db->prepare(
            "SELECT l.* 
             FROM lessons l
             LEFT JOIN user_progress p ON p.lesson_id = l.id AND p.user_id = ?
             WHERE l.is_active = 1 AND (p.completed IS NULL OR p.completed = 0)
             ORDER BY l.level, l.order_index
             LIMIT 1"
        );
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    }
    
    public function count(): int {
        return (int)$this->db->query("SELECT COUNT(*) FROM lessons WHERE is_active = 1")->fetchColumn();
    }
    
    public function create(array $data): int {
        $stmt = $this->db->prepare(
            "INSERT INTO lessons (title, slug, description, long_description, level, category, icon, order_index, xp_reward, prerequisite_id, created_by)
             VALUES (:title, :slug, :description, :long_description, :level, :category, :icon, :order_index, :xp_reward, :prerequisite_id, :created_by)"
        );
        
        $stmt->execute([
            ':title'            => $data['title'],
            ':slug'             => $data['slug'] ?? str_slug($data['title']),
            ':description'      => $data['description'] ?? '',
            ':long_description' => $data['long_description'] ?? null,
            ':level'            => $data['level'] ?? 1,
            ':category'         => $data['category'] ?? 'abecedario',
            ':icon'             => $data['icon'] ?? '📘',
            ':order_index'      => $data['order_index'] ?? 0,
            ':xp_reward'        => $data['xp_reward'] ?? 20,
            ':prerequisite_id'  => $data['prerequisite_id'] ?? null,
            ':created_by'       => $data['created_by'] ?? null
        ]);
        
        return (int)$this->db->lastInsertId();
    }
    
    public function addItem(int $lessonId, string $type, string $value, int $order = 0): int {
        $stmt = $this->db->prepare(
            "INSERT INTO lesson_items (lesson_id, item_type, item_value, order_index) 
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$lessonId, $type, $value, $order]);
        return (int)$this->db->lastInsertId();
    }
    
    public function update(int $id, array $data): bool {
        $allowed = ['title', 'description', 'long_description', 'level', 'category', 'icon', 'order_index', 'xp_reward', 'is_active', 'is_premium'];
        $fields = [];
        $values = [];
        
        foreach ($data as $k => $v) {
            if (in_array($k, $allowed)) {
                $fields[] = "$k = :$k";
                $values[":$k"] = $v;
            }
        }
        
        if (empty($fields)) return false;
        
        $values[':id'] = $id;
        $stmt = $this->db->prepare("UPDATE lessons SET " . implode(', ', $fields) . " WHERE id = :id");
        return $stmt->execute($values);
    }
    
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM lessons WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
?>
