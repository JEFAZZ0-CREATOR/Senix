<?php
/**
 * ==========================================================
 * Senix v2.0 — Header global
 * ==========================================================
 */

if (!defined('APP_NAME')) {
    require_once __DIR__ . '/../config/db.php';
}

require_once __DIR__ . '/bootstrap.php';

$currentUser     = $auth->user();
$currentPage     = basename($_SERVER['PHP_SELF'], '.php');
$unreadCount     = $currentUser ? $notificationModel->countUnread((int)$currentUser['id']) : 0;
$userStats       = $currentUser ? $userModel->getStats((int)$currentUser['id']) : null;

$pageTitle = $pageTitle ?? ucfirst($currentPage);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="theme-color" content="#00f0ff">
    <meta name="description" content="<?= e(APP_DESCRIPTION) ?>">
    
    <title><?= e($pageTitle) ?> — Senix</title>
    
    <!-- PWA -->
    <link rel="manifest" href="<?= APP_URL ?>/manifest.json">
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/logo.svg') ?>">
    <link rel="apple-touch-icon" href="<?= asset('img/icon-192.png') ?>">
    
    <!-- Fuentes -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap" rel="stylesheet">
    
    <!-- Spline 3D -->
    <script type="module" src="https://cdn.spline.design/@splinetool/viewer@2.0.65/build/spline-viewer.js"></script>
    
    <!-- MediaPipe Hands -->
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
    
    <!-- CSS -->
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/animations.css') ?>">
    <?php if (isset($extraCSS)): foreach ((array)$extraCSS as $css): ?>
        <link rel="stylesheet" href="<?= asset('css/' . $css) ?>">
    <?php endforeach; endif; ?>
    
    <!-- Config JS -->
    <script>
        window.SENIX_CONFIG = {
            APP_URL: '<?= APP_URL ?>',
            APP_NAME: 'Senix',
            APP_VERSION: '<?= APP_VERSION ?>',
            USER_ID: <?= $currentUser ? (int)$currentUser['id'] : 'null' ?>,
            CSRF_TOKEN: '<?= csrf_token() ?>',
            IS_LOGGED_IN: <?= $currentUser ? 'true' : 'false' ?>,
            AI_CONFIDENCE_THRESHOLD: <?= AI_CONFIDENCE_THRESHOLD ?>
        };
    </script>
<link rel="stylesheet" href="<?= asset('css/learning-type.css') ?>"></head>
<body class="page-<?= e($currentPage) ?>" data-page="<?= e($currentPage) ?>">

<?php if ($currentUser): ?>
<nav class="navbar">
    <a href="<?= APP_URL ?>/menu.php" class="logo">
        <span class="logo-text">SENIX</span>
    </a>
    
    <nav class="nav-links">
        <a href="<?= APP_URL ?>/menu.php" class="nav-link <?= $currentPage === 'menu' ? 'active' : '' ?>">
            <span class="nav-icon">🏠</span> Inicio
        </a>
        <a href="<?= APP_URL ?>/dictionary.php" class="nav-link <?= $currentPage === 'dictionary' ? 'active' : '' ?>">
            <span class="nav-icon">🔤</span> Abecedario
        </a>
        <a href="<?= APP_URL ?>/words.php" class="nav-link <?= $currentPage === 'words' ? 'active' : '' ?>">
            <span class="nav-icon">📚</span> Palabras
        </a>
        <a href="<?= APP_URL ?>/lessons.php" class="nav-link <?= $currentPage === 'lessons' ? 'active' : '' ?>">
            <span class="nav-icon">🎓</span> Lecciones
        </a>
        <a href="<?= APP_URL ?>/simulator.php" class="nav-link <?= $currentPage === 'simulator' ? 'active' : '' ?>">
            <span class="nav-icon">💬</span> Simulador
        </a>
        <a href="<?= APP_URL ?>/practice.php" class="nav-link <?= $currentPage === 'practice' ? 'active' : '' ?>">
            <span class="nav-icon">🎯</span> Práctica
        </a>
    </nav>
    
    <div class="user-menu">
        <a href="<?= APP_URL ?>/notifications.php" class="nav-icon-btn" title="Notificaciones">
            <span class="icon-bell">🔔</span>
            <?php if ($unreadCount > 0): ?>
                <span class="notif-badge"><?= $unreadCount > 99 ? '99+' : $unreadCount ?></span>
            <?php endif; ?>
        </a>
        
        <?php if ($userStats): ?>
        <div class="user-stat" title="Nivel <?= (int)$userStats['level'] ?>">
            <span class="stat-icon">⭐</span>
            <span class="stat-value"><?= (int)$userStats['level'] ?></span>
        </div>
        <div class="user-stat" title="Racha de <?= (int)$userStats['streak'] ?> días">
            <span class="stat-icon">🔥</span>
            <span class="stat-value"><?= (int)$userStats['streak'] ?></span>
        </div>
        <?php endif; ?>
        
        <div class="user-dropdown">
            <button class="user-btn" onclick="toggleUserMenu()">
                <div class="avatar-mini">
                    <?php if (!empty($currentUser['avatar']) && $currentUser['avatar'] !== 'default.png'): ?>
                        <img src="<?= avatar_url($currentUser) ?>" alt="">
                    <?php else: ?>
                        <span><?= str_initials($currentUser['username']) ?></span>
                    <?php endif; ?>
                </div>
                <span class="username"><?= e($currentUser['username']) ?></span>
                <span class="arrow">▾</span>
            </button>
            
            <div class="dropdown-menu" id="user-dropdown-menu">
                <a href="<?= APP_URL ?>/profile.php" class="dropdown-item">
                    <span>👤</span> Mi Perfil
                </a>
                <a href="<?= APP_URL ?>/dashboard.php" class="dropdown-item">
                    <span>📊</span> Panel
                </a>
                <a href="<?= APP_URL ?>/achievements.php" class="dropdown-item">
                    <span>🏆</span> Logros
                </a>
                <a href="<?= APP_URL ?>/ranking.php" class="dropdown-item">
                    <span>🥇</span> Ranking
                </a>
                <?php if ($auth->isAdmin()): ?>
                <div class="dropdown-divider"></div>
                <a href="<?= APP_URL ?>/admin/" class="dropdown-item admin-item">
                    <span>⚙️</span> Administración
                </a>
                <?php endif; ?>
                <div class="dropdown-divider"></div>
                <a href="<?= APP_URL ?>/settings.php" class="dropdown-item">
                    <span>⚙️</span> Ajustes
                </a>
                <a href="<?= APP_URL ?>/logout.php" class="dropdown-item danger">
                    <span>🚪</span> Cerrar Sesión
                </a>
            </div>
        </div>
    </div>
</nav>
<?php endif; ?>

<?php if ($flashHTML = renderFlash()): ?>
<div class="flash-container">
    <?= $flashHTML ?>
</div>
<?php endif; ?>

<main class="main-content">


