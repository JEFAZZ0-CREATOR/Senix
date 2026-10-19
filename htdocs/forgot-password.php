<?php
/**
 * Senix v2.0 — Forgot Password
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/bootstrap.php';

if ($auth->isLoggedIn()) redirect(APP_URL . '/menu.php');

$message = '';
$error = '';
$sent = false;

if (isPost()) {
    if (!csrf_verify()) {
        $error = 'Token inválido';
    } else {
        $email = trim($_POST['email'] ?? '');
        
        if (!validate_email($email)) {
            $error = 'Email inválido';
        } else {
            $rateCheck = rate_limit('forgot_' . ($_SERVER['REMOTE_ADDR'] ?? ''), 3, 3600);
            
            if (!$rateCheck['allowed']) {
                $error = 'Demasiados intentos. Intenta en una hora.';
            } else {
                $result = $auth->requestPasswordReset($email);
                
                if ($result['success']) {
                    if (isset($result['token'])) {
                        $mailer->sendPasswordReset($result['user'], $result['token']);
                    }
                    
                    $sent = true;
                    $message = 'Si el email existe, recibirás un enlace de recuperación.';
                } else {
                    $error = $result['error'] ?? 'Error al procesar';
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña — Senix</title>
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/logo.svg') ?>">
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/auth.css') ?>">
</head>
<body class="page-forgot">
<div class="auth-wrapper auth-wrapper-single">
    <div class="auth-form-side">
        <a href="<?= APP_URL ?>/index.php" class="auth-logo"><span class="logo-text">SENIX</span></a>
        
        <div class="auth-form">
            <div class="auth-header">
                <h1 class="auth-title">RECUPERAR</h1>
                <p class="auth-subtitle">Te enviaremos un enlace a tu email</p>
            </div>
            
            <?php if ($error): ?>
                <div class="alert alert-error"><span><?= e($error) ?></span></div>
            <?php endif; ?>
            
            <?php if ($sent): ?>
                <div class="alert alert-success">
                    <span class="alert-icon">✓</span>
                    <span><?= e($message) ?></span>
                </div>
                <a href="<?= APP_URL ?>/login.php" class="btn btn-primary btn-block">Volver al login</a>
            <?php else: ?>
                <form method="POST" autocomplete="on" data-auth-form>
                    <?= csrf_field() ?>
                    <div class="form-group">
                        <label for="email">Tu Email</label>
                        <div class="input-wrapper">
                            <span class="input-icon">✉</span>
                            <input type="email" id="email" name="email" class="form-control" 
                                   placeholder="tu@email.com" required autofocus maxlength="254" autocomplete="email" inputmode="email" autocapitalize="none">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit" data-submit-button>
                        Enviar enlace de recuperación
                    </button>
                </form>
                <p class="auth-footer-text">
                    <a href="<?= APP_URL ?>/login.php">← Volver al login</a>
                </p>
            <?php endif; ?>
        </div>
    </div>
</div>
<script src="<?= asset('js/auth.js') ?>" defer></script>
</body>
</html>