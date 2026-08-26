Backend local de Senix LSM

Servidor Express para lecciones, progreso y muestras de entrenamiento. Todo se guarda en disco, sin Firebase.

Instalación y ejecución:

```bash
cd backend
npm install
npm start
```

API endpoints:
- `GET /api/ping` — comprueba que el servidor está arriba.
- `GET /api/lessons` — devuelve las lecciones iniciales desde `data/lessons.json`.
- `GET /api/progress` — devuelve el progreso local.
- `POST /api/progress` — actualiza el progreso en `data/progress.json`.
- `POST /api/upload-clip` — subir un archivo multipart (`clip` field) con metadatos en body.
- `POST /api/metadata` — subir solo metadatos JSON.

Los archivos y metadatos se guardan en `backend/uploads/`; el servidor crea `backend/data/` con sus JSON iniciales automáticamente.
