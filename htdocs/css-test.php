<?php
require_once __DIR__ . '/config/db.php';
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CSS Test</title>

<!-- Test 1: CSS inline directo -->
<style>
    body { background: #0a1220; color: #00d4ff; font-family: Arial; padding: 20px; }
    .box { padding: 20px; border: 2px solid #00d4ff; margin: 10px 0; border-radius: 12px; }
    .green { color: #00ff88; border-color: #00ff88; }
    .red { color: #ff3860; border-color: #ff3860; }
</style>

<!-- Test 2: CSS externo con URL absoluta -->
<link rel="stylesheet" href="<?= APP_URL ?>/assets/css/style.css">

<!-- Test 3: CSS externo con HTTPS forzado -->
<link rel="stylesheet" href="https://senix.unaux.com/assets/css/style.css">
</head>
<body>

<h1>SENIX - CSS Test</h1>

<div class="box green">
    <strong>✓ Test 1:</strong> Si ves este texto VERDE y con borde, el CSS inline funciona.<br>
    <small>Si NO es verde → el navegador está bloqueando estilos completamente.</small>
</div>

<div class="box red">
    <strong>Test 2:</strong> CSS externo (<?= APP_URL ?>/assets/css/style.css)<br>
    <small>Abre esta URL en el móvil directamente para ver si carga.</small>
</div>

<div class="box">
    <strong>Test 3:</strong> CSS externo HTTPS<br>
    <small>Verifica si el problema es HTTP vs HTTPS.</small>
</div>

<h2>Información del sistema:</h2>
<ul>
    <li><b>APP_URL:</b> <?= APP_URL ?></li>
    <li><b>User Agent:</b> <?= htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'N/A') ?></li>
    <li><b>HTTPS:</b> <?= isset($_SERVER['HTTPS']) ? 'Sí' : 'No' ?></li>
    <li><b>Host:</b> <?= $_SERVER['HTTP_HOST'] ?? 'N/A' ?></li>
</ul>

<hr style="margin: 30px 0; border-color: #00d4ff;">

<h2>Verificación de archivos CSS:</h2>
<?php
$cssFiles = [
    'assets/css/style.css',
    'assets/css/landing.css'
];
foreach ($cssFiles as $f) {
    $path = __DIR__ . '/' . $f;
    $exists = file_exists($path);
    $size = $exists ? filesize($path) : 0;
    $color = $exists ? '#00ff88' : '#ff3860';
    echo "<p style='color: $color'>";
    echo ($exists ? '✓' : '✗') . " $f";
    if ($exists) echo " (" . number_format($size) . " bytes)";
    echo "</p>";
}
?>

</body>
</html>