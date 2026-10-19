<?php
/**
 * ==========================================================
 * SignAI v2.0 — Configuración de Rate Limiting
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'ratelimit.php') {
    http_response_code(403);
    die('Acceso denegado');
}

const RATE_LIMITS = [
    'login'             => ['max' => 5,  'window' => 900],    // 5 intentos / 15 min
    'register'          => ['max' => 3,  'window' => 3600],   // 3 registros / hora
    'forgot_password'   => ['max' => 3,  'window' => 3600],   // 3 solicitudes / hora
    'reset_password'    => ['max' => 5,  'window' => 3600],   // 5 intentos / hora
    'detection_save'    => ['max' => 60, 'window' => 60],     // 60 detecciones / min
    'lesson_submit'     => ['max' => 30, 'window' => 60],     // 30 envíos / min
    'chat_message'      => ['max' => 20, 'window' => 60],     // 20 mensajes / min
    'search'            => ['max' => 30, 'window' => 60],     // 30 búsquedas / min
    'api_general'       => ['max' => 120,'window' => 60]      // 120 requests / min
];

/**
 * Verifica el rate limit según la acción configurada
 */
function checkRateLimit($action, $identifier = null) {
    if (!isset(RATE_LIMITS[$action])) {
        return ['allowed' => true];
    }
    
    $limit = RATE_LIMITS[$action];
    $identifier = $identifier ?? ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    
    return rate_limit(
        $action . '_' . $identifier,
        $limit['max'],
        $limit['window']
    );
}
?>