<?php
/**
 * ==========================================================
 * SignAI v2.0 — Seguridad
 * Headers + CSRF + Rate Limiting + Sanitización
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'security.php') {
    http_response_code(403);
    die('Acceso denegado');
}

// ==========================================================
// HEADERS DE SEGURIDAD
// ==========================================================
function sendSecurityHeaders() {
    if (headers_sent()) return;
    
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(self), microphone=(), geolocation=()');
    
    // CSP adaptable (permite MediaPipe + Spline + Google Fonts)
    $csp = "default-src 'self'; " .
       "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.spline.design https://my.spline.design https://unpkg.com https://cdnjs.cloudflare.com; " .
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://my.spline.design; " .
       "font-src 'self' data: https://fonts.gstatic.com; " .
       "img-src 'self' data: blob: https:; " .
       "media-src 'self' blob:; " .
       "connect-src 'self' https://cdn.jsdelivr.net https://prod.spline.design https://my.spline.design https://unpkg.com; " .
       "frame-src 'self' https://prod.spline.design https://my.spline.design; " .
       "worker-src 'self' blob:; " .
       "object-src 'none'; " .
       "base-uri 'self'; " .
       "form-action 'self'";
    
    header('Content-Security-Policy: ' . $csp);
    header_remove('X-Powered-By');
    header_remove('Server');
}

sendSecurityHeaders();

// ==========================================================
// CSRF PROTECTION
// ==========================================================

/**
 * Genera o retorna el token CSRF actual
 */
function csrf_token() {
    if (empty($_SESSION['csrf_token']) || 
        empty($_SESSION['csrf_token_time']) || 
        (time() - $_SESSION['csrf_token_time']) > CSRF_TOKEN_LIFETIME) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    return $_SESSION['csrf_token'];
}

/**
 * Retorna el campo HTML del CSRF
 */
function csrf_field() {
    return '<input type="hidden" name="csrf_token" value="' . csrf_token() . '">';
}

/**
 * Verifica el token CSRF
 */
