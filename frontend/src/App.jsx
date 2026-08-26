import React, { useEffect, useRef, useState } from "react";
import Recorder from "./Recorder";

const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"
  .split("")
  .map((letter, index) => ({ letter, index: index + 1 }));
const guides = {
  Hola: {
    category: "Saludos",
    duration: "45 s",
    intro:
      "Una bienvenida clara empieza con una mano relajada y una expresión abierta.",
    steps: [
      "Abre tu mano dominante con los dedos juntos.",
      "Lleva la palma cerca de la frente, sin tocarla.",
      "Aléjala suavemente hacia adelante mientras sonríes.",
    ],
  },
  Gracias: {
    category: "Saludos",
    duration: "50 s",
    intro: "Practica el recorrido de la mano desde la boca hacia el frente.",
    steps: [
      "Coloca la mano dominante abierta frente a la boca.",
      "Deslízala hacia adelante y ligeramente hacia abajo.",
      "Acompaña el gesto con una expresión amable.",
    ],
  },
  "Buenos días": {
    category: "Frases",
    duration: "1 min",
    intro: "Una frase sencilla para iniciar el día con confianza.",
    steps: [
      "Practica BUENOS con tu mano dominante.",
      "Añade DÍAS siguiendo el movimiento con ambas manos.",
      "Une ambas señas y mantén una expresión natural.",
    ],
  },
};

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [view, setView] = useState("inicio");
  const [running, setRunning] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({ completed: [], sessions: 0 });
  const [selectedGuide, setSelectedGuide] = useState("Hola");
  const [step, setStep] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState(alphabet[0]);
  const [phrase, setPhrase] = useState("Hola, buenos días");
  const [phraseSteps, setPhraseSteps] = useState([]);

  useEffect(() => {
    Promise.all([fetch("/api/lessons"), fetch("/api/progress")])
      .then(async ([lessonResponse, progressResponse]) => {
        if (!lessonResponse.ok || !progressResponse.ok)
          throw new Error("API unavailable");
        setLessons(await lessonResponse.json());
        setProgress(await progressResponse.json());
      })
      .catch(() =>
        setLessons([
          {
            id: "saludos",
            order: 1,
            title: "Saludos",
            description:
              "Hola, gracias y adiós para abrir cualquier conversación.",
          },
          {
            id: "familia",
            order: 2,
            title: "Familia",
            description:
              "Vocabulario para presentarte y hablar de quienes quieres.",
          },
          {
            id: "cotidiano",
            order: 3,
            title: "Vida cotidiana",
            description: "Frases útiles para practicar en situaciones reales.",
          },
        ]),
      );
  }, []);

  useEffect(
    () => () => {
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    results.multiHandLandmarks?.forEach((landmarks) => {
      window.drawConnectors?.(context, landmarks, window.HAND_CONNECTIONS, {
        color: "#d6ef55",
        lineWidth: 3,
      });
      window.drawLandmarks?.(context, landmarks, {
        color: "#ff7458",
        lineWidth: 2,
        radius: 4,
      });
    });
  };

  async function startCamera() {
    try {
      const video = videoRef.current;
      video.srcObject = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      await video.play();
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
        onFrame: () => hands.send({ image: video }),
        width: 1280,
        height: 720,
      });
      camera.start();
      setRunning(true);
    } catch (error) {
      console.error(error);
      alert("Habilita la cámara en tu navegador para practicar.");
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  }

  const openGuide = (title) => {
    setSelectedGuide(title);
    setStep(0);
    setView("leccion");
  };
  const saveSession = async () => {
    const next = { ...progress, sessions: (progress.sessions || 0) + 1 };
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setProgress(next);
  };
  const translatePhrase = () => {
    const words = phrase
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?!.,]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    setPhraseSteps(
      words.map((word) => ({
        word,
        guide:
          guides[
            word === "buenos" || word === "dias"
              ? "Buenos días"
              : word.charAt(0).toUpperCase() + word.slice(1)
          ],
      })),
    );
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <span className="eyebrow">SENIX / LSM</span>
          <h1>
            Aprende con tus manos<span className="title-dot">.</span>
          </h1>
        </div>
        <div className="top-status">
          <span className="pulse" /> Todo local
        </div>
      </header>
      <nav className="nav-tabs">
        {[
          ["inicio", "Inicio"],
          ["leccion", "Ruta guiada"],
          ["alfabeto", "Abecedario"],
          ["frases", "Construye frases"],
          ["muestras", "Dataset"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={view === key ? "active" : ""}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "inicio" && (
        <Home
          lessons={lessons}
          progress={progress}
          openGuide={openGuide}
          setView={setView}
        />
      )}
      {view === "leccion" && (
        <GuidedLesson
          title={selectedGuide}
          step={step}
          setStep={setStep}
          setView={setView}
        />
      )}
      {view === "practica" && (
        <Practice
          videoRef={videoRef}
          canvasRef={canvasRef}
          running={running}
          startCamera={startCamera}
          stopCamera={stopCamera}
          saveSession={saveSession}
        />
      )}
      {view === "alfabeto" && (
        <Alphabet
          selectedLetter={selectedLetter}
          setSelectedLetter={setSelectedLetter}
          setView={setView}
        />
      )}
      {view === "frases" && (
        <PhraseBuilder
          phrase={phrase}
          setPhrase={setPhrase}
          phraseSteps={phraseSteps}
          translatePhrase={translatePhrase}
          openGuide={openGuide}
        />
      )}
      {view === "muestras" && (
        <section className="dataset-view">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Entrenamiento local</span>
              <h2>Crea muestras</h2>
            </div>
            <span>Se guardan en tu equipo</span>
          </div>
          <Recorder videoRef={videoRef} />
        </section>
      )}
      <footer className="notes">
        <strong>
          SENIX <span>LOCAL BUILD 01</span>
        </strong>
        <span>
          Progreso en <code>backend/data/progress.json</code> · videos en{" "}
          <code>backend/uploads/</code>
        </span>
      </footer>
    </div>
  );
}

