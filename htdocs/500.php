<?php
http_response_code(500);
require_once __DIR__ . '/config/db.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>500 — Senix</title>
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/logo.svg') ?>">
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
<link rel="stylesheet" href="<?= asset('css/learning-type.css') ?>"></head>
<body class="page-error">
<div class="error-wrapper">
    <div class="error-code glitch" data-text="500">500</div>
    <h1 class="error-title">ERROR INTERNO</h1>
    <p class="error-desc">Algo salió mal en nuestro sistema. Estamos trabajando en ello.</p>
    <a href="<?= APP_URL ?>/menu.php" class="btn btn-primary">Volver al inicio</a>
</div>
</body>
</html>

