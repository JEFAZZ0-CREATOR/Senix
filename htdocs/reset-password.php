<?php
/**
 * Senix v2.0 — Reset Password
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/bootstrap.php';

if ($auth->isLoggedIn()) redirect(APP_URL . '/menu.php');

$token = $_GET['token'] ?? $_POST['token'] ?? '';
$error = '';
$success = false;

if (empty($token)) {
    $error = 'Token no proporcionado';
} else {
    // Verificar token
    $stmt = $pdo->prepare(
        "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1"
    );
    $stmt->execute([$token]);
    $reset = $stmt->fetch();
    
    if (!$reset) {
        $error = 'Token inválido o expirado';
    } elseif (isPost()) {
        if (!csrf_verify()) {
            $error = 'Token de seguridad inválido';
        } else {
            $password = $_POST['password'] ?? '';
            $confirm  = $_POST['password_confirm'] ?? '';
            
            if ($password !== $confirm) {
                $error = 'Las contraseñas no coinciden';
            } elseif (strlen($password) > 72) {
                $error = 'La contraseña no puede superar 72 bytes. Usa una frase más corta.';
            } else {
                $result = $auth->resetPassword($token, $password);
                
                if ($result['success']) {
                    $success = true;
                } else {
                    $error = $result['error'];
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
    <title>Nueva Contraseña — Senix</title>
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/logo.svg') ?>">
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/auth.css') ?>">
<link rel="stylesheet" href="<?= asset('css/learning-type.css') ?>"></head>
<body class="page-reset">
<div class="auth-wrapper auth-wrapper-single">
    <div class="auth-form-side">
        <a href="<?= APP_URL ?>/index.php" class="auth-logo"><span class="logo-text">SENIX</span></a>
        
        <div class="auth-form">
            <?php if ($success): ?>
                <div class="auth-header">
                    <h1 class="auth-title">¡LISTO!</h1>
                    <p class="auth-subtitle">Contraseña actualizada correctamente</p>
                </div>
                <a href="<?= APP_URL ?>/login.php" class="btn btn-primary btn-block btn-lg">Iniciar Sesión</a>
            <?php elseif ($error): ?>
                <div class="auth-header"><h1 class="auth-title">ERROR</h1></div>
                <div class="alert alert-error"><?= e($error) ?></div>
                <a href="<?= APP_URL ?>/forgot-password.php" class="btn btn-primary btn-block">Solicitar nuevo enlace</a>
            <?php else: ?>
                <div class="auth-header">
                    <h1 class="auth-title">NUEVA CONTRASEÑA</h1>
                    <p class="auth-subtitle">Elige una contraseña segura</p>
                </div>
                <form method="POST" autocomplete="on" data-auth-form id="reset-password-form">
                    <?= csrf_field() ?>
                    <input type="hidden" name="token" value="<?= e($token) ?>">
                    
                    <div class="form-group">
                        <label for="password">Nueva contraseña</label>
                        <div class="input-wrapper"><input type="password" id="password" name="password" class="form-control" required minlength="8" maxlength="72" autocomplete="new-password" autofocus><button type="button" class="input-toggle" data-toggle-password="password" aria-label="Mostrar contraseña" aria-pressed="false"><span aria-hidden="true">◉</span></button></div>
                        <small class="input-hint">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="password_confirm">Confirmar contraseña</label>
                        <div class="input-wrapper"><input type="password" id="password_confirm" name="password_confirm" class="form-control" required minlength="8" maxlength="72" autocomplete="new-password" data-confirm-password="password"><button type="button" class="input-toggle" data-toggle-password="password_confirm" aria-label="Mostrar contraseña" aria-pressed="false"><span aria-hidden="true">◉</span></button></div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit" data-submit-button>Actualizar contraseña</button>
                </form>
            <?php endif; ?>
        </div>
    </div>
</div>
<script src="<?= asset('js/auth.js') ?>" defer></script>
</body>
</html>

