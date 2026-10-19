<?php
http_response_code(200);
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sin conexión — Senix</title>
<link rel="stylesheet" href="/assets/css/style.css">
<style>
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
        padding: 40px;
    }
    .offline-box {
        max-width: 500px;
        padding: 50px 40px;
        background: var(--bg-card);
        border: 2px solid var(--primary);
        border-radius: 20px;
        box-shadow: var(--glow);
    }
    .offline-icon {
        font-size: 6rem;
        margin-bottom: 20px;
        animation: pulse 3s infinite;
    }
    h1 {
        font-size: 2rem;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 15px;
    }
    p { color: var(--text-dim); margin-bottom: 25px; line-height: 1.7; }
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }
</style>
</head>
<body>
<div class="offline-box">
    <div class="offline-icon">📡</div>
    <h1>SIN CONEXIÓN</h1>
    <p>No podemos conectarnos a internet en este momento.</p>
    <p>Algunas funciones de Senix seguirán disponibles en modo offline.</p>
    <button onclick="window.location.reload()" class="btn btn-primary">Reintentar</button>
</div>
</body>
</html>