function csrf_verify($token = null) {
    if ($token === null) {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    }
    if (empty($_SESSION['csrf_token']) || empty($token)) return false;
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Valida el CSRF o muere
 */
function csrf_require() {
    if (!csrf_verify()) {
        http_response_code(419);
        if (isAjax()) {
            jsonResponse(['success' => false, 'error' => 'Token CSRF inválido o expirado'], 419);
        }
        die('Token CSRF inválido o expirado');
    }
}

// ==========================================================
// SANITIZACIÓN
// ==========================================================

/**
 * Sanitiza una cadena para output HTML
 */
function e($str) {
    return htmlspecialchars((string)$str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Sanitiza para JSON
 */
function json_safe($data) {
    return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
}

/**
 * Sanitiza un array completo recursivamente
 */
function sanitize_array($data) {
    if (!is_array($data)) return e($data);
    return array_map('sanitize_array', $data);
}

// ==========================================================
// VALIDACIÓN
// ==========================================================

function isAjax() {
    return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

function isPost() {
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

function isGet() {
    return $_SERVER['REQUEST_METHOD'] === 'GET';
}

/**
 * Obtiene el body JSON del request
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

// ==========================================================
// RATE LIMITING (basado en archivos)
// ==========================================================

/**
 * Verifica rate limit por IP + acción
 */
function rate_limit($action, $maxAttempts = 5, $windowSeconds = 300) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = CACHE_PATH . '/ratelimit_' . md5($action . $ip) . '.json';
    
    if (!is_dir(CACHE_PATH)) @mkdir(CACHE_PATH, 0755, true);
    
    $now = time();
    $data = ['attempts' => [], 'blocked_until' => 0];
    
    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        $saved = @json_decode($raw, true);
        if (is_array($saved)) $data = $saved;
    }
    
    // Si está bloqueado
    if ($data['blocked_until'] > $now) {
        return ['allowed' => false, 'retry_after' => $data['blocked_until'] - $now];
    }
    
    // Limpiar intentos viejos
    $data['attempts'] = array_filter($data['attempts'], function($t) use ($now, $windowSeconds) {
        return ($now - $t) < $windowSeconds;
    });
    
    // Contar intentos
    if (count($data['attempts']) >= $maxAttempts) {
        $data['blocked_until'] = $now + $windowSeconds;
        @file_put_contents($file, json_encode($data));
        return ['allowed' => false, 'retry_after' => $windowSeconds];
    }
    
    // Registrar intento
    $data['attempts'][] = $now;
    @file_put_contents($file, json_encode($data), LOCK_EX);
    
    return ['allowed' => true, 'remaining' => $maxAttempts - count($data['attempts'])];
}

/**
 * Limpia intentos de una acción
 */
function rate_limit_reset($action) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = CACHE_PATH . '/ratelimit_' . md5($action . $ip) . '.json';
    if (file_exists($file)) @unlink($file);
}

// ==========================================================
// PROTECCIÓN CONTRA FUERZA BRUTA EN LOGIN
// ==========================================================

function checkLoginAttempts($identifier) {
    $key = 'login_' . preg_replace('/[^a-z0-9]/', '', strtolower($identifier));
    return rate_limit($key, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_TIME);
}

function resetLoginAttempts($identifier) {
    $key = 'login_' . preg_replace('/[^a-z0-9]/', '', strtolower($identifier));
    rate_limit_reset($key);
}

// ==========================================================
// GENERADORES SEGUROS
// ==========================================================

function generate_token($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

function generate_code($digits = 6) {
    return str_pad((string)random_int(0, 999999), $digits, '0', STR_PAD_LEFT);
}

function generate_uuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// ==========================================================
// HASH DE CONTRASEÑAS
// ==========================================================

function hash_password($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

function needs_rehash($hash) {
    return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

/**
 * Valida la fortaleza de una contraseña
 */
function validate_password_strength($password) {
    $errors = [];
    
    if (strlen($password) < 8) {
        $errors[] = 'Mínimo 8 caracteres';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Al menos una mayúscula';
    }
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Al menos una minúscula';
    }
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Al menos un número';
    }
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors[] = 'Al menos un carácter especial';
    }
    
    $strength = 'weak';
    $score = 0;
    if (strlen($password) >= 8)  $score++;
    if (strlen($password) >= 12) $score++;
    if (preg_match('/[A-Z]/', $password)) $score++;
    if (preg_match('/[a-z]/', $password)) $score++;
    if (preg_match('/[0-9]/', $password)) $score++;
    if (preg_match('/[^A-Za-z0-9]/', $password)) $score++;
    
    if ($score >= 5) $strength = 'strong';
    elseif ($score >= 3) $strength = 'medium';
    
    return [
        'valid'    => empty($errors),
        'errors'   => $errors,
        'strength' => $strength,
        'score'    => $score
    ];
}

// ==========================================================
// VALIDACIÓN DE INPUTS
// ==========================================================

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validate_username($username) {
    return preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username) === 1;
}

function validate_url($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

// ==========================================================
// PROTECCIÓN XSS / SQL (más allá de PDO)
// ==========================================================

function clean_html($html) {
    // Lista blanca muy limitada
    return strip_tags($html, '<p><br><strong><em><u><a><ul><ol><li>');
}

function strip_control_chars($str) {
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $str);
}

// ==========================================================
// PROTECCIÓN CONTRA CLICKJACKING
// ==========================================================
if (isset($_SERVER['HTTP_REFERER'])) {
    $ref = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST);
    $own = parse_url(APP_URL, PHP_URL_HOST);
    if ($ref && $own && $ref !== $own && !isAjax()) {
        // Loguear pero no bloquear (para compatibilidad)
        error_log("[SignAI] Referer externo: $ref");
    }
}

// ==========================================================
// LOG DE ACTIVIDAD SOSPECHOSA
// ==========================================================
function log_security_event($type, $details = []) {
    $entry = [
        'time'    => date('c'),
        'type'    => $type,
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'ua'      => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'uri'     => $_SERVER['REQUEST_URI'] ?? '',
        'details' => $details,
        'user_id' => $_SESSION['user_id'] ?? null
    ];
    
    if (!is_dir(LOGS_PATH)) @mkdir(LOGS_PATH, 0755, true);
    @file_put_contents(
        LOGS_PATH . '/security.log',
        json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}
?>