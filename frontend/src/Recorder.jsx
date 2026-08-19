import React, { useState, useRef, useEffect } from "react";
import { storage, auth } from "./firebase";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

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
    // prepare upload
    const user = auth.currentUser;
    const uid = user ? user.uid : "anonymous";
    const ts = Date.now();
    const safeLabel = (label || "unlabeled").replace(/[^a-zA-Z0-9-_]/g, "_");
    const path = `dataset/${uid}/${safeLabel}_${ts}.webm`;
    const sRef = storageRef(storage, path);
    const meta = {
      contentType: "video/webm",
      customMetadata: { uid, label: label || "", timestamp: String(ts) },
    };

    const uploadTask = uploadBytesResumable(sRef, blob, meta);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );
        setProgress(pct);
      },
      (error) => {
        console.error(error);
        alert("Error subiendo video: " + error.message);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setLastUrl(url);
        setProgress(100);
        alert("Video subido a Firebase Storage");
      },
    );
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
