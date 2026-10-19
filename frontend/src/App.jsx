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
  Adiós: {
    category: "Saludos",
    duration: "40 s",
    intro: "Se realiza con un movimiento corto y claro con la palma.",
    steps: [
      "Abre la mano con los dedos relajados.",
      "Mueve la palma hacia afuera y hacia abajo.",
      "Cierra suavemente el gesto al final.",
    ],
  },
  Familia: {
    category: "Vocabulario",
    duration: "1 min",
    intro: "Este gesto ayuda a mencionar a tus personas cercanas.",
    steps: [
      "Forma una mano en forma de letra F con dedos alrededor del pecho.",
      "Gira la palma suavemente hacia el frente.",
      "Mantén la postura estable durante dos segundos.",
    ],
  },
};

const lessonCatalog = [
  {
    id: "saludos",
    order: 1,
    title: "Saludos básicos",
    description: "Hola, gracias y adiós para abrir cualquier conversación.",
    difficulty: "Básico",
    objective: "Presentarte y saludar con confianza.",
  },
  {
    id: "familia",
    order: 2,
    title: "Familia",
    description: "Vocabulario para hablar de tu entorno cercano.",
    difficulty: "Básico",
    objective: "Nombrar personas y relaciones.",
  },
  {
    id: "cotidiano",
    order: 3,
    title: "Vida cotidiana",
    description: "Frases útiles para rutinas diarias y acciones simples.",
    difficulty: "Intermedio",
    objective: "Usar frases que servirán en contexto real.",
  },
  {
    id: "verbos",
    order: 4,
    title: "Verbos y acciones",
    description: "Expresa verbos comunes como comer, ir, querer y hablar.",
    difficulty: "Intermedio",
    objective: "Relacionar acciones con personas y lugares.",
  },
];

const dictionaryData = [
  {
    word: "hola",
    type: "saludo",
    category: "Saludos",
    meaning: "Saludos iniciales",
    example: "Hola, ¿cómo estás?",
    tip: "Sigue un movimiento corto y visible.",
  },
  {
    word: "gracias",
    type: "agradecimiento",
    category: "Saludos",
    meaning: "Expresión de agradecimiento",
    example: "Gracias por tu ayuda",
    tip: "La palma se mueve desde la boca hacia adelante.",
  },
  {
    word: "familia",
    type: "sustantivo",
    category: "Vocabulario",
    meaning: "Personas cercanas",
    example: "Mi familia es grande",
    tip: "Usa la mano en forma de “F” y papalmas claras.",
  },
  {
    word: "comer",
    type: "verbo",
    category: "Verbos",
    meaning: "Ingerir alimentos",
    example: "Quiero comer",
    tip: "Mueve la mano hacia la boca con ritmo suave.",
  },
  {
    word: "beber",
    type: "verbo",
    category: "Verbos",
    meaning: "Tomar líquido",
    example: "Vamos a beber agua",
    tip: "La mano baja en un movimiento corto.",
  },
  {
    word: "trabajo",
    type: "sustantivo",
    category: "Vocabulario",
    meaning: "Lugar o actividad laboral",
    example: "Trabajo desde casa",
    tip: "Mano abierta, movimiento claro y estable.",
  },
  {
    word: "escuela",
    type: "sustantivo",
    category: "Vocabulario",
    meaning: "Sitio de estudio",
    example: "Voy a la escuela",
    tip: "Utiliza una línea recta con dedos firmes.",
  },
  {
    word: "caminar",
    type: "verbo",
    category: "Verbos",
    meaning: "Desplazarse a pie",
    example: "Camino todos los días",
    tip: "Mueve la mano como si se diera un paso.",
  },
  {
    word: "vivir",
    type: "verbo",
    category: "Verbos",
    meaning: "Estar presente / residir",
    example: "Vivo en México",
    tip: "Señal claro y sostenido.",
  },
  {
    word: "amor",
    type: "sustantivo",
    category: "Vocabulario",
    meaning: "Afecto y cariño",
    example: "Te quiero mucho",
    tip: "Vínculo con la expresión facial.",
  },
  {
    word: "ayer",
    type: "adverbio",
    category: "Frases",
    meaning: "Tiempo pasado",
    example: "Ayer vine temprano",
    tip: "Movimiento corto y firme.",
  },
  {
    word: "hoy",
    type: "adverbio",
    category: "Frases",
    meaning: "Tiempo presente",
    example: "Hoy quiero practicar",
    tip: "Muestra una dirección frente al cuerpo.",
  },
];

