<?php
/**
 * ==========================================================
 * Senix v2.0 — Mailer
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Mailer.php') die('Acceso denegado');

class Mailer {
    private string $templatePath;
    
    public function __construct() {
        $this->templatePath = defined('MAIL_TEMPLATE_PATH') 
            ? MAIL_TEMPLATE_PATH 
            : BASE_PATH . '/templates';
    }
    
    // ==========================================================
    // MÉTODOS ESPECÍFICOS
    // ==========================================================
    
    public function sendWelcome(array $user): bool {
        return $this->send(
            $user['email'],
            '¡Bienvenido a Senix, ' . $user['username'] . '!',
            'welcome',
            [
                'username'   => $user['username'],
                'full_name'  => $user['full_name'] ?? $user['username'],
                'app_name'   => 'Senix',
                'app_url'    => APP_URL,
                'year'       => date('Y')
            ]
        );
    }
    
    public function sendPasswordReset(array $user, string $token): bool {
        $resetLink = APP_URL . '/reset-password.php?token=' . urlencode($token);
        
        return $this->send(
            $user['email'],
            'Recuperación de contraseña — Senix',
            'reset-password',
            [
                'username'   => $user['username'],
                'reset_link' => $resetLink,
                'expires_in' => '1 hora',
                'app_name'   => 'Senix',
                'app_url'    => APP_URL,
                'year'       => date('Y')
            ]
        );
    }
    
    public function sendEmailVerification(array $user, string $token): bool {
        $verifyLink = APP_URL . '/verify-email.php?token=' . urlencode($token);
        
        return $this->send(
            $user['email'],
            'Verifica tu email — Senix',
            'verify-email',
            [
                'username'    => $user['username'],
                'verify_link' => $verifyLink,
                'app_name'    => 'Senix',
                'app_url'     => APP_URL,
                'year'        => date('Y')
            ]
        );
    }
    
    public function sendNotification(array $user, array $notification): bool {
        return $this->send(
            $user['email'],
            $notification['title'],
            'notification',
            [
                'username'    => $user['username'],
                'title'       => $notification['title'],
                'message'     => $notification['message'],
                'icon'        => $notification['icon'] ?? '📢',
                'link'        => APP_URL . ($notification['link'] ?? '/menu.php'),
                'app_name'    => 'Senix',
                'year'        => date('Y')
            ]
        );
    }
    
    // ==========================================================
    // MÉTODO PRINCIPAL
    // ==========================================================
    
    private function send(string $to, string $subject, string $template, array $vars = []): bool {
        if (!MAIL_ENABLED) {
            if (defined('APP_ENV') && APP_ENV === 'development') {
                logger()->info('[Mailer] Email simulado', [
                    'to'       => $to,
                    'subject'  => $subject,
                    'template' => $template,
                    'vars'     => array_keys($vars)
                ]);
            }
            return false;
        }
        
        // Validación básica
        if (!validate_email($to)) {
            logger()->warning('[Mailer] Email inválido', ['to' => $to]);
            return false;
        }
        
        // Renderizar template
        $html = $this->renderTemplate($template, $vars);
        if (empty($html)) {
            logger()->error('[Mailer] Template no encontrado', ['template' => $template]);
            return false;
        }
        
        // Headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: Senix <' . MAIL_FROM_ADDRESS . '>',
            'Reply-To: ' . MAIL_FROM_ADDRESS,
            'X-Mailer: Senix/' . APP_VERSION,
            'X-Priority: 3'
        ];
        
        $subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        
        try {
            $sent = @mail(
                $to,
                $subjectEncoded,
                $html,
                implode("\r\n", $headers)
            );
            
            if ($sent) {
                logger()->info('[Mailer] Email enviado', ['to' => $to, 'subject' => $subject]);
            } else {
                logger()->error('[Mailer] Error al enviar', ['to' => $to]);
            }
            
            return $sent;
        } catch (Exception $e) {
            logger()->error('[Mailer] Excepción', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    // ==========================================================
    // RENDERIZADO DE PLANTILLA
    // ==========================================================
    
    private function renderTemplate(string $template, array $vars = []): string {
        $file = $this->templatePath . '/' . $template . '.html';
        
        // Buscar en templates/ o usar fallback
        if (!file_exists($file)) {
            return $this->renderFallback($vars);
        }
        
        $html = file_get_contents($file);
        if ($html === false) return '';
        
        // Valores por defecto
        $defaults = [
            'app_name'    => 'Senix',
            'app_url'     => APP_URL,
            'app_version' => APP_VERSION,
            'year'        => date('Y'),
            'primary'     => '#00f0ff',
            'secondary'   => '#b026ff'
        ];
        
        $vars = array_merge($defaults, $vars);
        
        // Reemplazar variables
        foreach ($vars as $key => $value) {
            $html = str_replace('{{' . $key . '}}', (string)$value, $html);
        }
        
        // Remover variables no reemplazadas
        $html = preg_replace('/\{\{[a-z_]+\}\}/i', '', $html);
        
        return $html;
    }
    
    private function renderFallback(array $vars): string {
        $title   = $vars['title'] ?? $vars['subject'] ?? 'Notificación';
        $message = $vars['message'] ?? $vars['body'] ?? '';
        $appName = $vars['app_name'] ?? 'Senix';
        $year    = date('Y');
        
        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>{$title}</title>
</head>
<body style="margin:0;padding:40px 20px;background:#0a0e17;font-family:Arial,sans-serif;color:#e0f7ff;">
<div style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#0a0e17,#131823);border:1px solid #00f0ff50;border-radius:16px;padding:40px;">
    <h1 style="color:#00f0ff;margin:0 0 20px;font-size:24px;letter-spacing:2px;">{$appName}</h1>
    <h2 style="color:#e0f7ff;margin:0 0 20px;font-size:20px;">{$title}</h2>
    <p style="color:#7a92a8;line-height:1.7;font-size:15px;">{$message}</p>
    <hr style="border:none;border-top:1px solid #00f0ff30;margin:30px 0;">
    <p style="color:#7a92a8;font-size:12px;text-align:center;margin:0;">© {$year} {$appName}. Todos los derechos reservados.</p>
</div>
</body>
</html>
HTML;
    }
}
?>
