<?php
/**
 * SignAI v2.0 — Logout
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/bootstrap.php';

$userId = $auth->id();

$auth->logout();

if ($userId) {
    log_security_event('logout', ['user_id' => $userId]);
}

session_start();
setFlash('info', 'Has cerrado sesión correctamente');
redirect(APP_URL . '/login.php');
?>