const exercises = [
  {
    id: "e1",
    title: "Ritmo de saludo",
    difficulty: "Básico",
    description: "Repasa saludos y practica movimiento limpio con la cámara.",
    goal: "Lograr la forma clara del gesto y mantenerlo estable 2 segundos.",
  },
  {
    id: "e2",
    title: "Frase corta",
    difficulty: "Básico",
    description: "Haz frases como “buenos días” y “gracias”.",
    goal: "Coordinar dos movimientos pequeños siguiendo el orden correcto.",
  },
  {
    id: "e3",
    title: "Verbos de acción",
    difficulty: "Intermedio",
    description: "Enseña verbos como comer, beber y caminar.",
    goal: "Manejar fluidez y precisión en movimiento.",
  },
  {
    id: "e4",
    title: "Vocabulario de casa",
    difficulty: "Intermedio",
    description: "Practica palabras lógicas para la rutina diaria.",
    goal: "Combinar palabras con contexto real y matices de expresión.",
  },
];

const landingFeatures = [
  {
    icon: "♡",
    title: "Lista de favoritos",
    text: "Guarda tus palabras y lecciones para estudiar más rápido y sin perder el ritmo.",
  },
  {
    icon: "◌",
    title: "Datos confiables",
    text: "Contenido local, ordenado y actualizado con una estructura clara para cada figura y práctica.",
  },
  {
    icon: "▤",
    title: "Análisis inteligente",
    text: "Sigue tu progreso con métricas visuales y desafíos pensados para aprender mejor.",
  },
];

