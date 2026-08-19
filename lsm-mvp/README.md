LSM MVP — Web PWA (React + Vite)

Resumen
- MVP para aprender Lengua de Señas Mexicana (LSM) con detección desde la cámara en el navegador.

Requisitos
- Node.js 18+

Instalación y ejecución

```bash
cd lsm-mvp
npm install
npm run dev
```

Instrucciones rápidas
- Abre `http://localhost:5173` (o la URL que indique Vite).
- Pulsa "Iniciar cámara" y permite el acceso.
- El botón "Ejecutar detección" es un placeholder donde integrarás MediaPipe/TF.js.

Integración sugerida
- Usa MediaPipe Hands/Pose (Web) o la versión JS de Blaze/MediaPipe para extraer keypoints.
- Entrena un clasificador con TensorFlow.js o exporta un modelo desde PyTorch/TensorFlow al servidor y servir predicciones.
 
Detección integrada (MediaPipe + TF.js)
- El proyecto incluye una integración client-side con MediaPipe Hands cargada desde CDN.
- Si colocas un modelo TF.js en la ruta `/model/model.json` (formato `tf.loadLayersModel`), la app intentará cargarlo y usarlo para clasificar poses.

Prueba rápida del pipeline
```bash
cd lsm-mvp
npm install
npm run dev
```
- Abre la URL que indique Vite (ej. `http://localhost:5173`).
- Pulsa "Iniciar cámara + detección" y permite el acceso.
- Si tienes un modelo TF.js, colócalo en `lsm-mvp/dist/model/model.json` o en la carpeta raíz del servidor de desarrollo como `/model/model.json` antes de servir.

Firebase
- Copia tus credenciales a `src/firebaseConfig.js`.
- Puedes usar Firebase Auth + Firestore para usuarios y progreso, y Storage para guardar clips/frames etiquetados.

Siguientes pasos que puedo hacer:
- Añadir integración de MediaPipe Hands y un clasificador TF.js de ejemplo.
- Crear flujo de autenticación con Firebase.
- Añadir recolección/etiquetado desde la app.

Si quieres que siga, dime qué prefieres que implemente ahora.
