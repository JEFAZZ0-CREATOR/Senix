<?php
/**
 * ==========================================================
 * SignAI v2.0 — Configuración de Base de Datos
 * Hosting: Ezyro (unaux)
 * Dominio: senix.unaux.com
 * ==========================================================
 */

// Previene acceso directo por URL
if (basename($_SERVER['PHP_SELF']) === 'db.php') {
    http_response_code(403);
    die('Acceso denegado');
}

// La configuración local se carga desde .env. No guardes credenciales en el código.
require_once __DIR__ . '/env.php';
loadEnv(dirname(__DIR__) . '/.env');

// ==========================================================
// CREDENCIALES DE BASE DE DATOS (Ezyro)
// ==========================================================
define('DB_HOST', 'sql311.ezyro.com');
define('DB_USER', 'ezyro_43065375');
define('DB_PASS', '71acad9ff220');
define('DB_NAME', 'ezyro_43065375_signai');
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', 3306);

// ==========================================================
// CONFIGURACIÓN GENERAL DE LA APP
// ==========================================================
define('APP_NAME',        'SENIX');
define('APP_VERSION',     '2.0.0');
define('APP_DESCRIPTION', 'Sistema de Aprendizaje de Lengua de Señas con IA');
define('APP_URL', 'https://senix.unaux.com');
define('APP_ENV', 'production');

// Rutas del sistema
define('BASE_PATH',       dirname(__DIR__));
define('UPLOADS_PATH',    BASE_PATH . '/uploads');
define('AVATARS_PATH',    UPLOADS_PATH . '/avatars');
define('LOGS_PATH',       BASE_PATH . '/logs');
define('CACHE_PATH',      BASE_PATH . '/cache');

// ==========================================================
// CONFIGURACIÓN DE SESIONES
// ==========================================================
define('SESSION_LIFETIME',    86400);       // 24 horas
define('SESSION_NAME',        'SIGNAI_SESS');
define('SESSION_REGENERATE',  300);         // Regenerar ID cada 5 min

// ==========================================================
// CONFIGURACIÓN DE IA / DETECCIÓN
// ==========================================================
define('AI_CONFIDENCE_THRESHOLD', 0.75);
define('AI_MIN_HAND_SCORE',       0.6);
define('AI_FPS_TARGET',           30);
define('AI_MAX_HANDS',            2);
define('AI_STABLE_FRAMES',        8);       // Frames para confirmar seña

// ==========================================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================================
define('BCRYPT_COST',          10);
define('LOGIN_MAX_ATTEMPTS',   5);
define('LOGIN_LOCKOUT_TIME',   900);        // 15 min
define('CSRF_TOKEN_LIFETIME',  3600);       // 1 hora

// ==========================================================
// CONFIGURACIÓN DE GAMIFICACIÓN
// ==========================================================
define('XP_PER_LESSON_MIN',    10);
define('XP_PER_LEVEL',         100);
define('XP_PER_STREAK_DAY',    5);
define('MAX_LEVEL',            100);

// ==========================================================
// ZONA HORARIA Y LOCALE
// ==========================================================
date_default_timezone_set('America/Mexico_City');

// ==========================================================
// MANEJO DE ERRORES SEGÚN ENTORNO
// ==========================================================
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    if (!is_dir(LOGS_PATH)) @mkdir(LOGS_PATH, 0755, true);
    ini_set('error_log', LOGS_PATH . '/error.log');
}

// ==========================================================
// SESIÓN SEGURA
// ==========================================================
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
    
    session_name(SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path'     => '/',
        'domain'   => '',
        'secure'   => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    @session_start();
}

// Regenerar ID de sesión periódicamente (anti session fixation)
if (!isset($_SESSION['_last_regen'])) {
    $_SESSION['_last_regen'] = time();
} elseif (time() - $_SESSION['_last_regen'] > SESSION_REGENERATE) {
    session_regenerate_id(true);
    $_SESSION['_last_regen'] = time();
}

// ==========================================================
// CONEXIÓN PDO A MySQL
// ==========================================================
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );
    
    $pdoOptions = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_PERSISTENT         => false,
        PDO::ATTR_TIMEOUT            => 15,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE utf8mb4_unicode_ci"
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $pdoOptions);
    
} catch (PDOException $e) {
    error_log('[SignAI DB Error] ' . $e->getMessage());
    
    if (APP_ENV === 'development') {
        die('Error de conexión: ' . $e->getMessage());
    }
    
    http_response_code(503);
    die('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Servicio no disponible</title>
    <style>
        body{font-family:sans-serif;background:#0a0e17;color:#ff3860;
             display:flex;align-items:center;justify-content:center;
             min-height:100vh;margin:0;padding:20px;}
        .box{text-align:center;padding:50px 40px;border:2px solid #ff3860;
             border-radius:16px;background:rgba(255,56,96,0.05);max-width:600px;}
        h1{margin:0 0 20px;font-size:1.6rem;letter-spacing:2px;}
        p{line-height:1.8;color:#e0f7ff;}
        code{background:#000;padding:4px 10px;border-radius:4px;color:#00f0ff;font-family:monospace;}
        .icon{font-size:4rem;margin-bottom:20px;}
    </style></head><body>
    <div class="box">
        <div class="icon">⚠️</div>
        <h1>SERVICIO TEMPORALMENTE NO DISPONIBLE</h1>
        <p>No se pudo conectar a la base de datos.</p>
        <p>Estamos trabajando para restaurar el servicio.</p>
    </div></body></html>');
}

// ==========================================================
// SQL MODE Y TIMEZONE
// ==========================================================
try {
    $pdo->exec("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
    // Las marcas de tiempo se guardan en UTC; cada usuario conserva su zona horaria local.
    $pdo->exec("SET time_zone = '+00:00'");
} catch (PDOException $e) {
    // Silencioso, no crítico
}

// ==========================================================
// CARGAR DEPENDENCIAS
// ==========================================================
require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/../includes/functions.php';
?>