const defaultProgress = { sessions: 0, completed: [] };

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [authStage, setAuthStage] = useState("landing");
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("senix-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [registerForm, setRegisterForm] = useState({ email: "", password: "" });
  const [authMessage, setAuthMessage] = useState("");
  const [view, setView] = useState("inicio");
  const [running, setRunning] = useState(false);
  const [lessons, setLessons] = useState(lessonCatalog);
  const [dictionary, setDictionary] = useState(dictionaryData);
  const [exerciseList, setExerciseList] = useState(exercises);
  const [progress, setProgress] = useState(defaultProgress);
  const [selectedGuide, setSelectedGuide] = useState("Hola");
  const [step, setStep] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState(alphabet[0]);
  const [phrase, setPhrase] = useState("Hola, buenos días");
  const [phraseSteps, setPhraseSteps] = useState([]);
  const [feedback, setFeedback] = useState("Coloca una mano dentro del marco");
  const [practiceResult, setPracticeResult] = useState(null);
  const practiceStats = useRef({
    frames: 0,
    detected: 0,
    centered: 0,
    movement: 0,
    lastWrist: null,
    quality: 0,
    actionStreak: 0,
    safe: 0,
    stable: 0,
    precision: 0,
  });
  const stepRef = useRef(0);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (user) {
      setAuthStage("app");
      localStorage.setItem("senix-user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    Promise.all([fetch("/api/lessons"), fetch("/api/progress")])
      .then(async ([lessonResponse, progressResponse]) => {
        if (lessonResponse.ok) {
          const lessonData = await lessonResponse.json();
          setLessons(lessonData.length ? lessonData : lessonCatalog);
        }
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setProgress(progressData || defaultProgress);
        }
      })
      .catch(() => {
        setLessons(lessonCatalog);
        setProgress(defaultProgress);
      });

    setDictionary(dictionaryData);
    setExerciseList(exercises);
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

    const landmarks = results.multiHandLandmarks?.[0];
    practiceStats.current.frames += 1;
    let frameGood = false;
    let frameColor = "#ff6374";

    if (landmarks) {
      const box = landmarks.reduce(
        (current, point) => ({
          minX: Math.min(current.minX, point.x),
          maxX: Math.max(current.maxX, point.x),
          minY: Math.min(current.minY, point.y),
          maxY: Math.max(current.maxY, point.y),
        }),
        { minX: 1, maxX: 0, minY: 1, maxY: 0 },
      );
      const centerX = (box.minX + box.maxX) / 2;
      const centerY = (box.minY + box.maxY) / 2;
      const width = box.maxX - box.minX;
      const height = box.maxY - box.minY;
      const centered =
        centerX > 0.22 && centerX < 0.78 && centerY > 0.18 && centerY < 0.82;
      const handSize = Math.hypot(
        landmarks[0].x - landmarks[9].x,
        landmarks[0].y - landmarks[9].y,
      );
      const handInFrame =
        handSize > 0.08 && handSize < 0.62 && width > 0.12 && height > 0.12;
      const previous = practiceStats.current.lastWrist;
      const movement = previous
        ? Math.hypot(landmarks[0].x - previous.x, landmarks[0].y - previous.y)
        : 0;
      if (previous) practiceStats.current.movement += movement;
      practiceStats.current.lastWrist = landmarks[0];
      practiceStats.current.detected += 1;
      if (centered) practiceStats.current.centered += 1;
      if (centered && handInFrame) practiceStats.current.safe += 1;

      const fingerTips = [8, 12, 16, 20];
      const fingerPips = [6, 10, 14, 18];
      const extendedFingers = fingerTips.filter(
        (tip, index) => landmarks[tip].y < landmarks[fingerPips[index]].y,
      ).length;
      const openness = extendedFingers >= 3;
      const stability =
        Math.abs(width - 0.22) < 0.18 && Math.abs(height - 0.28) < 0.18;
      const speed = movement > 0.004 && movement < 0.08;
      const actionReady =
        stepRef.current === 0
          ? openness && centered
          : stepRef.current === 1
            ? centered && stability
            : speed && centered;
      const precision = Math.min(
        100,
        Math.round(
          (Number(centered) * 35 +
            Number(handInFrame) * 25 +
            Number(openness || speed) * 20 +
            Number(stability) * 20) *
            100,
        ) / 100,
      );

      practiceStats.current.precision += precision;
      const goodFrame = centered && handInFrame && actionReady;
      frameGood = goodFrame;
      frameColor = goodFrame ? "#35e28b" : "#ff6374";
      practiceStats.current.quality += goodFrame ? 1 : 0;
      practiceStats.current.actionStreak = goodFrame
        ? practiceStats.current.actionStreak + 1
        : 0;
      practiceStats.current.stable += stability ? 1 : 0;

      let advanced = false;
      if (practiceStats.current.actionStreak >= 8) {
        practiceStats.current.actionStreak = 0;
        setStep((current) => (current + 1) % 3);
        advanced = true;
      }

      setFeedback(
        advanced
          ? "¡Muy bien! El paso se confirmó y avanzó."
          : goodFrame
            ? "Excelente · la mano está bien alineada y en movimiento correcto."
            : !centered
              ? "Ajusta la mano al centro del marco."
              : !handInFrame
                ? "Mueve la mano un poco más cerca del centro y evita que salga del encuadre."
                : "La forma o el movimiento aún no coincide con el gesto esperado.",
      );
    } else {
      frameColor = "#ff6374";
      setFeedback(
        "No detecto la mano · aumenta la luz o acerca la mano al marco.",
      );
    }

    results.multiHandLandmarks?.forEach((handLandmarks, handIndex) => {
      const color = handIndex === 0 ? frameColor : "#5ba6ff";
      window.drawConnectors?.(context, handLandmarks, window.HAND_CONNECTIONS, {
        color,
        lineWidth: 3,
      });
      window.drawLandmarks?.(context, handLandmarks, {
        color,
        lineWidth: 2,
        radius: 4,
      });
    });
  };

  async function startCamera() {
    try {
      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      video.srcObject = stream;
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
      practiceStats.current = {
        frames: 0,
        detected: 0,
        centered: 0,
        movement: 0,
        lastWrist: null,
        quality: 0,
        actionStreak: 0,
        safe: 0,
        stable: 0,
        precision: 0,
      };
      setPracticeResult(null);
      setFeedback("Buscando tu mano...");
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

  function finishPractice() {
    const stats = practiceStats.current;
    const detection = stats.frames ? stats.detected / stats.frames : 0;
    const framing = stats.detected ? stats.centered / stats.detected : 0;
    const motion = Math.min(stats.movement / 1.2, 1);
    const quality = stats.detected ? stats.quality / stats.detected : 0;
    const safety = stats.detected ? stats.safe / stats.detected : 0;
    const stability = stats.detected ? stats.stable / stats.detected : 0;
    const precision = stats.detected ? stats.precision / stats.detected : 0;
    const score = Math.round(
      (precision * 0.36 +
        quality * 0.22 +
        detection * 0.15 +
        framing * 0.12 +
        safety * 0.1 +
        stability * 0.05) *
        100,
    );
    setPracticeResult({
      score,
      detection: Math.round(detection * 100),
      framing: Math.round(framing * 100),
      motion: Math.round(motion * 100),
      quality: Math.round(quality * 100),
      safety: Math.round(safety * 100),
      stability: Math.round(stability * 100),
      precision: Math.round(precision),
    });
    stopCamera();
  }

  const openGuide = (title) => {
    setSelectedGuide(title);
    setStep(0);
    setView("lecciones");
  };

  const saveSession = async () => {
    const next = { ...progress, sessions: (progress.sessions || 0) + 1 };
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) setProgress(next);
    } catch (error) {
      console.error(error);
    }
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
          ] || null,
      })),
    );
  };

  const handleAuthField = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const email = registerForm.email.trim().toLowerCase();
    const password = registerForm.password.trim();

    if (!email || !password) {
      setAuthMessage("Escribe tu correo y la contraseña");
      return;
    }

    if (email !== password) {
      setAuthMessage(
        "En esta versión, el correo y la contraseña deben ser exactamente iguales.",
      );
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo registrar");
      }
      setUser({ email });
      setAuthMessage("Registro correcto");
      setAuthStage("app");
    } catch (error) {
      setAuthMessage(error.message || "Ocurrió un error al registrar");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const email = registerForm.email.trim().toLowerCase();
    const password = registerForm.password.trim();

    if (!email || !password) {
      setAuthMessage("Escribe tu correo y contraseña para entrar");
      return;
    }

    if (email !== password) {
      setAuthMessage(
        "La contraseña debe coincidir con el correo en esta versión local.",
      );
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar sesión");
      }
      setUser({ email });
      setAuthMessage("Sesión iniciada");
      setAuthStage("app");
    } catch (error) {
      setAuthMessage(error.message || "No se pudo iniciar sesión");
    }
  };

  if (!user && authStage !== "app") {
    return (
      <LandingScreen
        onStart={() => {
          setUser({ email: "demo@senix.local" });
          setAuthStage("app");
          setAuthMessage("");
        }}
        onDemo={() => {
          setUser({ email: "demo@senix.local" });
          setAuthStage("app");
          setAuthMessage("");
        }}
        onRegister={() => {
          setAuthStage("register");
          setAuthMessage("");
        }}
      />
    );
  }

  if (authStage === "register") {
    return (
      <AuthScreen
        title="Crear cuenta local"
        subtitle="Para esta versión, el correo y la contraseña deben ser iguales"
        email={registerForm.email}
        password={registerForm.password}
        onEmailChange={(value) => handleAuthField("email", value)}
        onPasswordChange={(value) => handleAuthField("password", value)}
        onSubmit={handleRegister}
        onLogin={handleLogin}
        message={authMessage}
        onBack={() => setAuthStage("landing")}
      />
    );
  }

  return (
    <AppShell
      user={user}
      view={view}
      setView={setView}
      lessonCatalog={lessons}
      dictionary={dictionary}
      exerciseList={exerciseList}
      progress={progress}
      selectedGuide={selectedGuide}
      setSelectedGuide={setSelectedGuide}
      step={step}
      setStep={setStep}
      selectedLetter={selectedLetter}
      setSelectedLetter={setSelectedLetter}
      phrase={phrase}
      setPhrase={setPhrase}
      phraseSteps={phraseSteps}
      setPhraseSteps={setPhraseSteps}
      feedback={feedback}
      practiceResult={practiceResult}
      videoRef={videoRef}
      canvasRef={canvasRef}
      running={running}
      startCamera={startCamera}
      stopCamera={stopCamera}
      finishPractice={finishPractice}
      saveSession={saveSession}
      openGuide={openGuide}
      translatePhrase={translatePhrase}
      onLogout={() => {
        setUser(null);
        localStorage.removeItem("senix-user");
        setAuthStage("landing");
      }}
    />
  );
}

