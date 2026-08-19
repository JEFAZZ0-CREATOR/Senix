import React, { useRef, useEffect, useState } from "react";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const modelRef = useRef(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const onResults = async (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear and draw background
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw landmarks and handle multiple hands
    if (
      results.multiHandLandmarks &&
      window.drawConnectors &&
      window.drawLandmarks
    ) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        window.drawLandmarks(ctx, landmarks, {
          color: "#FF0000",
          lineWidth: 1,
        });

        // Labels disabled: only draw landmarks and connectors (guante de puntos)
        // Si más adelante quieres clasificador, reactivar classifyLandmarks(flat)
      }
    }

    ctx.restore();
  };

  const startCamera = async () => {
    try {
      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      video.srcObject = stream;
      await video.play();

      // Initialize MediaPipe Hands
      const hands = new window.Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        selfieMode: false,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      hands.onResults(onResults);

      const camera = new window.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 1280,
        height: 720,
      });
      camera.start();

      setRunning(true);
    } catch (err) {
      console.error("No se pudo acceder a la cámara:", err);
      alert("Habilita la cámara en tu navegador.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setRunning(false);
  };

  async function loadModelIfNeeded() {
    if (modelRef.current) return modelRef.current;
    if (!window.tf) return null;
    try {
      const model = await window.tf.loadLayersModel("/model/model.json");
      modelRef.current = model;
      return model;
    } catch (e) {
      return null;
    }
  }

  async function classifyLandmarks(flatArray) {
    const tf = window.tf;
    if (!tf) return null;
    const model = await loadModelIfNeeded();
    if (!model) return null;
    try {
      const input = tf.tensor([flatArray]);
      const out = model.predict(input);
      const scores = out.dataSync ? out.dataSync() : await out.data();
      const maxI = scores.indexOf(Math.max(...scores));
      return { label: `class_${maxI}`, confidence: scores[maxI] };
    } catch (e) {
      console.error("Error en clasificación:", e);
      return null;
    }
  }

  return (
    <div className="app">
      <h1>Aprende LSM — MVP</h1>
      <div className="video-area">
        <video ref={videoRef} className="video" playsInline muted />
        <canvas ref={canvasRef} className="overlay" />
      </div>
      <div className="controls">
        {!running ? (
          <button onClick={startCamera}>Iniciar cámara + detección</button>
        ) : (
          <button onClick={stopCamera}>Detener cámara</button>
        )}
        <button
          onClick={() =>
            alert(
              "Si tienes un modelo TF.js, colócalo en /model/model.json y se usaría automáticamente",
            )
          }
          disabled={!running}
        >
          Explicación modelo TF.js
        </button>
      </div>
      <section className="notes">
        <h2>Notas</h2>
        <ul>
          <li>
            Detección con MediaPipe Hands (client-side) y dibujo de landmarks.
          </li>
          <li>
            Si colocas un modelo TF.js en <code>/model/model.json</code>,
            intentaremos cargarlo y usarlo.
          </li>
          <li>
            Para entrenar: exporta un modelo Keras/TensorFlow que acepte
            vectores planos de 63 valores (21 puntos × 3) o adapta el
            preprocesado.
          </li>
        </ul>
      </section>
    </div>
  );
}
