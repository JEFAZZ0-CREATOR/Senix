<?php
/**
 * ==========================================================
 * Senix v2.0 — Clase Auth
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Auth.php') die('Acceso denegado');

class Auth {
    private PDO $db;
    private User $userModel;
    
    public function __construct(PDO $db) {
        $this->db = $db;
        require_once __DIR__ . '/User.php';
        $this->userModel = new User($db);
    }
    
    // ==========================================================
    // REGISTRO
    // ==========================================================
    
    public function register(string $username, string $email, string $password, string $fullName = ''): array {
        $username = trim($username);
        $email    = strtolower(trim($email));
        $fullName = trim($fullName);
        
        // Validaciones
        if (!validate_username($username)) {
            return ['success' => false, 'error' => 'Usuario inválido (3-50 caracteres alfanuméricos)'];
        }
        if (!validate_email($email)) {
            return ['success' => false, 'error' => 'Email inválido'];
        }
        $pwCheck = validate_password_strength($password);
        if (!$pwCheck['valid']) {
            return ['success' => false, 'error' => 'Contraseña débil: ' . implode(', ', $pwCheck['errors'])];
        }
        
        // Verificar duplicados
        $existing = $this->db->prepare("SELECT id, username, email FROM users WHERE username = ? OR email = ?");
        $existing->execute([$username, $email]);
        $found = $existing->fetch();
        
        if ($found) {
            if (strtolower($found['username']) === strtolower($username)) {
                return ['success' => false, 'error' => 'Este usuario ya está registrado'];
            }
            return ['success' => false, 'error' => 'Este email ya está registrado'];
        }
        
        try {
            $userId = $this->userModel->create([
                'username'      => $username,
                'email'         => $email,
                'password_hash' => hash_password($password),
                'full_name'     => $fullName ?: null
            ]);
            
            // Crear notificación de bienvenida
            $this->db->prepare(
                "INSERT INTO notifications (user_id, type, title, message, icon)
                 VALUES (?, 'success', '¡Bienvenido a Senix!', 'Comienza tu viaje aprendiendo lengua de señas.', '🎉')"
            )->execute([$userId]);
            
            return ['success' => true, 'user_id' => $userId];
        } catch (Exception $e) {
            error_log('[Senix Register] ' . $e->getMessage());
            return ['success' => false, 'error' => 'Error al crear la cuenta'];
        }
    }
    
    // ==========================================================
    // LOGIN
    // ==========================================================
    
    public function login(string $identifier, string $password, bool $remember = false): array {
        $identifier = trim($identifier);
        
        // Rate limiting
        $check = checkLoginAttempts($identifier);
        if (!$check['allowed']) {
            return [
                'success' => false,
                'error' => 'Demasiados intentos. Espera ' . ceil($check['retry_after'] / 60) . ' min.',
                'locked' => true
            ];
        }
        
        $user = $this->userModel->findByUsernameOrEmail($identifier);
        
        if (!$user) {
            $this->logAttempt($identifier, false);
            return ['success' => false, 'error' => 'Usuario o contraseña incorrectos'];
        }
        
        if (!$user['is_active']) {
            return ['success' => false, 'error' => 'Cuenta desactivada'];
        }
        
        if (!verify_password($password, $user['password_hash'])) {
            $this->logAttempt($identifier, false);
            return ['success' => false, 'error' => 'Usuario o contraseña incorrectos'];
        }
        
        // Rehash si es necesario
        if (needs_rehash($user['password_hash'])) {
            $this->userModel->updatePassword($user['id'], hash_password($password));
        }
        
        // Crear sesión
        $this->startSession($user);
        
        // Resetear intentos fallidos
        resetLoginAttempts($identifier);
        $this->logAttempt($identifier, true);
        
        // Actualizar last_login
        $this->userModel->updateLastLogin($user['id'], $_SERVER['REMOTE_ADDR'] ?? '');
        
        // Actualizar streak
        $streakInfo = $this->userModel->updateStreak($user['id']);
        
        return [
            'success' => true,
            'user'    => $user,
            'streak'  => $streakInfo
        ];
    }
    
    private function startSession(array $user): void {
        session_regenerate_id(true);
        
        $_SESSION['user_id']   = (int)$user['id'];
        $_SESSION['username']  = $user['username'];
        $_SESSION['role']      = $user['role'] ?? 'user';
        $_SESSION['level']     = (int)($user['level'] ?? 1);
        $_SESSION['login_time'] = time();
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $_SESSION['ip']         = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // Registrar sesión activa
        try {
            $this->db->prepare(
                "INSERT INTO user_sessions (user_id, session_token, ip, user_agent)
                 VALUES (?, ?, ?, ?)"
            )->execute([
                $user['id'],
                session_id(),
                $_SERVER['REMOTE_ADDR'] ?? '',
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)
            ]);
        } catch (Exception $e) {
            error_log('[Session tracking] ' . $e->getMessage());
        }
    }
    
    // ==========================================================
    // LOGOUT
    // ==========================================================
    
    public function logout(): void {
        if (isset($_SESSION['user_id'])) {
            try {
                $this->db->prepare("DELETE FROM user_sessions WHERE session_token = ?")
                         ->execute([session_id()]);
            } catch (Exception $e) {}
        }
        
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]);
        }
        
        session_destroy();
    }
    
    // ==========================================================
    // ESTADO
    // ==========================================================
    
    public function isLoggedIn(): bool {
        if (empty($_SESSION['user_id'])) return false;
        
        // Timeout
        if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > SESSION_LIFETIME) {
            $this->logout();
            return false;
        }
        
        return true;
    }
    
    public function user(): ?array {
        if (!$this->isLoggedIn()) return null;
        return $this->userModel->find((int)$_SESSION['user_id']);
    }
    
    public function id(): ?int {
        return $_SESSION['user_id'] ?? null;
    }
    
    public function isAdmin(): bool {
        return ($_SESSION['role'] ?? '') === 'admin';
    }
    
    public function isTeacher(): bool {
        return in_array($_SESSION['role'] ?? '', ['teacher', 'admin']);
    }
    
    // ==========================================================
    // LOGS
    // ==========================================================
    
    private function logAttempt(string $identifier, bool $success): void {
        try {
            $this->db->prepare(
                "INSERT INTO login_attempts (identifier, ip, user_agent, success) VALUES (?, ?, ?, ?)"
            )->execute([
                $identifier,
                $_SERVER['REMOTE_ADDR'] ?? '',
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
                $success ? 1 : 0
            ]);
        } catch (Exception $e) {}
    }
    
    // ==========================================================
    // RECUPERACIÓN DE CONTRASEÑA
    // ==========================================================
    
    public function requestPasswordReset(string $email): array {
        $user = $this->userModel->findByEmail($email);
        
        // No revelar si existe o no
        if (!$user) {
            return ['success' => true, 'message' => 'Si el email existe, recibirás un enlace'];
        }
        
        $token = generate_token(64);
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hora
        
        try {
            $this->db->prepare(
                "INSERT INTO password_resets (user_id, token, ip, expires_at) VALUES (?, ?, ?, ?)"
            )->execute([$user['id'], $token, $_SERVER['REMOTE_ADDR'] ?? '', $expires]);
            
            return ['success' => true, 'token' => $token, 'user' => $user];
        } catch (Exception $e) {
            return ['success' => false, 'error' => 'Error al procesar solicitud'];
        }
    }
    
    public function resetPassword(string $token, string $newPassword): array {
        $pwCheck = validate_password_strength($newPassword);
        if (!$pwCheck['valid']) {
            return ['success' => false, 'error' => 'Contraseña débil'];
        }
        
        $stmt = $this->db->prepare(
            "SELECT * FROM password_resets 
             WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1"
        );
        $stmt->execute([$token]);
        $reset = $stmt->fetch();
        
        if (!$reset) {
            return ['success' => false, 'error' => 'Token inválido o expirado'];
        }
        
        try {
            $this->db->beginTransaction();
            $this->userModel->updatePassword($reset['user_id'], hash_password($newPassword));
            $this->db->prepare("UPDATE password_resets SET used = 1 WHERE id = ?")
                     ->execute([$reset['id']]);
            $this->db->commit();
            
            return ['success' => true];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => 'Error al actualizar'];
        }
    }
    
    // ==========================================================
    // VERIFICACIÓN DE EMAIL
    // ==========================================================
    
    public function createEmailVerification(int $userId): string {
        $token = generate_token(64);
        $expires = date('Y-m-d H:i:s', time() + 86400); // 24h
        
        $this->db->prepare(
            "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)"
        )->execute([$userId, $token, $expires]);
        
        return $token;
    }
    
    public function verifyEmail(string $token): array {
        $stmt = $this->db->prepare(
            "SELECT * FROM email_verifications 
             WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1"
        );
        $stmt->execute([$token]);
        $v = $stmt->fetch();
        
        if (!$v) return ['success' => false, 'error' => 'Token inválido o expirado'];
        
        try {
            $this->db->beginTransaction();
            $this->db->prepare("UPDATE users SET email_verified = 1 WHERE id = ?")
                     ->execute([$v['user_id']]);
            $this->db->prepare("UPDATE email_verifications SET used = 1 WHERE id = ?")
                     ->execute([$v['id']]);
            $this->db->commit();
            
            return ['success' => true, 'user_id' => $v['user_id']];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => 'Error al verificar'];
        }
    }
}
?>