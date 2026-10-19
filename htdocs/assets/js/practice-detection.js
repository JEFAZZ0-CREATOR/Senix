(() => {
  'use strict';

  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-overlay');
  const status = document.getElementById('camera-status');
  const startButton = document.getElementById('camera-start');
  const stopButton = document.getElementById('camera-stop');
  const handsCount = document.getElementById('hands-count');
  const fpsLabel = document.getElementById('camera-fps');
  const meter = document.getElementById('camera-meter');
  const panel = document.querySelector('.practice-panel');
  const cameraDisplay = document.querySelector('.practice-camera-display');
  const progressLabel = document.getElementById('camera-progress');
  const secondsInput = document.getElementById('detected-seconds');
  const completeButton = document.getElementById('camera-complete');
  const targetSeconds = Number(panel?.dataset.targetSeconds || 0);

  if (!video || !canvas || !startButton || !stopButton) return;

  const context = canvas.getContext('2d');
  let stream = null;
  let hands = null;
  let frameId = 0;
  let lastResultAt = 0;
  let lastFrameAt = 0;
  let processing = false;
  let runId = 0;
  let detectedSeconds = 0;

  function clearOverlay() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    handsCount.textContent = '0 manos';
    fpsLabel.textContent = 'En espera';
  }

  function resizeOverlay() {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function drawResults(results) {
    resizeOverlay();
    context.clearRect(0, 0, canvas.width, canvas.height);
    const landmarks = results.multiHandLandmarks || [];

    landmarks.forEach((hand) => {
      if (typeof window.drawConnectors === 'function' && window.HAND_CONNECTIONS) {
        window.drawConnectors(context, hand, window.HAND_CONNECTIONS, {
          color: '#d6ef55', lineWidth: Math.max(2, canvas.width / 420),
        });
      }
      if (typeof window.drawLandmarks === 'function') {
        window.drawLandmarks(context, hand, {
          color: '#ff7458', lineWidth: 1, radius: Math.max(2, canvas.width / 280),
        });
      }
    });

    handsCount.textContent = landmarks.length === 1 ? '1 mano' : `${landmarks.length} manos`;
    const now = performance.now();
    if (lastFrameAt) fpsLabel.textContent = `${Math.round(1000 / (now - lastFrameAt))} FPS aprox.`;
    lastFrameAt = now;

    if (landmarks.length && lastResultAt && now - lastResultAt <= 500) {
      detectedSeconds = Math.min(targetSeconds, detectedSeconds + Math.min(now - lastResultAt, 200) / 1000);
      const wholeSeconds = Math.floor(detectedSeconds);
      if (progressLabel) progressLabel.textContent = String(wholeSeconds);
      if (secondsInput) secondsInput.value = String(wholeSeconds);
      if (meter && targetSeconds) meter.style.width = `${Math.min(100, detectedSeconds / targetSeconds * 100)}%`;
      if (completeButton && targetSeconds && detectedSeconds >= targetSeconds) {
        completeButton.disabled = false;
        status.textContent = '¡Tiempo completado! Puedes guardar esta práctica.';
      }
    }
    lastResultAt = now;
  }

  async function processFrame(currentRun) {
    if (currentRun !== runId || !stream) return;
    if (!processing && hands && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      processing = true;
      try {
        await hands.send({ image: video });
      } catch (error) {
        if (currentRun === runId) {
          status.textContent = 'La detección perdió el acceso al vídeo. Apaga y vuelve a activar la cámara.';
          stopCamera(false);
        }
        return;
      } finally {
        processing = false;
      }
    }
    if (currentRun === runId && stream) frameId = requestAnimationFrame(() => processFrame(currentRun));
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = 'Este navegador no ofrece acceso a cámara. Usa localhost o una página HTTPS.';
      return;
    }
    if (typeof window.Hands !== 'function' || typeof window.drawConnectors !== 'function') {
      status.textContent = 'No se cargó MediaPipe Hands. Comprueba la conexión e inténtalo de nuevo.';
      return;
    }

    startButton.disabled = true;
    status.textContent = 'Solicitando acceso a la cámara…';
    const currentRun = ++runId;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (currentRun !== runId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      await video.play();
      if (cameraDisplay) cameraDisplay.classList.add('is-live');
      hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        selfieMode: false,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      hands.onResults(drawResults);
      if (typeof hands.initialize === 'function') await hands.initialize();
      if (currentRun !== runId) return;

      lastFrameAt = 0;
      lastResultAt = 0;
      stopButton.disabled = false;
      status.textContent = 'Detección activa. Mantén las manos visibles para avanzar.';
      frameId = requestAnimationFrame(() => processFrame(currentRun));
    } catch (error) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      stream = null;
      video.srcObject = null;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        status.textContent = 'Permiso denegado. Autoriza la cámara desde el navegador para practicar.';
      } else if (error.name === 'NotFoundError') {
        status.textContent = 'No se encontró una cámara disponible en este dispositivo.';
      } else {
        status.textContent = `No se pudo iniciar la detección: ${error.message || 'error desconocido'}`;
      }
      startButton.disabled = false;
    }
  }

  function stopCamera(updateStatus = true) {
    runId += 1;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    if (cameraDisplay) cameraDisplay.classList.remove('is-live');
    if (hands) {
      const activeHands = hands;
      hands = null;
      if (typeof activeHands.close === 'function') activeHands.close().catch(() => {});
    }
    processing = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    clearOverlay();
    if (updateStatus) status.textContent = 'La cámara está apagada.';
  }

  startButton.addEventListener('click', startCamera);
  stopButton.addEventListener('click', () => stopCamera());
  window.addEventListener('pagehide', () => stopCamera(false), { once: true });
})();