function Home({ lessons, progress, openGuide, setView }) {
  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Tu laboratorio de LSM</span>
          <h2>Las manos también cuentan historias.</h2>
          <p>
            Aprende señas mexicanas con guías visuales, práctica en cámara y
            frases que puedes construir a tu ritmo.
          </p>
          <button className="primary" onClick={() => openGuide("Hola")}>
            Empezar con Hola <span>↗</span>
          </button>
        </div>
        <div className="hero-orbit">
          <div className="orbit-label">
            RUTA
            <br />
            <strong>01</strong>
          </div>
          <div className="orbit-hand">✋</div>
          <div className="orbit-line" />
        </div>
      </section>
      <section className="dashboard-grid">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Explora</span>
            <h2>Tu mapa de aprendizaje</h2>
          </div>
          <span>{progress.sessions || 0} sesiones locales</span>
        </div>
        <article
          className="feature-card feature-card-wide"
          onClick={() => openGuide("Hola")}
        >
          <div className="card-index">01 / SALUDOS</div>
          <h3>Abre la conversación</h3>
          <p>
            Hola, gracias y adiós explicados con movimiento, postura y ritmo.
          </p>
          <button>
            Ver guía <span>→</span>
          </button>
        </article>
        <article className="feature-card" onClick={() => setView("alfabeto")}>
          <div className="card-index lime">02 / MANUAL</div>
          <h3>El abecedario</h3>
          <p>Explora las 27 letras y crea tu propio vocabulario.</p>
          <button>
            Explorar <span>→</span>
          </button>
        </article>
        <article
          className="feature-card dark-card"
          onClick={() => setView("frases")}
        >
          <div className="card-index">03 / FRASES</div>
          <h3>Di algo tuyo</h3>
          <p>Escribe una oración y conviértela en una ruta de práctica.</p>
          <button>
            Probar traductor <span>→</span>
          </button>
        </article>
      </section>
      <section className="lesson-list">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Biblioteca</span>
            <h2>Lecciones iniciales</h2>
          </div>
          <span>{lessons.length} disponibles</span>
        </div>
        {lessons.map((lesson) => (
          <button
            className="lesson-row"
            key={lesson.id}
            onClick={() =>
              openGuide(lesson.title === "Saludos" ? "Hola" : "Buenos días")
            }
          >
            <span>0{lesson.order}</span>
            <strong>{lesson.title}</strong>
            <small>{lesson.description}</small>
            <b>→</b>
          </button>
        ))}
      </section>
    </>
  );
}

