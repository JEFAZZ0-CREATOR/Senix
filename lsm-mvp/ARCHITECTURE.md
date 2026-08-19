Arquitectura técnica — LSM MVP

Objetivo
- Aplicación multiplataforma (web PWA + mobile) para enseñar Lengua de Señas Mexicana con detección por cámara y componentes de IA.

Componentes principales

1) Frontend (cliente)
- Stack: React + Vite (web PWA). Móvil: React Native / Expo (compartir lógica).
- Captura de cámara en navegador: API MediaDevices.
- Detección en cliente: MediaPipe Hands (keypoints) + Canvas overlay para visualización.
- Clasificación/Inferencia: TF.js (modelo liviano en cliente) o llamadas a API de inferencia en servidor para modelos pesados.
- UX: lecciones, práctica, evaluación en tiempo real, recolección de muestras para etiquetado.

2) Backend y Base de datos
- Inicial (gratis-friendly): Firebase (Auth, Firestore, Storage, Hosting). Alternativa: Supabase + Postgres.
- Firestore: almacenar usuarios, progreso, metadatos de clips y etiquetas.
- Storage: guardar clips/frames y datasets para entrenamiento.
- API (opcional): FastAPI / Node.js para servir inferencia si necesitas GPU o modelos no convertibles a TF.js.

3) Pipeline de ML
- Recolección: desde la app guardar videos/frames y metadatos (usuario, etiqueta, contexto).
- Etiquetado: UI para revisión por revisores/nativos; exportar dataset en formato TFRecord / CSV.
- Entrenamiento: notebooks/scripts en Python (TensorFlow/PyTorch) para entrenar modelos de clasificación y de secuencia (para oraciones).
- Export: modelo Keras -> tfjs_layers_model (si se quiere inferencia client-side) o contenerizar modelo para servir (TorchServe / Triton / FastAPI + GPU).

4) Inferencia
- Modo edge/browser: MediaPipe extrae keypoints y TF.js clasifica signos simples (rápido, sin dependencia servidor).
- Modo servidor: API REST gRPC que recibe keypoints o frames y devuelve etiqueta y confianza (útil para modelos grandes o RNN/transformers para frases).

5) Privacidad y consentimiento
- Pedir consentimiento para guardar imágenes/videos.
- Anonimizar metadatos y proteger archivos en Storage.
- Permitir borrar datos personales por usuario.

6) Despliegue
- Frontend: Firebase Hosting / Vercel / Netlify.
- Backend/Inferencia: Render / Cloud Run / AWS ECS con GPU si se necesita (pago).
- CI: GitHub Actions para tests, builds y despliegue.

7) Observabilidad y pruebas
- Logs de uso, métricas de inferencia (latencia/errores).
- Pruebas con usuarios nativos LSM para validación de calidad.

Roadmap corto (MVP)
1. Prototipo web con cámara y overlay (hecho).
2. Arquitectura técnica y pipeline (este documento).
3. Recolección y etiquetado de dataset inicial (palabras frecuentes y alfabeto).
4. Entrenamiento de modelo simple y despliegue TF.js en cliente.
5. Autenticación y guardado de progreso (Firebase).
6. Pruebas con usuarios nativos y refinamiento.

Notas técnicas
- Para reconocimiento de oraciones: usar modelos secuenciales (RNN/Transformer) sobre secuencias de keypoints temporalmente resampleadas.
- Asegurar sincronización entre resolución del video y normalización de landmarks (usar videoWidth/videoHeight para reescalar al dibujar).

Si quieres, genero un diagrama más detallado y archivos de infraestructura (ej. `firebase.json`, `cloudbuild.yaml`) y comienzo la etapa de recolección/etiquetado.
