<?php
/**
 * ==========================================================
 * SignAI v2.0 — Configuración de Email
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'mail.php') {
    http_response_code(403);
    die('Acceso denegado');
}

// SMTP (por si usas Gmail, SendGrid, etc.)
define('MAIL_ENABLED',      false);   // Cambia a true cuando configures
define('MAIL_HOST',         'smtp.gmail.com');
define('MAIL_PORT',         587);
define('MAIL_USERNAME',     'tu-correo@gmail.com');
define('MAIL_PASSWORD',     'tu-password-app');
define('MAIL_ENCRYPTION',   'tls');
define('MAIL_FROM_ADDRESS', 'noreply@senix.unaux.com');
define('MAIL_FROM_NAME',    'SignAI');

// Emails de administración
define('ADMIN_EMAIL',       'admin@senix.unaux.com');
define('SUPPORT_EMAIL',     'soporte@senix.unaux.com');

// Plantillas
define('MAIL_TEMPLATE_PATH', BASE_PATH . '/templates');

/**
 * Envía un email (usa mail() nativo como fallback)
 */
function sendEmail($to, $subject, $body, $isHTML = true) {
    if (!MAIL_ENABLED) {
        if (defined('APP_ENV') && APP_ENV === 'development') {
            logger()->info('Email simulado', ['to' => $to, 'subject' => $subject]);
        }
        return false;
    }
    
    // Intentar con SMTP nativo si está disponible
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: ' . ($isHTML ? 'text/html' : 'text/plain') . '; charset=UTF-8';
    $headers[] = 'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM_ADDRESS . '>';
    $headers[] = 'Reply-To: ' . MAIL_FROM_ADDRESS;
    $headers[] = 'X-Mailer: SignAI/' . (defined('APP_VERSION') ? APP_VERSION : '2.0');
    
    $subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    
    return @mail($to, $subject, $body, implode("\r\n", $headers));
}

/**
 * Renderiza una plantilla de email
 */
function renderEmailTemplate($template, $vars = []) {
    $file = MAIL_TEMPLATE_PATH . '/' . $template . '.html';
    if (!file_exists($file)) return '';
    
    $html = file_get_contents($file);
    foreach ($vars as $key => $value) {
        $html = str_replace('{{' . $key . '}}', $value, $html);
    }
    return $html;
}
?>