<?php
require_once __DIR__ . '/includes/learning-tools.php';
learn_ensure_tables();
$challengeTimezone = 'America/Mexico_City';
try {
    $zoneQuery = learn_db()->prepare('SELECT timezone FROM user_curriculum_progress WHERE user_id=? ORDER BY completed_at_utc DESC LIMIT 1');
    $zoneQuery->execute([$learnUserId]);
    $savedTimezone = (string)$zoneQuery->fetchColumn();
    if ($savedTimezone !== '' && in_array($savedTimezone, DateTimeZone::listIdentifiers(), true)) $challengeTimezone = $savedTimezone;
} catch (Throwable $error) { error_log('[daily challenge timezone] ' . $error->getMessage()); }
$challengeZone = new DateTimeZone($challengeTimezone);
$challengeNow = new DateTimeImmutable('now', $challengeZone);
$today = $challengeNow->format('Y-m-d');
$weekdays = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
$months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
$todayLabel = $weekdays[(int)$challengeNow->format('N') - 1] . ' ' . $challengeNow->format('j') . ' de ' . $months[(int)$challengeNow->format('n') - 1];
$targetSeconds = 20;
$challenge = ['title' => 'Pulso constante', 'description' => 'Mantén una mano visible durante veinte segundos. Un ejercicio breve para afinar enfoque y estabilidad.', 'xp_reward' => 20];
$prior = null;
$already = false;
try {
    $query = learn_db()->prepare('SELECT xp_reward FROM daily_challenges WHERE challenge_date=?');
    $query->execute([$today]);
    if ($dbChallenge = $query->fetch()) {
        
        $challenge['xp_reward'] = max(0, (int)$dbChallenge['xp_reward']);
    }
    $query = learn_db()->prepare('SELECT * FROM daily_challenge_progress WHERE challenge_date=? AND user_id=?');
    $query->execute([$today, $learnUserId]);
    $prior = $query->fetch();
    $already = $prior && !empty($prior['completed']);
} catch (Throwable $error) { error_log('[daily challenge] ' . $error->getMessage()); }
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    learn_verify_csrf();
    if ($already) { header('Location: challenge.php?done=1'); exit; }
    $detectedSeconds = filter_var($_POST['detected_seconds'] ?? null, FILTER_VALIDATE_INT);
    if (!$detectedSeconds || $detectedSeconds < $targetSeconds) {
        http_response_code(422);
        $formError = 'Completa los veinte segundos de detección antes de guardar tu práctica.';
    } else {
        $detectedSeconds = min($detectedSeconds, 120);
        try {
            $query = learn_db()->prepare('INSERT INTO daily_challenge_progress(challenge_date,user_id,score,completed,completed_at) VALUES(?,?,?,1,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE score=GREATEST(score,VALUES(score)),completed=1,completed_at=UTC_TIMESTAMP()');
            $query->execute([$today, $learnUserId, $detectedSeconds]);
        } catch (Throwable $error) { error_log('[challenge save] ' . $error->getMessage()); }
        $prior = ['score' => $detectedSeconds, 'completed' => 1];
        $already = true;
        learn_record_practice($learnUserId, (int)$challenge['xp_reward'], $challengeTimezone);
        $_SESSION['challenge_result'] = ['seconds' => $detectedSeconds, 'xp' => (int)$challenge['xp_reward']];
        header('Location: challenge.php?result=1');
        exit;
    }
}
?><!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#201923"><title>Desafío diario · SENIX</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="<?= learn_h(asset('css/menu.css')) ?>"><link rel="stylesheet" href="<?= learn_h(asset('css/menu-warm.css')) ?>"><link rel="stylesheet" href="<?= learn_h(asset('css/daily-challenge.css')) ?>?v=<?= (int)filemtime(__DIR__ . '/assets/css/daily-challenge.css') ?>"><link rel="stylesheet" href="<?= learn_h(asset('css/learning-type.css')) ?>"></head>
<body class="sx-app daily-challenge-page"><div class="sx-ambient challenge-ambient-one"></div><div class="sx-ambient challenge-ambient-two"></div>
<header class="challenge-topbar"><a class="challenge-brand" href="<?= learn_h(APP_URL) ?>/menu.php"><span class="challenge-brand-mark">✦</span><span><strong>SENIX</strong><small>APRENDE · PRACTICA · CONECTA</small></span></a><a class="challenge-back" href="<?= learn_h(APP_URL) ?>/menu.php#practice"><span>←</span> Volver a mi espacio</a></header>
<main class="challenge-shell"><div class="challenge-intro"><div><span class="challenge-kicker"><i></i> DESAFÍO DIARIO <b><?= learn_h((string)$todayLabel) ?></b></span><h1>Un momento<br>para <em>concentrarte.</em></h1><p>Una pausa breve, una mano en foco y una pequeña victoria para tu racha de aprendizaje.</p></div><div class="challenge-stamp" aria-label="Recompensa <?= (int)$challenge['xp_reward'] ?> XP"><span>RECOMPENSA</span><strong>+<?= (int)$challenge['xp_reward'] ?></strong><small>XP</small><i>✦</i></div></div>
<?php if (isset($_GET['result']) && isset($_SESSION['challenge_result'])): $result=$_SESSION['challenge_result']; ?><section class="challenge-success"><div class="success-orbit"><span>✦</span></div><div class="success-copy"><span class="challenge-kicker">DESAFÍO COMPLETADO</span><h2>Buen trabajo.<br><em>Se sintió el enfoque.</em></h2><p>Mantuviste una mano visible durante <?= (int)$result['seconds'] ?> segundos. Tu progreso ya quedó guardado; esta práctica detecta presencia de manos y no evalúa la seña.</p><div class="success-reward">✦ <strong>+<?= (int)$result['xp'] ?> XP</strong> añadidos a tu cuenta</div><a class="challenge-primary" href="<?= learn_h(APP_URL) ?>/menu.php#learn">Volver a aprender <span>↗</span></a></div></section><?php unset($_SESSION['challenge_result']); ?>
<?php elseif ($already): ?><section class="challenge-success already-done"><div class="success-orbit"><span>✓</span></div><div class="success-copy"><span class="challenge-kicker">MISIÓN DE HOY · COMPLETADA</span><h2>Tu práctica<br><em>ya está en el registro.</em></h2><p>Hoy acumulaste <?= (int)$prior['score'] ?> segundos con la mano en cámara. Vuelve mañana para un nuevo desafío y sigue sumando constancia.</p><div class="success-reward">✦ <strong>+<?= (int)$challenge['xp_reward'] ?> XP</strong> recompensa de hoy</div><a class="challenge-primary" href="<?= learn_h(APP_URL) ?>/menu.php#learn">Volver a aprender <span>↗</span></a></div></section>
<?php else: ?>
<?php if (!empty($formError)): ?><div class="challenge-error" role="alert"><?= learn_h($formError) ?></div><?php endif; ?>
<section class="challenge-workspace"><div class="challenge-guide"><div class="guide-top"><span class="guide-symbol">◎</span><span class="guide-label">MISIÓN DE HOY</span><span class="guide-duration">20 SEG</span></div><div class="guide-copy"><span class="challenge-kicker">PRÁCTICA DE ENFOQUE</span><h2><?= learn_h($challenge['title']) ?></h2><p><?= learn_h($challenge['description']) ?></p></div><div class="challenge-clock"><div class="clock-face"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="clock-track" cx="60" cy="60" r="52"/><circle class="clock-progress" id="challenge-clock-progress" cx="60" cy="60" r="52"/></svg><div class="clock-value"><strong id="camera-progress">0</strong><small>/ 20 s</small></div></div><div class="clock-caption"><span class="clock-live-dot"></span><span id="camera-status" role="status" aria-live="polite">Activa tu cámara cuando estés listo.</span></div></div><div class="challenge-steps"><div><i>01</i><span>Enciende la cámara</span></div><div><i>02</i><span>Mantén tu mano dentro del encuadre</span></div><div><i>03</i><span>Completa el círculo y gana XP</span></div></div><div class="privacy-note"><span>◈</span><p>La imagen se procesa en tu navegador. SENIX registra solo el tiempo y el resultado.</p></div></div>
<div class="challenge-camera practice-panel" data-target-seconds="<?= $targetSeconds ?>"><div class="camera-panel-top"><div><span class="camera-index">01 / DETECCIÓN</span><h2>Tu espacio de práctica</h2></div><span class="camera-status-chip"><i></i><span id="camera-fps">ESPERANDO</span></span></div><div class="challenge-video-frame"><video id="camera-video" autoplay playsinline muted></video><canvas id="camera-overlay" aria-hidden="true"></canvas><div class="camera-corners"><i></i><i></i><i></i><i></i></div><div class="camera-ready-state"><span>✋</span><strong>Tu cámara aparecerá aquí</strong><small>Coloca la mano en el centro y manténla visible.</small></div><span class="video-corner-label">SENIX · LOCAL VISION</span></div><div class="camera-footer"><div class="hand-counter"><span class="hand-counter-icon">✋</span><span><strong id="hands-count">0 manos</strong><small>detectadas en el encuadre</small></span></div><div class="camera-actions"><button class="challenge-secondary" id="camera-stop" type="button" disabled>Apagar</button><button class="challenge-primary" id="camera-start" type="button">Activar cámara <span>↗</span></button></div></div><div class="challenge-meter"><i id="camera-meter"></i></div><form method="post" class="challenge-submit-form"><?= learn_csrf() ?><input type="hidden" name="detected_seconds" id="detected-seconds" value="0"><button class="challenge-submit" id="camera-complete" name="complete_detection" value="1" disabled><span>Guardar desafío</span><span>✦ +<?= (int)$challenge['xp_reward'] ?> XP</span></button></form><p class="camera-disclaimer">La cámara detecta manos visibles; todavía no interpreta ni califica la forma de una seña.</p></div></section><?php endif; ?>
<footer class="challenge-footer"><span>UN PASO A LA VEZ · SENIX</span><span>Tu progreso es tuyo <i>✦</i></span></footer></main>
<?php if (!$already && !isset($_GET['result'])): ?><script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script><script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script><script src="<?= learn_h(asset('js/practice-detection.js')) ?>" defer></script><script defer>document.addEventListener('DOMContentLoaded',()=>{const video=document.getElementById('camera-video'),frame=document.querySelector('.challenge-video-frame');if(video&&frame){video.addEventListener('playing',()=>frame.classList.add('is-live'));video.addEventListener('emptied',()=>frame.classList.remove('is-live'))}const meter=document.getElementById('camera-meter'),progress=document.getElementById('camera-progress'),circle=document.querySelector('.clock-progress');if(!meter||!progress||!circle)return;const update=()=>{const value=Math.min(20,Number(progress.textContent)||0),length=327;circle.style.strokeDasharray=String(length);circle.style.strokeDashoffset=String(length*(1-value/20));meter.style.width=(value/20*100)+'%'};new MutationObserver(update).observe(progress,{childList:true,characterData:true,subtree:true});update()});</script><?php endif; ?></body></html>