function GuidedLesson({ title, step, setStep, setView }) {
  const content = guides[title] || guides.Hola;
  return (
    <section className="lesson-view">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Ruta guiada / {content.category}</span>
          <h2>{title}</h2>
        </div>
        <span>{content.duration}</span>
      </div>
      <div className="lesson-layout">
        <div className="gesture-stage">
          <div className="stage-top">
            <span>
              GESTO {String(step + 1).padStart(2, "0")} /{" "}
              {String(content.steps.length).padStart(2, "0")}
            </span>
            <span className="stage-live">● GUÍA ACTIVA</span>
          </div>
          <div className="gesture-illustration">
            <span className="gesture-number">{step + 1}</span>
            <div className="hand-symbol">
              {step === 0 ? "✋" : step === 1 ? "🤚" : "🖐"}
            </div>
            <div className="scan-line" />
          </div>
          <div className="stage-caption">
            <strong>Observa el recorrido</strong>
            <span>Después llévalo a la cámara y repítelo.</span>
          </div>
        </div>
        <div className="instruction-panel">
          <span className="eyebrow">Paso {step + 1}</span>
          <h3>{content.steps[step]}</h3>
          <p>{content.intro}</p>
          <div className="step-track">
            {content.steps.map((_, index) => (
              <button
                key={index}
                className={
                  index === step ? "current" : index < step ? "done" : ""
                }
                onClick={() => setStep(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="instruction-actions">
            <button className="secondary" onClick={() => setView("practica")}>
              Practicar con cámara
            </button>
            <button
              className="primary"
              onClick={() => setStep((step + 1) % content.steps.length)}
            >
              Siguiente paso <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Practice({
  videoRef,
  canvasRef,
  running,
  startCamera,
  stopCamera,
  saveSession,
}) {
  return (
    <section className="practice-view">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Laboratorio / Feedback visual</span>
          <h2>Practica frente a la cámara</h2>
        </div>
        <span>{running ? "Cámara activa" : "Lista para empezar"}</span>
      </div>
      <div className="video-area">
        <video ref={videoRef} className="video" playsInline muted />
        <canvas ref={canvasRef} className="overlay" />
        <div className="video-label">
          LANDMARK TRACKING <span>●</span>
        </div>
      </div>
      <div className="controls">
        {!running ? (
          <button onClick={startCamera}>Iniciar cámara + detección</button>
        ) : (
          <button onClick={stopCamera}>Detener cámara</button>
        )}
        <button className="secondary" onClick={saveSession}>
          Guardar sesión local
        </button>
      </div>
      <div className="practice-tip">
        <strong>Tip de postura</strong>
        <span>
          Coloca tus manos dentro del marco y deja espacio entre los dedos para
          que el mapeo sea preciso.
        </span>
      </div>
    </section>
  );
}

function Alphabet({ selectedLetter, setSelectedLetter, setView }) {
  return (
    <section className="alphabet-view">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Manual / 27 símbolos</span>
          <h2>Abecedario LSM</h2>
        </div>
        <span>Explora una letra</span>
      </div>
      <div className="alphabet-layout">
        <div className="letter-display">
          <div className="display-meta">
            <span>LETRA SELECCIONADA</span>
            <span>0{selectedLetter.index} / 27</span>
          </div>
          <div className="letter-giant">{selectedLetter.letter}</div>
          <div className="letter-visual">
            ✋<div className="visual-grid" />
          </div>
          <h3>Forma estática</h3>
          <p>
            Observa la referencia y practica la forma con la mano dominante.
          </p>
          <button className="primary" onClick={() => setView("practica")}>
            Practicar esta letra <span>↗</span>
          </button>
        </div>
        <div className="alphabet-grid">
          {alphabet.map((item) => (
            <button
              key={item.letter}
              className={
                selectedLetter.letter === item.letter ? "selected" : ""
              }
              onClick={() => setSelectedLetter(item)}
            >
              <span>{String(item.index).padStart(2, "0")}</span>
              <strong>{item.letter}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhraseBuilder({
  phrase,
  setPhrase,
  phraseSteps,
  translatePhrase,
  openGuide,
}) {
  return (
    <section className="phrases-view">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Constructor / Lenguaje real</span>
          <h2>Di lo que quieras decir</h2>
        </div>
        <span>Escribe una oración</span>
      </div>
      <div className="phrase-builder">
        <div className="phrase-input-area">
          <label htmlFor="phrase">Tu oración</label>
          <textarea
            id="phrase"
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
          />
          <button className="primary" onClick={translatePhrase}>
            Convertir en guía <span>→</span>
          </button>
          <p>
            Las palabras conocidas se vuelven señas guiadas; las demás se
            practican con deletreo manual.
          </p>
        </div>
        <div className="phrase-preview">
          <span className="eyebrow">Vista de práctica</span>
          <div className="speech-mark">“</div>
          <p>{phrase || "Tu frase aparecerá aquí"}</p>
          <div className="phrase-wave">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      {phraseSteps.length > 0 && (
        <div className="translation-results">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tu ruta</span>
              <h3>{phraseSteps.length} pasos para practicar</h3>
            </div>
          </div>
          <div className="translation-list">
            {phraseSteps.map((item, index) => (
              <button
                key={`${item.word}-${index}`}
                onClick={() =>
                  item.guide &&
                  openGuide(
                    item.word === "buenos" || item.word === "dias"
                      ? "Buenos días"
                      : item.word.charAt(0).toUpperCase() + item.word.slice(1),
                  )
                }
              >
                <span className="translation-index">0{index + 1}</span>
                <span>
                  <strong>{item.word}</strong>
                  <small>
                    {item.guide ? item.guide.category : "Deletreo manual"}
                  </small>
                </span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
