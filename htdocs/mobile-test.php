<?php
require_once __DIR__ . '/config/db.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mobile Test — SENIX</title>

<link rel="stylesheet" href="<?= APP_URL ?>/assets/css/style.css">
<link rel="stylesheet" href="<?= APP_URL ?>/assets/css/landing.css">

<style>
.debug-box {
    background: #0a1220;
    color: #00d4ff;
    padding: 20px;
    margin: 10px;
    border: 2px solid #00d4ff;
    border-radius: 12px;
    font-family: monospace;
    font-size: 14px;
}
.ok  { color: #00ff88; border-color: #00ff88; }
.err { color: #ff3860; border-color: #ff3860; }
</style>
</head>
<body>

<div class="debug-box ok">
    <h2>TEST MOBILE</h2>
    <p>Si ves este cuadro con borde AZUL y fondo oscuro → el CSS base se carga.</p>
    <p><b>APP_URL:</b> <?= APP_URL ?></p>
    <p><b>User-Agent:</b> <?= htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'N/A') ?></p>
    <p><b>HTTPS:</b> <?= isset($_SERVER['HTTPS']) ? 'Sí' : 'No' ?></p>
    <p><b>Host:</b> <?= $_SERVER['HTTP_HOST'] ?? 'N/A' ?></p>
    <p><b>REQUEST_URI:</b> <?= $_SERVER['REQUEST_URI'] ?? 'N/A' ?></p>
</div>

<!-- Test navbar que usa senix-nav del style.css -->
<nav class="navbar" style="position: relative; margin: 20px 10px;">
    <a href="#" class="logo"><span class="logo-text">SENIX</span></a>
    <nav>
        <a href="#">Test</a>
    </nav>
</nav>

<!-- Test botón que usa .btn del style.css -->
<div style="padding: 20px;">
    <a href="#" class="btn btn-primary">BOTÓN PRIMARIO</a>
    <a href="#" class="btn btn-outline" style="margin-left: 10px;">BOTÓN OUTLINE</a>
</div>

<!-- Test feature card que usa .feature-card del landing.css -->
<section style="padding: 20px;">
    <h2 style="color: #00d4ff;">Feature Card Test</h2>
    <div class="feature-card" style="min-height: 200px; max-width: 400px; margin: 0 auto;">
        <div class="feature-content">
            <div class="feature-icon" style="width: 50px; height: 50px; background: #00d4ff20; border: 1px solid #00d4ff; border-radius: 12px; margin-bottom: 15px;"></div>
            <h3 style="color: #00d4ff;">Card Test</h3>
            <p>Si esta card tiene fondo oscuro glass y borde azul, el landing.css funciona.</p>
        </div>
    </div>
</section>

<!-- Test loader -->
<div class="landing-loader" id="loader" style="position: fixed; bottom: 20px; right: 20px; inset: auto; width: 80px; height: 80px; background: #000; border-radius: 50%;">
    <div class="loader-ring" style="width: 40px; height: 40px;"></div>
</div>

<script>
// Test JS
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Mobile Test] JS funcionando');
    console.log('[Mobile Test] Window width:', window.innerWidth);
    console.log('[Mobile Test] Device pixel ratio:', window.devicePixelRatio);
    console.log('[Mobile Test] CSS navbar display:', getComputedStyle(document.querySelector('.navbar')).display);
    console.log('[Mobile Test] CSS navbar background:', getComputedStyle(document.querySelector('.navbar')).backgroundColor);
});
</script>

</body>
</html>