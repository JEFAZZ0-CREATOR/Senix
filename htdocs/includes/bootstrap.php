<?php
/**
 * ==========================================================
 * SignAI v2.0 — Bootstrap (carga de dependencias)
 * Incluir este archivo en TODAS las páginas
 * ==========================================================
 */

if (!defined('APP_NAME')) {
    require_once __DIR__ . '/../config/db.php';
}

// Cargar modelos
$modelsDir = __DIR__;
$models = [
    'User.php',
    'Auth.php',
    'Lesson.php',
    'Progress.php',
    'Achievement.php',
    'Notification.php',
    'Chat.php',
    'Tournament.php',
    'Mailer.php',
    'Validator.php',
    'TwoFactor.php',
    'Uploader.php',
    'Cache.php',
    'RateLimiter.php'
];

foreach ($models as $file) {
    $path = $modelsDir . '/' . $file;
    if (file_exists($path)) {
        require_once $path;
    }
}

// ==========================================================
// INSTANCIAS GLOBALES (singleton pattern)
// ==========================================================

if (!isset($userModel))       $userModel       = new User($pdo);
if (!isset($auth))            $auth            = new Auth($pdo);
if (!isset($lessonModel))     $lessonModel     = new Lesson($pdo);
if (!isset($progressModel))   $progressModel   = new Progress($pdo);
if (!isset($achievementModel))$achievementModel= new Achievement($pdo);
if (!isset($notificationModel))$notificationModel = new Notification($pdo);
if (!isset($chatModel))       $chatModel       = new Chat($pdo);
if (!isset($tournamentModel)) $tournamentModel = new Tournament($pdo);
if (!isset($mailer))          $mailer          = new Mailer();

// ==========================================================
// HELPERS DE USUARIO ACTUAL
// ==========================================================

if (!function_exists('currentUser')) {
    function currentUser(): ?array {
        global $auth;
        return $auth->user();
    }
}

if (!function_exists('currentUserId')) {
    function currentUserId(): ?int {
        global $auth;
        return $auth->id();
    }
}

if (!function_exists('isLoggedIn')) {
    function isLoggedIn(): bool {
        global $auth;
        return $auth->isLoggedIn();
    }
}

if (!function_exists('isAdmin')) {
    function isAdmin(): bool {
        global $auth;
        return $auth->isAdmin();
    }
}

// ==========================================================
// UNREAD NOTIFICATIONS (para navbar)
// ==========================================================

if (!function_exists('unreadNotificationsCount')) {
    function unreadNotificationsCount(): int {
        if (!isLoggedIn()) return 0;
        global $notificationModel;
        return $notificationModel->countUnread(currentUserId());
    }
}
?>