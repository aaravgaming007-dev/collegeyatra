// ─────────────────────────────────────────
//  CollegeYatra — Secure Express Backend
//  Credentials: bcrypt hashes from .env
//  Sessions:    express-session (server-side)
//  Auth:        NO credentials touch the frontend
// ─────────────────────────────────────────

require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const multer         = require('multer');
const bcrypt         = require('bcryptjs');
const cors           = require('cors');
const fs             = require('fs');
const path           = require('path');
const crypto         = require('crypto');

// ── Validate environment ──────────────────
if (!process.env.ADMIN_USERNAME_HASH || !process.env.ADMIN_PASSWORD_HASH) {
  console.error('\n  ❌  Missing credentials in .env!');
  console.error('  Run: node setup.js\n');
  process.exit(1);
}

const app         = express();
const PORT        = parseInt(process.env.PORT) || 3000;
const DATA_FILE   = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ── Default images ────────────────────────
const DEFAULT_IMAGES = [
  { id: 'default-1', src: 'pic1.jpeg',  caption: 'Celebration on the stairs — Convocation Day', isDefault: true },
  { id: 'default-2', src: 'pic2.jpeg',  caption: 'Throwing caps — a tradition of triumph',       isDefault: true },
  { id: 'default-3', src: 'pic3.jpeg',  caption: 'Outside Patna University — pride & joy',       isDefault: true },
  { id: 'default-4', src: 'pic4.jpeg', caption: 'Friends forever — Convocation selfie',         isDefault: true },
  { id: 'default-5', src: 'pic5.jpeg',  caption: 'Degrees in hand — the moment we dreamed of',  isDefault: true },
  { id: 'default-6', src: 'pic6.jpeg',  caption: 'The whole squad — steps of glory',            isDefault: true },
  { id: 'default-7', src: 'pic7.jpeg',  caption: 'Certificate in hand — a proud moment',        isDefault: true },
];

// ── Ensure directories/files exist ────────
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw    = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { console.error('[DATA] Read error:', e.message); }
  writeData(DEFAULT_IMAGES);
  return [...DEFAULT_IMAGES];
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Multer (disk storage) ─────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, unique + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Middleware ────────────────────────────
// Trust proxy (required for hosting services like Render, Heroku, Vercel, Railway)
app.set('trust proxy', 1);

// Configure dynamic CORS with credentials support to allow decoupled deployments (e.g. Netlify/Vercel frontend + Render backend)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    // Allow all origins in development and production
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret:            process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave:            false,
  saveUninitialized: false,
  name:              'cy_sid',
  cookie: {
    httpOnly: true,      // JS cannot read this cookie
    // Use sameSite: 'none' and secure: true in production to support decoupled cross-site domains (e.g. Netlify -> Render)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure:   process.env.NODE_ENV === 'production' ? true : 'auto',
    maxAge:   8 * 60 * 60 * 1000,  // 8 hours
  },
}));

// Serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve all static site files
app.use(express.static(__dirname));

// ── Auth middleware ───────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ─────────────────────────────────────────
//  Auth API
// ─────────────────────────────────────────

// POST /api/auth/login
// Body: { username, password }
// Compares against bcrypt hashes in .env — credentials NEVER sent to client
app.post('/api/auth/login', async (req, res) => {
  const { username = '', password = '' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [userOk, passOk] = await Promise.all([
      bcrypt.compare(username.trim(), process.env.ADMIN_USERNAME_HASH),
      bcrypt.compare(password,        process.env.ADMIN_PASSWORD_HASH),
    ]);

    if (userOk && passOk) {
      req.session.isAdmin    = true;
      req.session.loginTime  = Date.now();
      console.log(`[AUTH] Admin logged in at ${new Date().toLocaleString()}`);
      return res.json({ success: true });
    }

    // Generic message — don't reveal which field is wrong
    console.warn(`[AUTH] Failed login attempt for user: "${username}"`);
    return res.status(401).json({ error: 'Invalid credentials.' });
  } catch (err) {
    console.error('[AUTH] Error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/auth/check — used by admin.html to detect existing session
app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: req.session?.isAdmin === true });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Could not log out.' });
    res.clearCookie('cy_sid');
    res.json({ success: true });
  });
});

// ─────────────────────────────────────────
//  Images API
// ─────────────────────────────────────────

// GET /api/images — PUBLIC — all visitors can see images
app.get('/api/images', (req, res) => {
  try {
    res.json(readData());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/images — PROTECTED — only admin can upload
app.post('/api/images', requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const data  = readData();
    const entry = {
      id:         Date.now().toString(),
      src:        'uploads/' + req.file.filename,
      caption:    (req.body.caption || '').trim() ||
                  req.file.originalname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      isDefault:  false,
      uploadedAt: new Date().toISOString(),
    };

    data.push(entry);
    writeData(data);
    console.log(`[UPLOAD] "${entry.caption}" → ${entry.src}`);
    res.status(201).json(entry);
  } catch (e) {
    console.error('[UPLOAD ERROR]', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/images/reset — PROTECTED — restore defaults
app.delete('/api/images/reset', requireAdmin, (req, res) => {
  try {
    const data = readData();
    data.filter(i => !i.isDefault).forEach(img => {
      const fp = path.join(__dirname, img.src);
      if (fs.existsSync(fp)) { fs.unlinkSync(fp); }
    });
    writeData([...DEFAULT_IMAGES]);
    console.log('[RESET] Gallery reset to defaults');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/images/:id — PROTECTED — delete one image
app.delete('/api/images/:id', requireAdmin, (req, res) => {
  try {
    let data = readData();
    const img = data.find(i => i.id === req.params.id);
    if (!img) return res.status(404).json({ error: 'Image not found.' });

    if (!img.isDefault) {
      const fp = path.join(__dirname, img.src);
      if (fs.existsSync(fp)) { fs.unlinkSync(fp); console.log(`[DELETE] File: ${fp}`); }
    }

    data = data.filter(i => i.id !== req.params.id);
    writeData(data);
    console.log(`[DELETE] "${img.caption}"`);
    res.json({ success: true });
  } catch (e) {
    console.error('[DELETE ERROR]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── Start ─────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      CollegeYatra  ·  Server Ready       ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Website  →  http://localhost:${PORT}        ║`);
  console.log(`  ║  Admin    →  http://localhost:${PORT}/admin  ║`);
  console.log('  ║  Auth     →  bcrypt  ·  express-session  ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
