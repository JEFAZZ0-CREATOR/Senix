<?php require_once __DIR__ . '/config/db.php'; ?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mobile Check</title>
<link rel="stylesheet" href="<?= APP_URL ?>/assets/css/style.css">
<link rel="stylesheet" href="<?= APP_URL ?>/assets/css/landing.css">
<style>
    body { background: #030710; color: #f0f8ff; font-family: monospace; padding: 20px; }
    .check { padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid; }
    .ok  { color: #00ff88; border-color: #00ff88; background: rgba(0,255,136,0.1); }
    .bad { color: #ff3860; border-color: #ff3860; background: rgba(255,56,96,0.1); }
    .info { color: #00a8ff; border-color: #00a8ff; background: rgba(0,168,255,0.1); }
</style>
</head>
<body>

<h2>CHECK MÓVIL</h2>

<div class="check ok">
    <strong>PASO 1:</strong> ¿Ves este texto en VERDE? → CSS inline OK
</div>

<!-- Probar la navbar real de tu style.css -->
<nav class="navbar" style="position:relative;margin:20px 0;top:auto;">
    <a href="#" class="logo"><span class="logo-text">SENIX</span></a>
    <nav>
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
    </nav>
</nav>

<div class="check info">
    <strong>PASO 2:</strong> ¿La navbar de arriba tiene FONDO OSCURO con borde azul?<br>
    Si se ve como links sueltos → el CSS no se aplica.<br>
    Si se ve como barra oscura → ¡CSS OK!
</div>

<!-- Probar botón -->
<a href="#" class="btn btn-primary" style="margin: 10px 0;">BOTÓN PRIMARIO</a>
<a href="#" class="btn" style="margin: 10px 0;">BOTÓN OUTLINE</a>

<div class="check info">
    <strong>PASO 3:</strong> ¿El botón "BOTÓN PRIMARIO" tiene degradado azul y letras mayúsculas espaciadas?<br>
    Si sí → botones OK.<br>
    Si se ve texto plano → CSS no se aplica.
</div>

<!-- Probar feature card -->
<div class="card" style="margin: 20px 0; padding: 30px;">
    <h3 style="color: #00a8ff;">CARD TEST</h3>
    <p>Si esta card tiene fondo glass y borde → card OK.</p>
</div>

<div class="check info">
    <strong>PASO 4:</strong> ¿La card tiene fondo semitransparente con efecto cristal?
</div>

<!-- Debug de ancho -->
<div class="check info">
    <strong>Información del dispositivo:</strong><br>
    Viewport: <script>document.write(window.innerWidth + 'x' + window.innerHeight);</script><br>
    Pixel Ratio: <script>document.write(window.devicePixelRatio);</script><br>
    User Agent: <?= htmlspecialchars(substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 80)) ?>
</div>

<script>
// Test JS de estilos computados
window.addEventListener('load', function() {
    const navbar = document.querySelector('.navbar');
    const btn = document.querySelector('.btn-primary');
    
    if (navbar) {
        const bg = getComputedStyle(navbar).backgroundColor;
        const border = getComputedStyle(navbar).borderBottomColor;
        console.log('Navbar BG:', bg);
        console.log('Navbar Border:', border);
        
        // Mostrar en pantalla
        const info = document.createElement('div');
        info.className = 'check info';
        info.innerHTML = '<strong>COMPUTED STYLES:</strong><br>' +
            'Navbar background: ' + bg + '<br>' +
            'Navbar border: ' + border + '<br>' +
            'Btn font-family: ' + getComputedStyle(btn).fontFamily;
        document.body.appendChild(info);
    }
});
</script>

</body>
</html>