const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const lessonsPath = path.join(dataDir, 'lessons.json');
const progressPath = path.join(dataDir, 'progress.json');
const usersPath = path.join(dataDir, 'users.json');
if (!fs.existsSync(lessonsPath)) {
  fs.writeFileSync(lessonsPath, JSON.stringify([
    { id: 'saludos', order: 1, title: 'Saludos', description: 'Aprende hola, adiós y gracias.' },
    { id: 'familia', order: 2, title: 'Familia', description: 'Practica palabras para hablar de tu familia.' },
    { id: 'cotidiano', order: 3, title: 'Vida cotidiana', description: 'Construye vocabulario útil para cada día.' }
  ], null, 2));
}
if (!fs.existsSync(progressPath)) fs.writeFileSync(progressPath, JSON.stringify({ completed: [], sessions: 0 }, null, 2));
if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, JSON.stringify([], null, 2));

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    cb(null, `${ts}-${file.originalname}`);
  }
});
const upload = multer({ storage });

app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/lessons', (req, res) => res.json(JSON.parse(fs.readFileSync(lessonsPath, 'utf8'))));
app.get('/api/progress', (req, res) => res.json(JSON.parse(fs.readFileSync(progressPath, 'utf8'))));
app.post('/api/register', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ ok: false, message: 'Correo y contraseña requeridos.' });
  }

  if (normalizedEmail !== normalizedPassword) {
    return res.status(400).json({ ok: false, message: 'En esta versión local, correo y contraseña deben coincidir exactamente.' });
  }

  const users = readUsers();
  const exists = users.some((user) => user.email === normalizedEmail);
  if (exists) {
    return res.status(409).json({ ok: false, message: 'Este usuario ya existe en la sesión local.' });
  }

  const user = {
    email: normalizedEmail,
    password: normalizedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return res.json({ ok: true, user: { email: normalizedEmail } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ ok: false, message: 'Escribe el correo y la contraseña.' });
  }

  if (normalizedEmail !== normalizedPassword) {
    return res.status(400).json({ ok: false, message: 'La contraseña debe coincidir con el correo en esta versión local.' });
  }

  const users = readUsers();
  const user = users.find((entry) => entry.email === normalizedEmail && entry.password === normalizedPassword);
  if (!user) {
    return res.status(401).json({ ok: false, message: 'Usuario no encontrado. Regístralo primero.' });
  }

  return res.json({ ok: true, user: { email: user.email } });
});

app.post('/api/progress', (req, res) => {
  const current = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  const next = {
    ...current,
    ...req.body,
    sessions: Number(req.body.sessions ?? current.sessions ?? 0),
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(progressPath, JSON.stringify(next, null, 2));
  res.json(next);
});
app.use('/uploads', express.static(uploadDir));

app.post('/api/upload-clip', upload.single('clip'), (req, res) => {
  // metadata in req.body, file in req.file
  const metadata = req.body || {};
  const file = req.file || null;
  // Save metadata alongside file
  if (file) {
    const metaPath = path.join(uploadDir, file.filename + '.json');
    fs.writeFileSync(metaPath, JSON.stringify({ metadata, filename: file.filename, originalname: file.originalname }, null, 2));
  }
  res.json({ ok: true, file: file ? file.filename : null, url: file ? `/uploads/${file.filename}` : null });
});

app.post('/api/metadata', (req, res) => {
  const meta = req.body || {};
  const id = Date.now();
  const metaPath = path.join(uploadDir, `${id}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  res.json({ ok: true, id });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
