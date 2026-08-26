import React, { useState, useRef, useEffect } from "react";
export default function Recorder({ videoRef }) {
  const [recording, setRecording] = useState(false);
  const [label, setLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [lastUrl, setLastUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startRecording = () => {
    const stream = videoRef.current?.srcObject;
    if (!stream) return alert("Inicia primero la cámara");
    chunksRef.current = [];
    try {
      const mr = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      mr.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar MediaRecorder en este navegador.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    if (!blob.size) return alert("Grabación vacía");
    const formData = new FormData();
    formData.append("clip", blob, `${label || "unlabeled"}-${Date.now()}.webm`);
    formData.append("label", label || "unlabeled");
    formData.append("source", "local-browser");
    try {
      setProgress(10);
      const response = await fetch("/api/upload-clip", {
        method: "POST",
        body: formData,
      });
      if (!response.ok)
        throw new Error("El backend local rechazó la grabación");
      const result = await response.json();
      setLastUrl(result.url);
      setProgress(100);
    } catch (error) {
      console.error(error);
      setProgress(0);
      alert("No se pudo guardar el video localmente. ¿Está activo el backend?");
    }
  };

  return (
    <div className="recorder">
      <h3>Grabador de muestra</h3>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Etiqueta (ej. palabra/signo)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        {!recording ? (
          <button onClick={startRecording}>Grabar (iniciar)</button>
        ) : (
          <button onClick={stopRecording}>Detener</button>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <div>Progreso: {progress}%</div>
        {lastUrl && (
          <div>
            <a href={lastUrl} target="_blank" rel="noreferrer">
              Ver última grabación
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
