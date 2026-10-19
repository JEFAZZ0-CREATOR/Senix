<?php
/**
 * ==========================================================
 * SignAI v2.0 — Funciones Helper Globales
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'functions.php') {
    http_response_code(403);
    die('Acceso denegado');
}

// ==========================================================
// RESPUESTAS JSON
// ==========================================================

function jsonResponse($data, $code = 200) {
    if (headers_sent()) return;
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonSuccess($data = [], $message = 'OK') {
    $payload = is_array($data) ? array_merge(['success' => true, 'message' => $message], $data) : ['success' => true, 'message' => $message, 'data' => $data];
    jsonResponse($payload, 200);
}

function jsonError($message = 'Error', $code = 400, $extra = []) {
    jsonResponse(array_merge(['success' => false, 'error' => $message], $extra), $code);
}

// ==========================================================
// REDIRECCIONES
// ==========================================================

function redirect($url, $code = 302) {
    if (headers_sent()) {
        echo "<script>window.location.href='" . addslashes($url) . "';</script>";
        exit;
    }
    header('Location: ' . $url, true, $code);
    exit;
}

function redirectWithFlash($url, $type, $message) {
    setFlash($type, $message);
    redirect($url);
}

function back() {
    $ref = $_SERVER['HTTP_REFERER'] ?? APP_URL . '/menu.php';
    redirect($ref);
}

function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        setFlash('warning', 'Debes iniciar sesión');
        redirect(APP_URL . '/login.php');
    }
}

function requireGuest() {
    if (!empty($_SESSION['user_id'])) {
        redirect(APP_URL . '/menu.php');
    }
}

function requireAdmin() {
    requireAuth();
    $role = $_SESSION['role'] ?? 'user';
    if ($role !== 'admin') {
        setFlash('error', 'No tienes permisos de administrador');
        redirect(APP_URL . '/menu.php');
    }
}

// ==========================================================
// FLASH MESSAGES
// ==========================================================

function setFlash($type, $message) {
    $_SESSION['flash'][$type] = $message;
}

function getFlash($type) {
    if (!isset($_SESSION['flash'][$type])) return null;
    $msg = $_SESSION['flash'][$type];
    unset($_SESSION['flash'][$type]);
    return $msg;
}

function hasFlash() {
    return !empty($_SESSION['flash']);
}

function getAllFlash() {
    $flash = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $flash;
}

function renderFlash() {
    $flash = getAllFlash();
    if (empty($flash)) return '';
    
    $icons = [
        'success' => '✓',
        'error'   => '✕',
        'warning' => '⚠',
        'info'    => 'ℹ'
    ];
    
    $html = '';
    foreach ($flash as $type => $msg) {
        $icon = $icons[$type] ?? '•';
        $html .= '<div class="alert alert-' . e($type) . '"><span class="alert-icon">' . $icon . '</span>' . e($msg) . '</div>';
    }
    return $html;
}

// ==========================================================
// UTILIDADES DE STRINGS
// ==========================================================

function str_random($length = 16) {
    return substr(bin2hex(random_bytes($length)), 0, $length);
}

function str_slug($text) {
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}

function str_limit($text, $limit = 100, $end = '...') {
    if (mb_strlen($text) <= $limit) return $text;
    return mb_substr($text, 0, $limit - mb_strlen($end)) . $end;
}

function str_initials($name) {
    $parts = preg_split('/\s+/', trim($name));
    $initials = '';
    foreach (array_slice($parts, 0, 2) as $p) {
        $initials .= mb_strtoupper(mb_substr($p, 0, 1));
    }
    return $initials ?: '?';
}

if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('str_ends_with')) {
    function str_ends_with($haystack, $needle) {
        $length = strlen($needle);
        return $length === 0 || substr($haystack, -$length) === $needle;
    }
}

if (!function_exists('str_contains')) {
    function str_contains($haystack, $needle) {
        return $needle === '' || strpos($haystack, $needle) !== false;
    }
}

if (!function_exists('str_contains_any')) {
    function str_contains_any($haystack, array $needles) {
        foreach ($needles as $n) {
            if (stripos($haystack, $n) !== false) return true;
        }
        return false;
    }
}

// ==========================================================
// UTILIDADES DE FECHAS
// ==========================================================

function time_ago($datetime) {
    $timestamp = is_numeric($datetime) ? $datetime : strtotime($datetime);
    $diff = time() - $timestamp;
    
    if ($diff < 60)     return 'hace unos segundos';
    if ($diff < 3600)   return 'hace ' . floor($diff / 60) . ' min';
    if ($diff < 86400)  return 'hace ' . floor($diff / 3600) . ' h';
    if ($diff < 604800) return 'hace ' . floor($diff / 86400) . ' días';
    if ($diff < 2592000) return 'hace ' . floor($diff / 604800) . ' semanas';
    if ($diff < 31536000) return 'hace ' . floor($diff / 2592000) . ' meses';
    return 'hace ' . floor($diff / 31536000) . ' años';
}

function format_date($datetime, $format = 'd/m/Y') {
    if (!$datetime) return '—';
    $ts = is_numeric($datetime) ? $datetime : strtotime($datetime);
    return date($format, $ts);
}

function format_datetime($datetime, $format = 'd/m/Y H:i') {
    if (!$datetime) return '—';
    $ts = is_numeric($datetime) ? $datetime : strtotime($datetime);
    return date($format, $ts);
}

function format_duration($seconds) {
    $seconds = (int)$seconds;
    if ($seconds < 60)   return $seconds . 's';
    if ($seconds < 3600) return floor($seconds / 60) . 'm ' . ($seconds % 60) . 's';
    return floor($seconds / 3600) . 'h ' . floor(($seconds % 3600) / 60) . 'm';
}

function human_number($n) {
    if ($n < 1000)    return (string)$n;
    if ($n < 1000000) return round($n / 1000, 1) . 'K';
    return round($n / 1000000, 1) . 'M';
}

// ==========================================================
// UTILIDADES DE ARRAYS
// ==========================================================

function array_get($array, $key, $default = null) {
    if (isset($array[$key])) return $array[$key];
    if (strpos($key, '.') === false) return $default;
    
    foreach (explode('.', $key) as $segment) {
        if (!is_array($array) || !isset($array[$segment])) return $default;
        $array = $array[$segment];
    }
    return $array;
}

function array_group_by($array, $key) {
    $result = [];
    foreach ($array as $item) {
        $k = is_array($item) ? ($item[$key] ?? null) : ($item->$key ?? null);
        if ($k !== null) $result[$k][] = $item;
    }
    return $result;
}

function array_shuffle_assoc($array) {
    $keys = array_keys($array);
    shuffle($keys);
    $result = [];
    foreach ($keys as $k) $result[$k] = $array[$k];
    return $result;
}

// ==========================================================
// CÁLCULO DE NIVELES Y XP
// ==========================================================

function xp_for_level($level) {
    return (int)($level * $level * XP_PER_LEVEL / 2 + $level * 50);
}

function level_from_xp($totalXP) {
    $level = 1;
    while ($level < MAX_LEVEL && $totalXP >= xp_for_level($level)) {
        $totalXP -= xp_for_level($level);
        $level++;
    }
    return $level;
}

function xp_progress($currentXP, $level) {
    $needed = xp_for_level($level);
    $percent = $needed > 0 ? min(100, round(($currentXP / $needed) * 100, 1)) : 0;
    return [
        'current' => $currentXP,
        'needed'  => $needed,
        'percent' => $percent
    ];
}

function calc_lesson_xp($difficulty, $accuracy, $timeBonus = 0) {
    $base = XP_PER_LESSON_MIN;
    
    $multipliers = [
        'easy'   => 1.0,
        'medium' => 1.5,
        'hard'   => 2.0
    ];
    
    $mult = $multipliers[$difficulty] ?? 1.0;
    $accuracyBonus = $accuracy >= 90 ? 1.5 : ($accuracy >= 75 ? 1.2 : 1.0);
    
    return (int)round(($base + $timeBonus) * $mult * $accuracyBonus);
}

// ==========================================================
// UTILIDADES DE URL
// ==========================================================

function url($path = '') {
    return rtrim(APP_URL, '/') . '/' . ltrim($path, '/');
}

function asset($path) {
    return url('assets/' . ltrim($path, '/'));
}

function current_url() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    return $protocol . '://' . ($_SERVER['HTTP_HOST'] ?? '') . ($_SERVER['REQUEST_URI'] ?? '');
}

function current_page() {
    return basename($_SERVER['PHP_SELF'] ?? '', '.php');
}

function is_active($page) {
    return current_page() === $page ? 'active' : '';
}

function query_string(array $params = []) {
    $existing = $_GET;
    foreach ($params as $k => $v) {
        if ($v === null) unset($existing[$k]);
        else $existing[$k] = $v;
    }
    return http_build_query($existing);
}

// ==========================================================
// UPLOADS
// ==========================================================

function ensureDir($path) {
    if (!is_dir($path)) {
        if (!@mkdir($path, 0755, true)) return false;
    }
    return true;
}

function upload_image($file, $folder = 'avatars', $maxSize = null) {
    $maxSize = $maxSize ?? MAX_AVATAR_SIZE;
    
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'error' => 'Error al subir archivo'];
    }
    if ($file['size'] > $maxSize) {
        return ['success' => false, 'error' => 'Archivo muy grande (máx ' . ($maxSize / 1024 / 1024) . ' MB)'];
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!isset(ALLOWED_IMAGE_TYPES[$mime])) {
        return ['success' => false, 'error' => 'Formato no permitido (JPG, PNG, WEBP, GIF)'];
    }
    
    $ext      = ALLOWED_IMAGE_TYPES[$mime];
    $filename = date('Ymd_His') . '_' . str_random(8) . '.' . $ext;
    $dir      = UPLOADS_PATH . '/' . $folder;
    
    ensureDir($dir);
    
    $dest = $dir . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        return ['success' => false, 'error' => 'Error al guardar archivo'];
    }
    
    return [
        'success'  => true,
        'filename' => $filename,
        'path'     => 'uploads/' . $folder . '/' . $filename,
        'url'      => url('uploads/' . $folder . '/' . $filename)
    ];
}

function delete_upload($relativePath) {
    if (empty($relativePath)) return false;
    $full = BASE_PATH . '/' . ltrim($relativePath, '/');
    if (file_exists($full) && is_file($full)) return @unlink($full);
    return false;
}

// ==========================================================
// AVATARES
// ==========================================================

function avatar_url($user) {
    if (empty($user['avatar']) || $user['avatar'] === 'default.png') {
        $initial = str_initials($user['full_name'] ?? $user['username'] ?? '?');
        return url('assets/img/default-avatar.svg?i=' . urlencode($initial));
    }
    if (str_starts_with($user['avatar'], 'http')) return $user['avatar'];
    return url('uploads/avatars/' . $user['avatar']);
}

// ==========================================================
// DETECCIÓN DE DISPOSITIVO
// ==========================================================

function is_mobile() {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    return preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i', $ua) === 1;
}

function is_https() {
    return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}

// ==========================================================
// CÁLCULOS VARIOS
// ==========================================================

function percent($part, $total, $decimals = 0) {
    if ($total == 0) return 0;
    return round(($part / $total) * 100, $decimals);
}

function clamp($value, $min, $max) {
    return max($min, min($max, $value));
}

function avg(array $numbers) {
    if (empty($numbers)) return 0;
    return array_sum($numbers) / count($numbers);
}

// ==========================================================
// HELPERS DE PRESENTACIÓN
// ==========================================================

function difficulty_badge($difficulty) {
    $label = DIFFICULTY_LABELS[$difficulty] ?? $difficulty;
    $color = DIFFICULTY_COLORS[$difficulty] ?? '#7a92a8';
    $icon  = DIFFICULTY_ICONS[$difficulty] ?? '•';
    return '<span class="badge" style="background:' . e($color) . '20;color:' . e($color) . ';border:1px solid ' . e($color) . '50">' . $icon . ' ' . e($label) . '</span>';
}

function xp_bar($currentXP, $level, $showText = true) {
    $prog = xp_progress($currentXP, $level);
    $html = '<div class="xp-bar"><div class="xp-fill" style="width:' . $prog['percent'] . '%"></div></div>';
    if ($showText) {
        $html .= '<div class="xp-text">' . $prog['current'] . ' / ' . $prog['needed'] . ' XP</div>';
    }
    return $html;
}

function stat_box($icon, $value, $label, $color = 'primary') {
    return '<div class="stat-box">' .
        '<div class="stat-icon">' . $icon . '</div>' .
        '<div class="stat-value" style="color:var(--' . e($color) . ')">' . e($value) . '</div>' .
        '<div class="stat-label">' . e($label) . '</div>' .
    '</div>';
}

// ==========================================================
// DEBUG / DEV
// ==========================================================

function dd($var, $die = true) {
    echo '<pre style="background:#0a0e17;color:#00f0ff;padding:20px;border:1px solid #00f0ff;border-radius:8px;font-family:monospace;font-size:14px;overflow:auto;max-height:80vh">';
    var_dump($var);
    echo '</pre>';
    if ($die) die();
}

function debug_log($msg) {
    if (defined('APP_ENV') && APP_ENV === 'development') {
        logger()->debug($msg);
    }
}

// ==========================================================
// SANITIZACIÓN RÁPIDA (helper)
// NOTA: e() ya está en config/security.php, solo dejamos clean()
// ==========================================================

if (!function_exists('e')) {
    function e($str) {
        if (is_array($str)) return '';
        return htmlspecialchars((string)$str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}

if (!function_exists('clean')) {
    function clean($str) {
        return e(trim((string)$str));
    }
}

// ==========================================================
// DEPENDENCIAS OPCIONALES
// ==========================================================

if (file_exists(__DIR__ . '/../config/logger.php')) {
    require_once __DIR__ . '/../config/logger.php';
}

if (file_exists(__DIR__ . '/../config/cache.php')) {
    require_once __DIR__ . '/../config/cache.php';
}

?>