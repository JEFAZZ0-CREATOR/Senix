<?php
$cameraTargetSeconds = max(10, min(120, (int)($cameraTargetSeconds ?? 20)));
$cameraExerciseTitle = (string)($cameraExerciseTitle ?? 'Práctica de detección');
?>
<link rel="stylesheet" href="<?= learn_h(asset('css/practice-detection.css')) ?>">
<section class="learn-panel practice-panel" data-target-seconds="<?= $cameraTargetSeconds ?>">
  <div class="learn-grid practice-grid">
    <div>
      <h2><?= learn_h($cameraExerciseTitle) ?></h2>
      <p class="learn-muted">Coloca una o ambas manos frente a la cámara y mantenlas visibles para completar la práctica.</p>
      <ul class="learn-muted">
        <li>Usa buena iluminación frontal y mantén tus manos dentro del encuadre.</li>
        <li>El vídeo y los puntos de referencia se procesan en este navegador.</li>
        <li>Esta actividad detecta manos; no interpreta ni califica la seña realizada.</li>
      </ul>
      <button class="learn-button" id="camera-start" type="button">Activar cámara y detección</button>
      <button class="learn-button secondary" id="camera-stop" type="button" disabled>Apagar cámara</button>
      <p id="camera-status" class="learn-muted" role="status" aria-live="polite">La cámara está apagada.</p>
      <p class="learn-muted"><strong id="hands-count">0 manos</strong> detectadas · <span id="camera-fps">En espera</span></p>
      <form method="post" class="learn-form camera-completion-form">
        <?= learn_csrf() ?>
        <input type="hidden" name="detected_seconds" id="detected-seconds" value="0">
        <button class="learn-button" id="camera-complete" name="complete_detection" value="1" disabled>Completar práctica</button>
      </form>
    </div>
    <div>
      <div class="learn-video-stage">
        <video id="camera-video" class="learn-video" autoplay playsinline muted></video>
        <canvas id="camera-overlay" class="learn-video-overlay" aria-hidden="true"></canvas>
        <span class="practice-camera-label">VISTA LOCAL · MEDIAPIPE HANDS</span>
      </div>
      <div class="learn-progress" aria-label="Progreso de práctica"><i id="camera-meter" style="width:0%"></i></div>
      <p class="learn-muted">Tiempo con manos visibles: <strong><span id="camera-progress">0</span> / <?= $cameraTargetSeconds ?></strong> segundos.</p>
    </div>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
<script src="<?= learn_h(asset('js/practice-detection.js')) ?>" defer></script>
