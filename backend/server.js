const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

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

app.post('/api/upload-clip', upload.single('clip'), (req, res) => {
  // metadata in req.body, file in req.file
  const metadata = req.body || {};
  const file = req.file || null;
  // Save metadata alongside file
  if (file) {
    const metaPath = path.join(uploadDir, file.filename + '.json');
    fs.writeFileSync(metaPath, JSON.stringify({ metadata, filename: file.filename, originalname: file.originalname }, null, 2));
  }
  res.json({ ok: true, file: file ? file.filename : null });
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
