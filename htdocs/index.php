<?php
/**
 * ==========================================================
 * SENIX v2.0 — Landing MEGA
 * Robot Spline + 8 escenas Three.js distribuidas
 * ==========================================================
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/bootstrap.php';

if ($auth->isLoggedIn()) {
    redirect(APP_URL . '/menu.php');
}

$totalUsers   = max(1250, $userModel->totalCount() * 15);
$totalLetters = (int)$pdo->query("SELECT COUNT(*) FROM letters")->fetchColumn();
$totalWords   = (int)$pdo->query("SELECT COUNT(*) FROM words")->fetchColumn();
$totalLessons = $lessonModel->count();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <meta name="theme-color" content="#00a8ff">
    <meta name="description" content="SENIX — Aprende lengua de señas con inteligencia artificial.">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="csrf-token" content="<?= csrf_token() ?>">
    
    <title>SENIX — Lengua de Señas con IA</title>
    
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/senix-logo.svg') ?>">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://my.spline.design">
    
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Chakra+Petch:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="<?= asset('css/senix-core.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-layout.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-components.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-landing.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-animations.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-responsive.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-3d.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/senix-3d-extra.css') ?>">
    
    <script>
        window.SENIX_CONFIG = {
            APP_URL: '<?= APP_URL ?>',
            APP_NAME: 'SENIX',
            APP_VERSION: '<?= APP_VERSION ?>',
            USER_ID: null,
            CSRF_TOKEN: '<?= csrf_token() ?>',
            IS_LOGGED_IN: false,
            AI_CONFIDENCE_THRESHOLD: <?= AI_CONFIDENCE_THRESHOLD ?>
        };
    </script>
</head>
<body class="senix-body senix-landing">

<!-- FONDOS GLOBALES -->
<canvas id="senix-particles" class="senix-particles-canvas" aria-hidden="true"></canvas>
<div class="senix-grid-bg" aria-hidden="true"></div>
<div class="senix-ambient" aria-hidden="true">
    <div class="senix-ambient-blob senix-blob-1"></div>
    <div class="senix-ambient-blob senix-blob-2"></div>
    <div class="senix-ambient-blob senix-blob-3"></div>
</div>

<div class="senix-scroll-progress" aria-hidden="true"></div>

<!-- ANIMACIÓN DE ENTRADA: al finalizar descubre la página SENIX existente -->
<div class="senix-intro-cover" id="senix-intro-cover" aria-label="Presentación de SENIX">
    <iframe src="<?= asset('senix-intro.html') ?>?v=<?= (int) filemtime(__DIR__ . '/assets/senix-intro.html') ?>" title="Animación de entrada SENIX" loading="eager" tabindex="-1"></iframe>
</div>
<style>
    .senix-intro-cover{position:fixed;inset:0;z-index:100000;background:#03070d;opacity:1;visibility:visible;transition:opacity .55s ease,visibility 0s linear .55s}
    .senix-intro-cover iframe{display:block;width:100%;height:100%;border:0}
    .senix-intro-cover.is-leaving{opacity:0;visibility:hidden;pointer-events:none}
    @media(prefers-reduced-motion:reduce){.senix-intro-cover{transition-duration:.01ms}}
</style>
<script>
(() => {
    const cover = document.getElementById('senix-intro-cover');
    if (!cover) return;
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        cover.classList.add('is-leaving');
        window.setTimeout(() => cover.remove(), 650);
    };
    const frame = cover.querySelector('iframe');
    const frameOrigin = frame ? new URL(frame.src, window.location.href).origin : '';
    window.addEventListener('message', (event) => {
        if (frame && event.origin === frameOrigin && event.source === frame.contentWindow && event.data?.type === 'senix:intro-complete') finish();
    });
    window.setTimeout(finish, 7200);
})();
</script>

<!-- NAVBAR -->
<nav class="senix-nav" id="senix-nav">
    <a href="<?= APP_URL ?>/" class="senix-nav-brand">
        <svg class="senix-logo-svg" viewBox="0 0 220 60">
            <defs>
                <linearGradient id="senixLogoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00a8ff"/>
                    <stop offset="50%" stop-color="#007bff"/>
                    <stop offset="100%" stop-color="#00ffcc"/>
                </linearGradient>
                <filter id="senixLogoGlow">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <text x="4" y="46" font-family="Orbitron" font-size="40" font-weight="900" fill="url(#senixLogoGrad)" filter="url(#senixLogoGlow)" letter-spacing="5">SENIX</text>
        </svg>
    </a>
    
    <div class="senix-nav-links" id="senix-nav-links">
        <a href="#features" class="senix-nav-link">Características</a>
        <a href="#demo" class="senix-nav-link">Demo IA</a>
        <a href="#stats" class="senix-nav-link">Impacto</a>
        <a href="#tech" class="senix-nav-link">Tecnología</a>
    </div>
    
    <div class="senix-nav-actions">
        <a href="<?= APP_URL ?>/login.php" class="senix-btn senix-btn-ghost senix-btn-sm">ENTRAR</a>
        <a href="<?= APP_URL ?>/register.php" class="senix-btn senix-btn-primary senix-btn-sm">COMENZAR</a>
        <button class="senix-nav-toggle" aria-label="Menú">
            <span></span><span></span><span></span>
        </button>
    </div>
</nav>

<!-- ==========================================================
     HERO — Robot Spline + Red Neuronal Three.js
     ========================================================== -->
<section class="senix-hero" id="hero">
    <!-- Robot Spline (mantener) -->
    <div class="senix-hero-spline">
        <iframe 
            src="https://my.spline.design/nexbotrobotcharacterconcept-bDhUc4rgTEbep9PLoDlhglPc/"
            frameborder="0"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            loading="eager">
        </iframe>
    </div>
    
    <!-- Red neuronal Three.js superpuesta -->
    <div class="senix-hero-neural" 
         data-3d-scene 
         data-scene-type="neural"
         data-scene-camera-z="9"
         style="position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0.5;mix-blend-mode:screen">
    </div>
    
    <div class="senix-hero-overlay-1"></div>
    <div class="senix-hero-overlay-2"></div>
    <div class="senix-hero-scan"></div>
    
    <div class="senix-hero-content">
        <div class="senix-hero-badge">
            <span class="senix-badge-dot"></span>
            <span class="senix-badge-text">Detección IA en Tiempo Real</span>
        </div>
        
        <h1 class="senix-hero-title">
            <span class="senix-title-line senix-title-line-1">DOMINA</span>
            <span class="senix-title-line senix-title-line-2 senix-title-gradient">LENGUA DE SEÑAS</span>
            <span class="senix-title-line senix-title-line-3">CON IA</span>
        </h1>
        
        <p class="senix-hero-subtitle">
            Revoluciona tu forma de comunicarte. Nuestra red neuronal detecta 21 puntos de tus manos 
            en tiempo real y te guía paso a paso hasta dominar el lenguaje de señas.
        </p>
        
        <div class="senix-hero-actions">
            <a href="<?= APP_URL ?>/register.php" class="senix-btn senix-btn-primary senix-btn-xl senix-btn-glow">
                <span>COMENZAR GRATIS</span>
                <svg class="senix-icon senix-icon-sm senix-btn-arrow" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
            <a href="#demo" class="senix-btn senix-btn-outline senix-btn-xl">
                <svg class="senix-icon senix-icon-sm" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>
                </svg>
                <span>VER DEMO</span>
            </a>
        </div>
        
        <div class="senix-hero-stats">
            <div class="senix-hero-stat">
                <div class="senix-stat-value" data-count="<?= $totalUsers ?>">0</div>
                <div class="senix-stat-label">USUARIOS</div>
            </div>
            <div class="senix-hero-stat">
                <div class="senix-stat-value" data-count="<?= $totalLetters ?>">0</div>
                <div class="senix-stat-label">LETRAS</div>
            </div>
            <div class="senix-hero-stat">
                <div class="senix-stat-value" data-count="<?= $totalWords ?>">0</div>
                <div class="senix-stat-label">PALABRAS</div>
            </div>
            <div class="senix-hero-stat">
                <div class="senix-stat-value" data-count="<?= $totalLessons ?>">0</div>
                <div class="senix-stat-label">LECCIONES</div>
            </div>
        </div>
    </div>
    
    <div class="senix-scroll-cue">
        <span class="senix-scroll-text">SCROLL</span>
        <svg class="senix-scroll-arrow" viewBox="0 0 24 24">
            <path d="M12 5v14M5 13l7 7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>
</section>

<!-- ==========================================================
     FEATURES — 4 escenas diferentes
     ========================================================== -->
<section class="senix-section senix-features" id="features">
    <div class="senix-container">
        <header class="senix-section-head senix-reveal">
            <div class="senix-section-tag">CARACTERÍSTICAS</div>
            <h2 class="senix-section-title">
                Tecnología del <span class="senix-gradient">Futuro</span>
            </h2>
            <p class="senix-section-subtitle">
                Herramientas de nivel profesional para dominar la lengua de señas
            </p>
        </header>
        
        <div class="senix-features-grid">
            <!-- Feature 1: CUBO DE DATOS -->
            <article class="senix-feature-card senix-reveal" data-tilt>
                <div class="senix-feature-bg" 
                     data-3d-scene 
                     data-scene-type="data-cube">
                </div>
                <div class="senix-feature-content">
                    <div class="senix-feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3v1a3 3 0 0 0-1 2.5v3A3.5 3.5 0 0 0 7.5 20H9a3 3 0 0 0 3-3 3 3 0 0 0 3 3h1.5a3.5 3.5 0 0 0 3.5-3.5v-3A3 3 0 0 0 19 11v-1a3 3 0 0 0-3-3V6a4 4 0 0 0-4-4Z"/>
                        </svg>
                    </div>
                    <h3 class="senix-feature-title">RED NEURONAL</h3>
                    <p class="senix-feature-desc">
                        MediaPipe Hands analiza 21 puntos de tu mano a 30 FPS con precisión del 99%.
                    </p>
                </div>
            </article>
            
            <!-- Feature 2: DIAMANTE -->
            <article class="senix-feature-card senix-reveal senix-delay-1" data-tilt>
                <div class="senix-feature-bg" 
                     data-3d-scene 
                     data-scene-type="diamond">
                </div>
                <div class="senix-feature-content">
                    <div class="senix-feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M22 10 12 5 2 10l10 5 10-5Z"/>
                            <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
                        </svg>
                    </div>
                    <h3 class="senix-feature-title">LECCIONES</h3>
                    <p class="senix-feature-desc">
                        Sistema gamificado estilo Duolingo. Sube de nivel y mantén tu racha.
                    </p>
                </div>
            </article>
            
            <!-- Feature 3: WORMHOLE -->
            <article class="senix-feature-card senix-reveal senix-delay-2" data-tilt>
                <div class="senix-feature-bg" 
                     data-3d-scene 
                     data-scene-type="wormhole">
                </div>
                <div class="senix-feature-content">
                    <div class="senix-feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/>
                            <path d="M8 9h8M8 13h5"/>
                        </svg>
                    </div>
                    <h3 class="senix-feature-title">SIMULADOR</h3>
                    <p class="senix-feature-desc">
                        Practica conversaciones con escenarios de restaurante, escuela y más.
                    </p>
                </div>
            </article>
            
            <!-- Feature 4: SATURNO -->
            <article class="senix-feature-card senix-reveal senix-delay-3" data-tilt>
                <div class="senix-feature-bg" 
                     data-3d-scene 
                     data-scene-type="saturn">
                </div>
                <div class="senix-feature-content">
                    <div class="senix-feature-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                            <path d="M4 22h16"/>
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                    </div>
                    <h3 class="senix-feature-title">LOGROS</h3>
                    <p class="senix-feature-desc">
                        17+ logros desbloqueables, torneos semanales y ranking global.
                    </p>
                </div>
            </article>
        </div>
    </div>
</section>

<!-- ==========================================================
     SECCIÓN C: VISUAL SHOWCASE (HELIX + STAR)
     ========================================================== -->
<section class="senix-section senix-showcase">
    <div class="senix-container">
        <header class="senix-section-head senix-reveal">
            <div class="senix-section-tag">INNOVACIÓN</div>
            <h2 class="senix-section-title">
                Aprende con <span class="senix-gradient">Tecnología Viva</span>
            </h2>
            <p class="senix-section-subtitle">
                Cada módulo está potenciado por inteligencia artificial y renderizado 3D en tiempo real
            </p>
        </header>
        
        <div class="senix-showcase-grid">
            <!-- Card Helix -->
            <div class="senix-showcase-card senix-reveal-left">
                <div class="senix-showcase-3d" 
                     data-3d-scene 
                     data-scene-type="helix">
                </div>
                <div class="senix-showcase-info">
                    <h3>Adaptativo</h3>
                    <p>El sistema aprende tu ritmo y adapta cada lección para que progreses sin frustración.</p>
                </div>
            </div>
            
            <!-- Card Star -->
            <div class="senix-showcase-card senix-reveal-right">
                <div class="senix-showcase-3d" 
                     data-3d-scene 
                     data-scene-type="star">
                </div>
                <div class="senix-showcase-info">
                    <h3>Instantáneo</h3>
                    <p>Resultados en menos de 100ms. La IA evalúa tu seña en el momento y te da feedback preciso.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ==========================================================
     DEMO — Mano 3D con 21 puntos
     ========================================================== -->
<section class="senix-section senix-demo" id="demo">
    <div class="senix-container">
        <div class="senix-demo-layout">
            <div class="senix-demo-visual senix-reveal-left">
                <div class="senix-demo-spline-wrap" 
                     data-3d-scene 
                     data-scene-type="hand"
                     data-scene-camera-z="7">
                </div>
                <div class="senix-demo-corners">
                    <span></span><span></span><span></span><span></span>
                </div>
            </div>
            
            <div class="senix-demo-content senix-reveal-right">
                <div class="senix-section-tag">DEMO EN VIVO</div>
                <h2 class="senix-section-title">
                    Detecta tus gestos<br>
                    <span class="senix-gradient">en tiempo real</span>
                </h2>
                <p class="senix-section-subtitle">
                    Nuestro motor de IA analiza 21 puntos de tu mano a 30 FPS. 
                    Reconoce el abecedario completo y más de 40 palabras comunes.
                </p>
                
                <div class="senix-demo-features">
                    <div class="senix-demo-feature">
                        <div class="senix-demo-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>
                            </svg>
                        </div>
                        <div class="senix-demo-feature-text">
                            <h4>Velocidad Extrema</h4>
                            <p>Detección en menos de 100ms</p>
                        </div>
                    </div>
                    
                    <div class="senix-demo-feature">
                        <div class="senix-demo-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="10"/>
                                <circle cx="12" cy="12" r="6"/>
                                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="senix-demo-feature-text">
                            <h4>Alta Precisión</h4>
                            <p>99% con buena iluminación</p>
                        </div>
                    </div>
                    
                    <div class="senix-demo-feature">
                        <div class="senix-demo-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3Z"/>
                                <path d="m9 12 2 2 4-4"/>
                            </svg>
                        </div>
                        <div class="senix-demo-feature-text">
                            <h4>100% Privado</h4>
                            <p>Procesamiento local en tu dispositivo</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ==========================================================
     STATS — con Quantum Waves de fondo
     ========================================================== -->
<section class="senix-section senix-stats" id="stats">
    <div class="senix-stats-bg" 
         data-3d-scene 
         data-scene-type="quantum-waves"
         style="position:absolute;inset:0;z-index:0;opacity:0.4;pointer-events:none">
    </div>
    
    <div class="senix-container" style="position:relative;z-index:1">
        <header class="senix-section-head senix-reveal">
            <div class="senix-section-tag">IMPACTO</div>
            <h2 class="senix-section-title">
                Números que <span class="senix-gradient">Hablan</span>
            </h2>
        </header>
        
        <div class="senix-stats-grid">
            <div class="senix-stat-card senix-reveal">
                <div class="senix-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/>
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/>
                    </svg>
                </div>
                <div class="senix-stat-big" data-count="<?= $totalUsers ?>">0</div>
                <div class="senix-stat-desc">Usuarios Aprendiendo</div>
            </div>
            
            <div class="senix-stat-card senix-reveal senix-delay-1">
                <div class="senix-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
                    </svg>
                </div>
                <div class="senix-stat-big" data-count="26">0</div>
                <div class="senix-stat-desc">Letras del Abecedario</div>
            </div>
            
            <div class="senix-stat-card senix-reveal senix-delay-2">
                <div class="senix-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"/>
                    </svg>
                </div>
                <div class="senix-stat-big" data-count="40">0</div>
                <div class="senix-stat-desc">Palabras Comunes</div>
            </div>
            
            <div class="senix-stat-card senix-reveal senix-delay-3">
                <div class="senix-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                        <path d="M4 22h16"/>
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                </div>
                <div class="senix-stat-big" data-count="17">0</div>
                <div class="senix-stat-desc">Logros Desbloqueables</div>
            </div>
        </div>
    </div>
</section>

<!-- ==========================================================
     SECCIÓN D: VISUAL SHOWCASE 2 (HEART)
     ========================================================== -->
<section class="senix-section senix-showcase-2">
    <div class="senix-container">
        <div class="senix-showcase-split">
            <div class="senix-showcase-3d-large senix-reveal-left"
                 data-3d-scene 
                 data-scene-type="heart"
                 data-scene-camera-z="6">
            </div>
            
            <div class="senix-showcase-text senix-reveal-right">
                <div class="senix-section-tag">PASIÓN</div>
                <h2 class="senix-section-title">
                    Hecho con <span class="senix-gradient">Corazón</span>
                </h2>
                <p class="senix-section-subtitle" style="margin:0 0 30px 0;text-align:left">
                    Creemos en un mundo donde la comunicación no tenga barreras. 
                    Cada línea de código está diseñada para hacer el aprendizaje accesible, 
                    divertido y efectivo.
                </p>
                
                <div class="senix-demo-features" style="margin-top:30px">
                    <div class="senix-demo-feature">
                        <div class="senix-demo-feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>
                            </svg>
                        </div>
                        <div class="senix-demo-feature-text">
                            <h4>Diseñado con Amor</h4>
                            <p>Para la comunidad sorda y oyente</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ==========================================================
     TECH
     ========================================================== -->
<section class="senix-section senix-tech" id="tech">
    <div class="senix-container">
        <header class="senix-section-head senix-reveal">
            <div class="senix-section-tag">TECNOLOGÍA</div>
            <h2 class="senix-section-title">
                Construido con lo <span class="senix-gradient">Mejor</span>
            </h2>
        </header>
        
        <div class="senix-tech-grid">
            <?php
            $techs = [
                ['MediaPipe',   'Google AI',       'ai'],
                ['TensorFlow',  'ML Engine',       'bolt'],
                ['Three.js',    'WebGL Engine',    '3d'],
                ['Spline 3D',   'Design 3D',       '3d'],
                ['PHP 8.2',     'Backend Core',    'db'],
                ['PWA Ready',   'Instalable',      'mobile']
            ];
            foreach ($techs as $i => $t):
                $delay = $i % 4;
            ?>
            <div class="senix-tech-card senix-reveal senix-delay-<?= $delay ?>">
                <div class="senix-tech-icon">
                    <?php if ($t[2] === 'ai'): ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3v1a3 3 0 0 0-1 2.5v3A3.5 3.5 0 0 0 7.5 20H9a3 3 0 0 0 3-3 3 3 0 0 0 3 3h1.5a3.5 3.5 0 0 0 3.5-3.5v-3A3 3 0 0 0 19 11v-1a3 3 0 0 0-3-3V6a4 4 0 0 0-4-4Z"/>
                    </svg>
                    <?php elseif ($t[2] === 'bolt'): ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>
                    </svg>
                    <?php elseif ($t[2] === '3d'): ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 2 4 7v10l8 5 8-5V7l-8-5Z"/>
                        <path d="M12 22V12M20 7 12 12 4 7"/>
                    </svg>
                    <?php elseif ($t[2] === 'db'): ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                    </svg>
                    <?php else: ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="5" y="2" width="14" height="20" rx="2"/>
                        <path d="M12 18h.01"/>
                    </svg>
                    <?php endif; ?>
                </div>
                <div class="senix-tech-name"><?= $t[0] ?></div>
                <div class="senix-tech-desc"><?= $t[1] ?></div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- ==========================================================
     CTA — Globo
     ========================================================== -->
<section class="senix-cta">
    <div class="senix-cta-3d" 
         data-3d-scene 
         data-scene-type="globe"
         data-scene-camera-z="8">
    </div>
    <div class="senix-cta-overlay"></div>
    
    <div class="senix-cta-content senix-reveal-scale">
        <h2 class="senix-section-title">
            ¿Listo para el <span class="senix-gradient">Futuro</span>?
        </h2>
        <p class="senix-section-subtitle">
            Únete a miles de personas aprendiendo lengua de señas con IA
        </p>
        
        <div class="senix-hero-actions" style="margin-top:40px;margin-bottom:20px">
            <a href="<?= APP_URL ?>/register.php" class="senix-btn senix-btn-primary senix-btn-xl senix-btn-glow">
                <span>COMENZAR GRATIS</span>
                <svg class="senix-icon senix-icon-sm senix-btn-arrow" viewBox="0 0 24 24">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
            <a href="<?= APP_URL ?>/login.php" class="senix-btn senix-btn-outline senix-btn-xl">YA TENGO CUENTA</a>
        </div>
        
        <p style="color:var(--senix-text-muted);font-size:0.85rem;letter-spacing:1px">
            Sin tarjeta de crédito · Comienza en menos de 1 minuto
        </p>
    </div>
</section>

<!-- FOOTER -->
<footer class="senix-footer">
    <div class="senix-footer-grid">
        <div class="senix-footer-brand">
            <h4>SENIX</h4>
            <p>Tecnología e inteligencia artificial para un mundo más inclusivo.</p>
        </div>
        
        <div class="senix-footer-links">
            <h5>PRODUCTO</h5>
            <ul>
                <li><a href="#features">Características</a></li>
                <li><a href="#demo">Demo IA</a></li>
                <li><a href="#tech">Tecnología</a></li>
            </ul>
        </div>
        
        <div class="senix-footer-links">
            <h5>LEGAL</h5>
            <ul>
                <li><a href="<?= APP_URL ?>/terms.php">Términos</a></li>
                <li><a href="<?= APP_URL ?>/privacy.php">Privacidad</a></li>
                <li><a href="mailto:soporte@senix.unaux.com">Contacto</a></li>
            </ul>
        </div>
    </div>
    
    <div class="senix-footer-bottom">
        © <?= date('Y') ?> SENIX v<?= APP_VERSION ?> · Todos los derechos reservados
    </div>
</footer>

<!-- SCRIPTS -->
<script src="<?= asset('js/senix-core.js') ?>" defer></script>
<script src="<?= asset('js/senix-3d-all.js') ?>" defer></script>
<script src="<?= asset('js/senix-preloader.js') ?>" defer></script>
<script src="<?= asset('js/senix-nav.js') ?>" defer></script>
<script src="<?= asset('js/senix-scroll.js') ?>" defer></script>
<script src="<?= asset('js/senix-ui.js') ?>" defer></script>

<script src="<?= asset('js/senix-main.js') ?>" defer></script>

</body>
</html>