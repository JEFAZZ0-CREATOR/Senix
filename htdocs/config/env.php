<?php
/**
 * ==========================================================
 * SignAI v2.0 — Cargador de variables de entorno
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'env.php') {
    http_response_code(403);
    die('Acceso denegado');
}

/**
 * Carga un archivo .env si existe
 */
function loadEnv($path = null) {
    $path = $path ?? BASE_PATH . '/.env';
    if (!file_exists($path)) return false;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        
        list($key, $value) = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        
        if (!empty($key) && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
    return true;
}

/**
 * Obtiene una variable de entorno con default
 */
function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) return $default;
    
    switch (strtolower($value)) {
        case 'true':  case '(true)':  return true;
        case 'false': case '(false)': return false;
        case 'null':  case '(null)':  return null;
        case 'empty': case '(empty)': return '';
    }
    return $value;
}
?>