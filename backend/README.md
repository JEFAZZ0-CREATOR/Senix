Backend (LSM)

Servidor Express mínimo para recibir clips y metadatos.

Instalación y ejecución:

```bash
cd backend
npm install
npm start
```

API endpoints:
- `GET /api/ping` — comprueba que el servidor está arriba.
- `POST /api/upload-clip` — subir un archivo multipart (`clip` field) con metadatos en body.
- `POST /api/metadata` — subir solo metadatos JSON.

Los archivos y metadatos se guardan en `backend/uploads/`.
