<?php
http_response_code(404);
require_once __DIR__ . '/config/db.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 — Senix</title>
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/logo.svg') ?>">
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/animations.css') ?>">
<link rel="stylesheet" href="<?= asset('css/learning-type.css') ?>"></head>
<body class="page-error">
<div class="error-wrapper">
    <div class="error-code glitch" data-text="404">404</div>
    <h1 class="error-title">PÁGINA NO ENCONTRADA</h1>
    <p class="error-desc">La señal que buscas se ha perdido en el espacio digital.</p>
    <div class="error-actions">
        <a href="<?= APP_URL ?>/menu.php" class="btn btn-primary">Volver al inicio</a>
        <a href="<?= APP_URL ?>/dictionary.php" class="btn btn-outline">Explorar diccionario</a>
    </div>
</div>
</body>
</html>

