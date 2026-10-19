<?php
/**
 * Senix v2.0 — Register
 */

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/bootstrap.php';

if ($auth->isLoggedIn()) {
    redirect(APP_URL . '/menu.php');
}

$errors = [];
$old = ['username' => '', 'email' => '', 'full_name' => ''];

if (isPost()) {
    if (!csrf_verify()) {
        $errors[] = 'Token de seguridad inválido';
    } else {
        $username = trim($_POST['username'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $fullName = trim((string)($_POST['full_name'] ?? ''));
        $password = (string)($_POST['password'] ?? '');
        $confirm  = (string)($_POST['password_confirm'] ?? '');
        $terms    = !empty($_POST['terms']);
        
        $old = ['username' => $username, 'email' => $email, 'full_name' => $fullName];
        
        // Validaciones
        // Renombrar para la validación 'confirmed'
        $validatorData = [
            'username' => $username,
            'email'    => $email,
            'password' => $password,
            'password_confirm' => $confirm
        ];
        $validator = Validator::make($validatorData, [
            'username' => 'required|username|min:3|max:50',
            'email'    => 'required|email|max:150',
            'password' => 'required|password',
            'password_confirm' => 'required'
        ]);
        
        if ($password !== $confirm) {
            $errors[] = 'Las contraseñas no coinciden';
        }
        if (strlen($password) > 72) {
            $errors[] = 'La contraseña no puede superar 72 bytes. Usa una frase más corta.';
        }
        if (strlen($email) > 150) {
            $errors[] = 'El email no puede superar 150 caracteres.';
        }
        if (strlen($fullName) > 150 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $fullName)) {
            $errors[] = 'El nombre completo es demasiado largo o contiene caracteres no permitidos.';
        }
        
        if (!$terms) {
            $errors[] = 'Debes aceptar los términos y condiciones';
        }
        
        // Rate limiting
        $rateCheck = rate_limit('register_' . ($_SERVER['REMOTE_ADDR'] ?? ''), 5, 3600);
        if (!$rateCheck['allowed']) {
            $errors[] = 'Demasiados registros desde tu IP. Intenta más tarde.';
        }
        
        if ($validator->fails()) {
            foreach ($validator->errors() as $field => $msgs) {
                foreach ($msgs as $m) $errors[] = $m;
            }
        }
        
        if (empty($errors)) {
            $result = $auth->register($username, $email, $password, $fullName);
            
            if ($result['success']) {
                // Auto login
                $login = $auth->login($username, $password);
                
                if ($login['success']) {
                    setFlash('success', '¡Bienvenido a Senix, ' . $username . '!');
                    log_security_event('register_success', ['user_id' => $result['user_id']]);
                    redirect(APP_URL . '/menu.php');
                } else {
                    setFlash('success', 'Cuenta creada. Inicia sesión.');
                    redirect(APP_URL . '/login.php');
                }
            } else {
                $errors[] = $result['error'];
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
    <title>Crear Cuenta — Senix</title>
    <meta name="theme-color" content="#00f0ff">
    <link rel="manifest" href="<?= APP_URL ?>/manifest.json">
    <link rel="icon" type="image/svg+xml" href="<?= asset('img/logo.svg') ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/auth.css') ?>">
    <link rel="stylesheet" href="<?= asset('css/animations.css') ?>">
    <script type="module" src="https://cdn.spline.design/@splinetool/viewer@2.0.65/build/spline-viewer.js"></script>
<link rel="stylesheet" href="<?= asset('css/learning-type.css') ?>"></head>
<body class="page-register">

<div class="auth-wrapper auth-wrapper-reverse">
    <div class="auth-form-side">
        <a href="<?= APP_URL ?>/index.php" class="auth-logo">
            <span class="logo-text">SENIX</span>
        </a>
        
        <form class="auth-form" method="POST" autocomplete="on" id="register-form" data-auth-form>
            <div class="auth-header">
                <h1 class="auth-title">CREAR CUENTA</h1>
                <p class="auth-subtitle">Únete a la revolución Senix</p>
            </div>
            
            <?php if (!empty($errors)): ?>
                <div class="alert alert-error" role="alert" aria-live="assertive">
                    <span class="alert-icon">✕</span>
                    <div>
                        <?php foreach ($errors as $err): ?>
                            <div><?= e($err) ?></div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>
            
            <?= csrf_field() ?>
            
            <div class="form-group">
                <label for="username">Usuario</label>
                <div class="input-wrapper">
                    <span class="input-icon">@</span>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        class="form-control" 
                        placeholder="usuario_123"
                        required
                        minlength="3"
                        maxlength="50"
                        pattern="[a-zA-Z0-9_]{3,50}"
                        autocapitalize="none"
                        spellcheck="false"
                        aria-describedby="username-hint"
                        autocomplete="username"
                        value="<?= e($old['username']) ?>"
                        autofocus
                    >
                </div>
                <small class="input-hint" id="username-hint">De 3 a 50 caracteres. Solo letras sin acento, números y guion bajo (_).</small>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <div class="input-wrapper">
                    <span class="input-icon">✉</span>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        class="form-control" 
                        placeholder="tu@email.com"
                        required
                        maxlength="150"
                        autocomplete="email"
                        inputmode="email"
                        autocapitalize="none"
                        value="<?= e($old['email']) ?>"
                    >
                </div>
            </div>
            
            <div class="form-group">
                <label for="full_name">Nombre completo <span class="optional">(opcional)</span></label>
                <div class="input-wrapper">
                    <span class="input-icon">👤</span>
                    <input 
                        type="text" 
                        id="full_name" 
                        name="full_name" 
                        class="form-control" 
                        placeholder="Juan Pérez"
                        maxlength="150"
                        autocomplete="name"
                        aria-describedby="full-name-hint"
                        value="<?= e($old['full_name']) ?>"
                    >
                </div>
                <small class="input-hint" id="full-name-hint">Opcional. Máximo 150 caracteres.</small>
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="input-wrapper">
                    <span class="input-icon">🔒</span>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="form-control" 
                        placeholder="••••••••"
                        required
                        minlength="8"
                        maxlength="72"
                        autocomplete="new-password"
                        aria-describedby="pw-reqs password-strength"
                    >
                    <button type="button" class="input-toggle" data-toggle-password="password" aria-label="Mostrar contraseña" aria-pressed="false"><span aria-hidden="true">◉</span></button>
                </div>
                <div class="password-strength" id="password-strength">
                    <div class="strength-bar"><div class="strength-fill"></div></div>
                    <span class="strength-text">Escribe una contraseña</span>
                </div>
                <ul class="password-requirements" id="pw-reqs">
                    <li data-req="length"><span class="req-icon">○</span> Mínimo 8 caracteres</li>
                    <li data-req="uppercase"><span class="req-icon">○</span> Una mayúscula</li>
                    <li data-req="lowercase"><span class="req-icon">○</span> Una minúscula</li>
                    <li data-req="number"><span class="req-icon">○</span> Un número</li>
                    <li data-req="special"><span class="req-icon">○</span> Un carácter especial</li>
                </ul>
            </div>
            
            <div class="form-group">
                <label for="password_confirm">Confirmar contraseña</label>
                <div class="input-wrapper">
                    <span class="input-icon">🔒</span>
                    <input 
                        type="password" 
                        id="password_confirm" 
                        name="password_confirm" 
                        class="form-control" 
                        placeholder="••••••••"
                        required
                        minlength="8"
                        maxlength="72"
                        autocomplete="new-password"
                        data-confirm-password="password"
                    >
                    <button type="button" class="input-toggle" data-toggle-password="password_confirm" aria-label="Mostrar contraseña" aria-pressed="false"><span aria-hidden="true">◉</span></button>
                </div>
            </div>
            
            <label class="checkbox-wrapper terms-check">
                <input type="checkbox" name="terms" value="1" required>
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">
                    Acepto los <a href="<?= APP_URL ?>/terms.php" target="_blank">Términos</a> y la 
                    <a href="<?= APP_URL ?>/privacy.php" target="_blank">Política de Privacidad</a>
                </span>
            </label>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg auth-submit" id="submit-btn" data-submit-button>
                <span>CREAR CUENTA</span>
                <span class="btn-arrow">→</span>
            </button>
            
            <p class="auth-footer-text">
                ¿Ya tienes cuenta? 
                <a href="<?= APP_URL ?>/login.php">Inicia sesión aquí</a>
            </p>
        </form>
    </div>
    
    <div class="auth-spline">
        <spline-viewer url="https://prod.spline.design/iTzov2BzGaC6r45Y/scene.splinecode"></spline-viewer>
        <div class="auth-neural-orbit" aria-hidden="true">
            <svg viewBox="0 0 700 700" fill="none" focusable="false">
                <defs>
                    <radialGradient id="authRingCore"><stop stop-color="#68fbff" stop-opacity=".85"/><stop offset=".32" stop-color="#00c9ff" stop-opacity=".28"/><stop offset="1" stop-color="#00c9ff" stop-opacity="0"/></radialGradient>
                    <linearGradient id="authRingStroke"><stop stop-color="#f3ffff"/><stop offset=".22" stop-color="#08cfff"/><stop offset=".55" stop-color="#a7f8ff"/><stop offset=".78" stop-color="#087dba"/><stop offset="1" stop-color="#d7ffff"/></linearGradient>
                    <filter id="authRingGlow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <circle cx="350" cy="350" r="310" fill="url(#authRingCore)"/>
                <g class="auth-ring-ticks" stroke="#70eaff" opacity=".56"><path d="M350.00 80.00L350.00 52.00M364.60 71.38L364.92 65.39M379.16 72.53L379.79 66.56M393.65 74.43L394.58 68.51M408.01 77.10L409.25 71.23M420.92 85.34L425.06 69.88M436.22 84.66L438.07 78.95M449.98 89.53L452.13 83.93M463.48 95.12L465.92 89.64M476.66 101.41L479.39 96.06M485.00 116.17L499.00 91.92M501.95 116.01L505.22 110.98M513.99 124.28L517.52 119.43M525.58 133.18L529.36 128.51M536.69 142.66L540.70 138.20M543.75 156.25L555.06 144.94M557.34 163.31L561.80 159.30M566.82 174.42L571.49 170.64M575.72 186.01L580.57 182.48M583.99 198.05L589.02 194.78M583.83 215.00L608.08 201.00M598.59 223.34L603.94 220.61M604.88 236.52L610.36 234.08M610.47 250.02L616.07 247.87M615.34 263.78L621.05 261.93M614.66 279.08L630.12 274.94M622.90 291.99L628.77 290.75M625.57 306.35L631.49 305.42M627.47 320.84L633.44 320.21M628.62 335.40L634.61 335.08M620.00 350.00L648.00 350.00M628.62 364.60L634.61 364.92M627.47 379.16L633.44 379.79M625.57 393.65L631.49 394.58M622.90 408.01L628.77 409.25M614.66 420.92L630.12 425.06M615.34 436.22L621.05 438.07M610.47 449.98L616.07 452.13M604.88 463.48L610.36 465.92M598.59 476.66L603.94 479.39M583.83 485.00L608.08 499.00M583.99 501.95L589.02 505.22M575.72 513.99L580.57 517.52M566.82 525.58L571.49 529.36M557.34 536.69L561.80 540.70M543.75 543.75L555.06 555.06M536.69 557.34L540.70 561.80M525.58 566.82L529.36 571.49M513.99 575.72L517.52 580.57M501.95 583.99L505.22 589.02M485.00 583.83L499.00 608.08M476.66 598.59L479.39 603.94M463.48 604.88L465.92 610.36M449.98 610.47L452.13 616.07M436.22 615.34L438.07 621.05M420.92 614.66L425.06 630.12M408.01 622.90L409.25 628.77M393.65 625.57L394.58 631.49M379.16 627.47L379.79 633.44M364.60 628.62L364.92 634.61M350.00 620.00L350.00 648.00M335.40 628.62L335.08 634.61M320.84 627.47L320.21 633.44M306.35 625.57L305.42 631.49M291.99 622.90L290.75 628.77M279.08 614.66L274.94 630.12M263.78 615.34L261.93 621.05M250.02 610.47L247.87 616.07M236.52 604.88L234.08 610.36M223.34 598.59L220.61 603.94M215.00 583.83L201.00 608.08M198.05 583.99L194.78 589.02M186.01 575.72L182.48 580.57M174.42 566.82L170.64 571.49M163.31 557.34L159.30 561.80M156.25 543.75L144.94 555.06M142.66 536.69L138.20 540.70M133.18 525.58L128.51 529.36M124.28 513.99L119.43 517.52M116.01 501.95L110.98 505.22M116.17 485.00L91.92 499.00M101.41 476.66L96.06 479.39M95.12 463.48L89.64 465.92M89.53 449.98L83.93 452.13M84.66 436.22L78.95 438.07M85.34 420.92L69.88 425.06M77.10 408.01L71.23 409.25M74.43 393.65L68.51 394.58M72.53 379.16L66.56 379.79M71.38 364.60L65.39 364.92M80.00 350.00L52.00 350.00M71.38 335.40L65.39 335.08M72.53 320.84L66.56 320.21M74.43 306.35L68.51 305.42M77.10 291.99L71.23 290.75M85.34 279.08L69.88 274.94M84.66 263.78L78.95 261.93M89.53 250.02L83.93 247.87M95.12 236.52L89.64 234.08M101.41 223.34L96.06 220.61M116.17 215.00L91.92 201.00M116.01 198.05L110.98 194.78M124.28 186.01L119.43 182.48M133.18 174.42L128.51 170.64M142.66 163.31L138.20 159.30M156.25 156.25L144.94 144.94M163.31 142.66L159.30 138.20M174.42 133.18L170.64 128.51M186.01 124.28L182.48 119.43M198.05 116.01L194.78 110.98M215.00 116.17L201.00 91.92M223.34 101.41L220.61 96.06M236.52 95.12L234.08 89.64M250.02 89.53L247.87 83.93M263.78 84.66L261.93 78.95M279.08 85.34L274.94 69.88M291.99 77.10L290.75 71.23M306.35 74.43L305.42 68.51M320.84 72.53L320.21 66.56M335.40 71.38L335.08 65.39"/></g>
                <g class="auth-ring-orbit auth-ring-slow" stroke="#1bcfff" opacity=".28"><circle cx="350" cy="350" r="318"/><circle cx="350" cy="350" r="291" stroke-dasharray="1 5"/><circle cx="350" cy="350" r="278" stroke-width="1.4" stroke-dasharray="110 18 26 310 4 12 88 160"/><circle cx="350" cy="350" r="267" stroke-width="2" stroke-dasharray="2 5 62 21 2 15 32 270"/><circle cx="350" cy="350" r="259" stroke-dasharray="2 8"/></g>
                <g class="auth-ring-orbit auth-ring-slow" stroke="#66e7ff" opacity=".44"><circle cx="350" cy="350" r="302" stroke-width="1.1" stroke-dasharray="62 9 4 13 1 8 31 22"/><circle cx="350" cy="350" r="283" stroke-width="3" stroke-dasharray="1 17 74 8 2 24 36 110"/><circle cx="350" cy="350" r="252" stroke-width="1.2" stroke-dasharray="145 12 2 42 78 30"/></g>
                <g class="auth-ring-orbit auth-ring-reverse" stroke="#31ddff" opacity=".72" filter="url(#authRingGlow)"><circle cx="350" cy="350" r="242" stroke-width="2.2" stroke-dasharray="820 700"/><circle cx="350" cy="350" r="232" stroke-width="1" stroke-dasharray="1 3"/><circle cx="350" cy="350" r="218" stroke-width="7" stroke-dasharray="430 115 250 575"/><circle cx="350" cy="350" r="199" stroke-width="1.5" stroke-dasharray="740 25 95 390"/><circle cx="350" cy="350" r="178" stroke-width="4" stroke-dasharray="190 35 520 370"/></g>
                <g class="auth-ring-orbit auth-ring-fast" stroke="url(#authRingStroke)" filter="url(#authRingGlow)"><circle cx="350" cy="350" r="163" stroke-width="1" stroke-dasharray="8 16 2 26"/><circle cx="350" cy="350" r="151" stroke-width="2" stroke-dasharray="490 16 80 365"/><circle cx="350" cy="350" r="126" stroke-width="5" stroke-dasharray="95 28 260 408"/><circle cx="350" cy="350" r="101" stroke-width="1.5" stroke-dasharray="480 150"/><circle cx="350" cy="350" r="78" stroke-width="1" stroke-dasharray="1 5"/></g>
                <g class="auth-ring-calibration" stroke="#7befff" opacity=".74"><path d="M350 54v120M350 526v120M54 350h115M531 350h115M141 141l83 83M476 476l83 83M559 141l-85 85M224 476l-83 83"/><path d="M350 15v46M685 350h-46M350 685v-46M15 350h46" stroke-width="3"/><path d="M350 244v212M244 350h212" opacity=".34"/><path d="M92 262l34 12m482 178 34 12M260 92l12 34m178 482 12 34m220-382-35 12M126 426l-34 12m334-346-12 35M274 574l-12 34" stroke-width="5" stroke-linecap="square"/></g>
                <g fill="#d9ffff" filter="url(#authRingGlow)"><circle cx="350" cy="109" r="3"/><circle cx="592" cy="350" r="3"/><circle cx="350" cy="591" r="3"/><circle cx="107" cy="350" r="3"/><circle cx="350" cy="350" r="6" fill="#56f8ff"/></g>
                <circle cx="350" cy="350" r="67" fill="url(#authRingCore)"/><circle cx="350" cy="350" r="33" stroke="#71f8ff" stroke-opacity=".55"/><circle cx="350" cy="350" r="13" fill="#19deff" fill-opacity=".56" filter="url(#authRingGlow)"/>
            </svg>
        </div>
        <div class="auth-spline-overlay">
            <h2 class="glitch" data-text="ÚNETE">ÚNETE</h2>
            <p>Miles ya están aprendiendo</p>
            <div class="spline-features">
                <div class="feature-pill">🏆 +1000 usuarios</div>
                <div class="feature-pill">⭐ Logros diarios</div>
                <div class="feature-pill">💬 Simulador IA</div>
            </div>
        </div>
    </div>
</div>

<script src="<?= asset('js/auth.js') ?>" defer></script>

</body>
</html>

