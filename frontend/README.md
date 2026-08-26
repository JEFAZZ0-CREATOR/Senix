Frontend local de Senix LSM

Cliente React/Vite para practicar LSM con cámara, overlay de puntos y grabación de muestras. No requiere Firebase ni credenciales externas.

Instalación y ejecución:

```bash
cd frontend
npm install
npm run dev
```

El frontend espera el backend en `http://localhost:3001`. Vite redirige automáticamente `/api` y `/uploads` al backend durante el desarrollo.