function LandingScreen({ onStart, onRegister, onDemo }) {
  const pillars = [
    {
      icon: "◉",
      title: "Aprendizaje visual",
      text: "Cada gesto se guía con instrucciones, compás visual y práctica con cámara en tiempo real.",
    },
    {
      icon: "✦",
      title: "Abecedario completo",
      text: "Explora letras y sonidos del LSM con un enfoque claro para principiantes y continuidad.",
    },
    {
      icon: "◎",
      title: "Diccionario real",
      text: "Palabras, verbos y frases de uso diario para aprender en contexto y comunicarte mejor.",
    },
    {
      icon: "▣",
      title: "Ruta guiada",
      text: "Lecciones ordenadas, ejercicios y repeticiones para mantener una progresión consistente.",
    },
  ];

  const metrics = [
    { value: "150+", label: "gestos y palabras" },
    { value: "6", label: "módulos de estudio" },
    { value: "3", label: "niveles de práctica" },
    { value: "100%", label: "apoyo visual" },
  ];

  return (
    <div className="landing-shell">
      <div className="landing-panel">
        <header className="landing-header">
          <div className="brand-mini">
            <span className="brand-mark-small">S</span>
            <span>SENIX</span>
          </div>
          <nav className="landing-nav">
            <a href="#caracteristicas">Características</a>
            <a href="#ruta">Ruta de aprendizaje</a>
            <a href="#estadisticas">Progreso</a>
          </nav>
          <div className="header-actions">
            <button className="ghost-button" type="button" onClick={onRegister}>
              Iniciar sesión
            </button>
            <button
              className="primary cta-button"
              type="button"
              onClick={onRegister}
            >
              Registrarse
            </button>
          </div>
        </header>

        <section className="hero-split">
          <div className="landing-copy">
            <span className="eyebrow accent">
              LSM • tecnología + aprendizaje
            </span>
            <h1>
              Aprende <span>lenguaje de señas mexicano</span>
              <br />
              con una experiencia moderna y práctica.
            </h1>
            <p>
              SENIX combina visión artificial, lecciones guiadas, vocabulario
              real y ejercicios con cámara para que el usuario avance con
              claridad, confianza y ritmo desde el primer día.
            </p>

            <div className="landing-actions">
              <button
                className="primary"
                type="button"
                onClick={onStart || onDemo}
              >
                Entrar a la app
              </button>
              <button className="secondary" type="button" onClick={onRegister}>
                Crear cuenta
              </button>
            </div>

            <div className="trust-row">
              <span>✓ Detección con cámara</span>
              <span>✓ Abecedario LSM</span>
              <span>✓ Lecciones reales</span>
            </div>
          </div>

          <div className="landing-card">
            <div className="tech-window">
              <div className="window-top">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>

              <div className="signal-panel">
                <div className="signal-circle">✋</div>
                <div className="signal-copy">
                  <small>Reconocimiento activo</small>
                  <strong>Señal: Hola</strong>
                  <span>Precisión 94%</span>
                </div>
              </div>

              <div className="mini-chart">
                <span className="bar one" />
                <span className="bar two" />
                <span className="bar three" />
                <span className="bar four" />
                <span className="bar five" />
              </div>
            </div>
          </div>
        </section>

        <section className="feature-band" id="caracteristicas">
          {pillars.map((feature) => (
            <article className="feature-box" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="stats-band" id="estadisticas">
          {metrics.map((item) => (
            <div className="stat-card" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="showcase-grid" id="ruta">
          <div className="showcase-card large">
            <span className="eyebrow accent">Ruta de aprendizaje</span>
            <h3>Una experiencia diseñada para crecer paso a paso.</h3>
            <ul>
              <li>Saludo y presentación personal.</li>
              <li>Abecedario y composición de letras.</li>
              <li>Palabras, verbos y frases reales.</li>
              <li>Práctica con cámara y repeticiones guiadas.</li>
            </ul>
          </div>

          <div className="showcase-card">
            <span className="eyebrow accent">Diccionario</span>
            <h3>Vocabulario útil</h3>
            <p>
              Busca saludos, acciones, deseos, familia y expresiones del día a
              día.
            </p>
          </div>

          <div className="showcase-card">
            <span className="eyebrow accent">Práctica</span>
            <h3>Evaluación en vivo</h3>
            <p>
              El usuario puede entrar directamente a la sección principal y
              comenzar a aprender.
            </p>
          </div>
        </section>

        <section className="cta-panel">
          <div>
            <span className="eyebrow accent">Listo para empezar</span>
            <h3>Construye confianza y fluidez con cada gesto.</h3>
          </div>
          <div className="cta-actions">
            <button className="primary" type="button" onClick={onDemo}>
              Entrar a la app
            </button>
            <button className="secondary" type="button" onClick={onRegister}>
              Crear cuenta
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function AuthScreen({
  title,
  subtitle,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onLogin,
  message,
  onBack,
}) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <button className="nav-back" onClick={onBack}>
          ← Volver
        </button>
        <span className="eyebrow accent">Registro local</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="text"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Escribe el mismo correo"
            />
          </label>
          <button className="primary" type="submit">
            Registrar
          </button>
          <button type="button" className="secondary" onClick={onLogin}>
            Iniciar sesión
          </button>
        </form>
        {message && <div className="auth-message">{message}</div>}
      </div>
    </div>
  );
}

function AppShell({
  user,
  view,
  setView,
  lessonCatalog,
  dictionary,
  exerciseList,
  progress,
  selectedGuide,
  setSelectedGuide,
  step,
  setStep,
  selectedLetter,
  setSelectedLetter,
  phrase,
  setPhrase,
  phraseSteps,
  setPhraseSteps,
  feedback,
  practiceResult,
  videoRef,
  canvasRef,
  running,
  startCamera,
  stopCamera,
  finishPractice,
  saveSession,
  openGuide,
  translatePhrase,
  onLogout,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <strong>SENIX</strong>
            <small>{user?.email || "user"}</small>
          </div>
        </div>

        <nav className="side-nav">
          {[
            ["inicio", "Inicio"],
            ["lecciones", "Lecciones"],
            ["alfabeto", "Abecedario"],
            ["diccionario", "Diccionario"],
            ["ejercicios", "Ejercicios"],
            ["practica", "Práctica"],
            ["dataset", "Dataset"],
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

        <button className="logout-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="content-panel">
        {view === "inicio" && (
          <HomeView
            progress={progress}
            lessonCatalog={lessonCatalog}
            openGuide={openGuide}
            setView={setView}
          />
        )}

        {(view === "lecciones" || view === "leccion") && (
          <LessonsView lessonCatalog={lessonCatalog} openGuide={openGuide} />
        )}

        {view === "alfabeto" && (
          <AlphabetView
            alphabet={alphabet}
            selectedLetter={selectedLetter}
            setSelectedLetter={setSelectedLetter}
            setView={setView}
          />
        )}

        {view === "diccionario" && <DictionaryView dictionary={dictionary} />}

        {view === "ejercicios" && (
          <ExercisesView exerciseList={exerciseList} setView={setView} />
        )}

        {view === "practica" && (
          <PracticeView
            selectedGuide={selectedGuide}
            step={step}
            setStep={setStep}
            feedback={feedback}
            practiceResult={practiceResult}
            videoRef={videoRef}
            canvasRef={canvasRef}
            running={running}
            startCamera={startCamera}
            stopCamera={stopCamera}
            finishPractice={finishPractice}
            saveSession={saveSession}
          />
        )}

        {view === "dataset" && <DatasetView videoRef={videoRef} />}
      </main>
    </div>
  );
}

function HomeView({ progress, lessonCatalog, openGuide, setView }) {
  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="eyebrow accent">Tu ruta de aprendizaje</span>
          <h2>Domina el lenguaje de señas con estructura y práctica real.</h2>
          <p>
            Saludos, abecedario, verbos, frases y vocabularios útiles para la
            vida diaria, todo guiado por la cámara y el mapeo de la mano.
          </p>
          <div className="landing-actions compact">
            <button className="primary" onClick={() => openGuide("Hola")}>
              Empezar saludo
            </button>
            <button className="secondary" onClick={() => setView("alfabeto")}>
              Ver alfabeto
            </button>
          </div>
        </div>
        <div className="summary-box">
          <strong>{progress.sessions || 0}</strong>
          <span>sesiones locales</span>
        </div>
      </section>

      <section className="cards-grid">
        <div className="info-card wide">
          <span className="eyebrow accent">Lecciones</span>
          <h3>Ruta estructurada</h3>
          <p>
            Aprende desde saludos básicos hasta frases útiles para tu día a día.
          </p>
          <button className="text-button" onClick={() => setView("lecciones")}>
            Abrir lecciones
          </button>
        </div>
        <div className="info-card">
          <span className="eyebrow accent">Diccionario</span>
          <h3>Palabras y verbos</h3>
          <p>Busca conceptos reales para crear frases naturales.</p>
          <button
            className="text-button"
            onClick={() => setView("diccionario")}
          >
            Explorar
          </button>
        </div>
        <div className="info-card">
          <span className="eyebrow accent">Ejercicios</span>
          <h3>Práctica guiada</h3>
          <p>Ejercicios con instrucciones claras paso a paso.</p>
          <button className="text-button" onClick={() => setView("ejercicios")}>
            Ver retos
          </button>
        </div>
      </section>

      <section className="list-block">
        <div className="section-head">
          <div>
            <span className="eyebrow accent">Biblioteca</span>
            <h3>Lecciones recomendadas</h3>
          </div>
          <span>{lessonCatalog.length} módulos</span>
        </div>
        {lessonCatalog.map((lesson) => (
          <button
            className="lesson-row"
            key={lesson.id}
            onClick={() =>
              openGuide(
                lesson.title.includes("Saludos") ? "Hola" : "Buenos días",
              )
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

function LessonsView({ lessonCatalog, openGuide }) {
  return (
    <section className="module-view">
      <div className="section-head">
        <div>
          <span className="eyebrow accent">Lecciones</span>
          <h3>Curso guiado</h3>
        </div>
      </div>
      <div className="lesson-grid">
        {lessonCatalog.map((lesson) => (
          <article className="lesson-card" key={lesson.id}>
            <span className="lesson-tag">{lesson.difficulty}</span>
            <h4>{lesson.title}</h4>
            <p>{lesson.description}</p>
            <small>{lesson.objective}</small>
            <button
              className="secondary"
              onClick={() =>
                openGuide(
                  lesson.title.includes("Saludos")
                    ? "Hola"
                    : lesson.title.includes("Familia")
                      ? "Familia"
                      : "Buenos días",
                )
              }
            >
              Ver lección
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AlphabetView({
  alphabet,
  selectedLetter,
  setSelectedLetter,
  setView,
}) {
  return (
    <section className="alphabet-view">
      <div className="section-head">
        <div>
          <span className="eyebrow accent">Abecedario</span>
          <h3>Manual LSM</h3>
        </div>
      </div>
      <div className="alphabet-layout">
        <div className="letter-display">
          <div className="display-meta">
            <span>Seleccionada</span>
            <strong>{selectedLetter.letter}</strong>
          </div>
          <div className="letter-giant">{selectedLetter.letter}</div>
          <div className="letter-visual">✋</div>
          <button className="primary" onClick={() => setView("practica")}>
            Practicar letra
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

function DictionaryView({ dictionary }) {
  const [query, setQuery] = useState("");
  const filtered = dictionary.filter(
    (item) =>
      item.word.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="dictionary-view">
      <div className="section-head">
        <div>
          <span className="eyebrow accent">Diccionario</span>
          <h3>Palabras y verbos</h3>
        </div>
      </div>
      <input
        className="search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Busca una palabra o verbo"
      />
      <div className="dictionary-grid">
        {filtered.map((item) => (
          <article className="dict-card" key={`${item.word}-${item.category}`}>
            <span className="tag">{item.category}</span>
            <h4>{item.word}</h4>
            <small>{item.type}</small>
            <p>{item.meaning}</p>
            <strong>Ejemplo:</strong>
            <span>{item.example}</span>
            <em>{item.tip}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExercisesView({ exerciseList, setView }) {
  return (
    <section className="exercise-view">
      <div className="section-head">
        <div>
          <span className="eyebrow accent">Ejercicios</span>
          <h3>Práctica por niveles</h3>
        </div>
      </div>
      <div className="exercise-list">
        {exerciseList.map((exercise) => (
          <article className="exercise-card" key={exercise.id}>
            <span className="lesson-tag">{exercise.difficulty}</span>
            <h4>{exercise.title}</h4>
            <p>{exercise.description}</p>
            <strong>Objetivo</strong>
            <small>{exercise.goal}</small>
            <button className="secondary" onClick={() => setView("practica")}>
              Entrenar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PracticeView({
  selectedGuide,
  step,
  setStep,
  feedback,
  practiceResult,
  videoRef,
  canvasRef,
  running,
  startCamera,
  stopCamera,
  finishPractice,
  saveSession,
}) {
  const content = guides[selectedGuide] || guides.Hola;

  return (
    <section className="practice-view">
      <div className="section-head">
        <div>
          <span className="eyebrow accent">Práctica</span>
          <h3>Evaluación con cámara</h3>
        </div>
      </div>
      <div className="practice-stage">
        <div className="video-area">
          <video ref={videoRef} className="video" playsInline muted />
          <canvas ref={canvasRef} className="overlay" />
          <div className="video-label">TRACKING</div>
        </div>
        <aside className="practice-guide">
          <span className="eyebrow accent">Ejemplo activo</span>
          <h4>{selectedGuide}</h4>
          <div className="practice-hand">
            {step === 0 ? "✋" : step === 1 ? "🤚" : "🖐"}
          </div>
          <strong>{content.steps[step]}</strong>
          <p>{content.intro}</p>
          <div className="step-dots">
            {content.steps.map((_, index) => (
              <span key={index} className={index === step ? "live" : ""} />
            ))}
          </div>
          <button
            className="secondary"
            onClick={() => setStep((step + 1) % content.steps.length)}
          >
            Siguiente paso
          </button>
        </aside>
      </div>

      <div className="control-row">
        {!running ? (
          <button className="primary" onClick={startCamera}>
            Iniciar cámara + detección
          </button>
        ) : (
          <button className="primary" onClick={finishPractice}>
            Terminar y evaluar
          </button>
        )}
        <button className="secondary" onClick={stopCamera}>
          Detener cámara
        </button>
        <button className="secondary" onClick={saveSession}>
          Guardar sesión
        </button>
      </div>

      <div className="live-feedback">
        <span className="feedback-dot" />
        <strong>{running ? "Tracking en vivo" : "Esperando cámara"}</strong>
        <span>{feedback}</span>
      </div>

      {practiceResult && (
        <div className="score-panel">
          <div className="score-main">
            <span className="eyebrow accent">Resultado</span>
            <strong>
              {practiceResult.score}
              <small>%</small>
            </strong>
            <span>calidad de práctica</span>
          </div>
          <div className="score-details">
            <div>
              <span>Precisión</span>
              <strong>{practiceResult.precision}%</strong>
              <i>
                <b style={{ width: `${practiceResult.precision}%` }} />
              </i>
            </div>
            <div>
              <span>Forma</span>
              <strong>{practiceResult.quality}%</strong>
              <i>
                <b style={{ width: `${practiceResult.quality}%` }} />
              </i>
            </div>
            <div>
              <span>Detección</span>
              <strong>{practiceResult.detection}%</strong>
              <i>
                <b style={{ width: `${practiceResult.detection}%` }} />
              </i>
            </div>
            <div>
              <span>Encuadre</span>
              <strong>{practiceResult.framing}%</strong>
              <i>
                <b style={{ width: `${practiceResult.framing}%` }} />
              </i>
            </div>
            <div>
              <span>Seguridad</span>
              <strong>{practiceResult.safety}%</strong>
              <i>
                <b style={{ width: `${practiceResult.safety}%` }} />
              </i>
            </div>
            <div>
              <span>Velocidad</span>
              <strong>{practiceResult.motion}%</strong>
              <i>
                <b style={{ width: `${practiceResult.motion}%` }} />
              </i>
            </div>
            <div>
              <span>Estabilidad</span>
              <strong>{practiceResult.stability}%</strong>
              <i>
                <b style={{ width: `${practiceResult.stability}%` }} />
              </i>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DatasetView({ videoRef }) {
  return (
    <section className="dataset-view">
      <div className="section-head">
        <div>
          <span className="eyebrow accent">Dataset</span>
          <h3>Captura muestras locales</h3>
        </div>
      </div>
      <Recorder videoRef={videoRef} />
    </section>
  );
}

export default App;
