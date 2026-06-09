/* ============================================================
   Boutique en ligne - Serveur securise
   - Auth serveur : bcrypt + JWT en cookie httpOnly (inaccessible au JS)
   - Anti-force brute par IP
   - API REST : produits, commandes, reglages, upload media
============================================================ */
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
// Necessaire derriere le proxy HTTPS des hebergeurs (Render, Railway...) pour les cookies securises
app.set('trust proxy', 1);

// Secret JWT : genere et persiste pour que les sessions survivent aux redemarrages
const PERSIST_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SECRET_FILE = path.join(PERSIST_DIR, '.jwtsecret');
function getSecret() {
  try { if (fs.existsSync(SECRET_FILE)) return fs.readFileSync(SECRET_FILE, 'utf8'); } catch (e) {}
  const s = crypto.randomBytes(48).toString('hex');
  try { fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true }); fs.writeFileSync(SECRET_FILE, s); } catch (e) {}
  return s;
}
const JWT_SECRET = getSecret();
const TOKEN_NAME = 'boutique_token';
const TOKEN_TTL = '8h';

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

/* -------------------- Upload media -------------------- */
// Photos/videos stockees sur le disque persistant en production
const UP_DIR = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : path.join(__dirname, 'uploads');
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UP_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 Mo max
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype) || /^video\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorise'));
  }
});

/* -------------------- Auth helpers -------------------- */
function signToken(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL }); }
// En production (hebergement), les plateformes definissent NODE_ENV=production
// et servent en HTTPS -> on active automatiquement le cookie securise.
const IS_PROD = process.env.NODE_ENV === 'production';
function setAuthCookie(res, token) {
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,           // inaccessible au JavaScript -> protege du vol XSS
    sameSite: IS_PROD ? 'none' : 'strict', // 'none' requis pour HTTPS multi-origine
    secure: IS_PROD,          // cookie envoye uniquement via HTTPS en production
    maxAge: 8 * 60 * 60 * 1000
  });
}
// Middleware : exige une session admin valide
function requireAdmin(req, res, next) {
  const token = req.cookies[TOKEN_NAME];
  if (!token) return res.status(401).json({ error: 'non_authentifie' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'session_invalide' });
  }
}

/* -------------------- Anti-force brute (par IP) -------------------- */
const attempts = {}; // ip -> { count, until }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;
function ipOf(req) { return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'; }
function isLocked(ip) { const a = attempts[ip]; return a && a.until > Date.now(); }
function lockRemaining(ip) { const a = attempts[ip]; return a ? Math.max(0, Math.ceil((a.until - Date.now()) / 60000)) : 0; }
function recordFail(ip) {
  const a = attempts[ip] || { count: 0, until: 0 };
  a.count++;
  if (a.count >= MAX_ATTEMPTS) { a.until = Date.now() + LOCK_MS; a.count = 0; }
  attempts[ip] = a;
}
function resetFail(ip) { delete attempts[ip]; }

/* ============================================================
   API publique (boutique cote client)
============================================================ */

// Etat public : reglages + produits (jamais les donnees admin)
app.get('/api/shop', (req, res) => {
  const d = db.load();
  res.json({
    settings: d.settings,
    products: d.products,
    configured: !!d.admin   // pour savoir s'il faut afficher l'ecran de creation
  });
});

// Passer une commande (public)
app.post('/api/orders', (req, res) => {
  const d = db.load();
  const b = req.body || {};
  if (!b.customer || !b.customer.name || !b.customer.email || !b.customer.address || !b.customer.wilaya) {
    return res.status(400).json({ error: 'champs_manquants' });
  }
  if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ error: 'panier_vide' });

  // Recalcul cote serveur (ne jamais faire confiance au client pour les prix)
  let subtotal = 0;
  const items = [];
  for (const it of b.items) {
    const p = d.products.find(x => x.id === it.id);
    if (!p) continue;
    const qty = Math.max(1, parseInt(it.qty) || 1);
    if (p.stock < qty) return res.status(400).json({ error: 'stock_insuffisant', product: p.name });
    items.push({ id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty });
    subtotal += p.price * qty;
  }
  if (!items.length) return res.status(400).json({ error: 'panier_vide' });

  const delivery = b.delivery === 'desk' ? 'desk' : 'home';
  const shipping = delivery === 'desk' ? (d.settings.deliveryDesk || 0) : (d.settings.deliveryHome || 0);

  // Decrementer le stock
  items.forEach(it => { const p = d.products.find(x => x.id === it.id); if (p) p.stock = Math.max(0, p.stock - it.qty); });

  const order = {
    id: d.nextOrderId++,
    customer: {
      name: String(b.customer.name).slice(0, 120),
      email: String(b.customer.email).slice(0, 120),
      phone: String(b.customer.phone || '').slice(0, 40),
      address: String(b.customer.address).slice(0, 300),
      wilaya: String(b.customer.wilaya).slice(0, 60),
      commune: String(b.customer.commune || '').slice(0, 60)
    },
    pay: ['cod', 'baridimob', 'ccp', 'cib'].includes(b.pay) ? b.pay : 'cod',
    delivery, shipping, subtotal,
    items, total: subtotal + shipping,
    status: 'new',
    date: new Date().toISOString()
  };
  d.orders.unshift(order);
  db.save();
  res.json({ ok: true, id: order.id });
});

/* ============================================================
   Authentification
============================================================ */

// Premier lancement : creer le compte admin (uniquement si aucun n'existe)
app.post('/api/auth/setup', async (req, res) => {
  const d = db.load();
  if (d.admin) return res.status(403).json({ error: 'deja_configure' });
  const { username, password } = req.body || {};
  if (!username || username.length < 3) return res.status(400).json({ error: 'username_court' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'password_court' });
  const passHash = await bcrypt.hash(password, 12);
  d.admin = { username: String(username).slice(0, 40), passHash };
  db.save();
  const token = signToken({ u: d.admin.username });
  setAuthCookie(res, token);
  res.json({ ok: true });
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
  const ip = ipOf(req);
  if (isLocked(ip)) return res.status(429).json({ error: 'verrouille', minutes: lockRemaining(ip) });
  const d = db.load();
  if (!d.admin) return res.status(400).json({ error: 'non_configure' });
  const { username, password } = req.body || {};
  const okUser = username === d.admin.username;
  const okPass = okUser && await bcrypt.compare(password || '', d.admin.passHash);
  if (!okUser || !okPass) {
    recordFail(ip);
    return res.status(401).json({ error: 'identifiants_invalides', attemptsLeft: Math.max(0, MAX_ATTEMPTS - (attempts[ip] ? attempts[ip].count : 0)) });
  }
  resetFail(ip);
  const token = signToken({ u: d.admin.username });
  setAuthCookie(res, token);
  res.json({ ok: true });
});

// Verifier la session
app.get('/api/auth/me', requireAdmin, (req, res) => {
  res.json({ ok: true, username: req.admin.u });
});

// Deconnexion
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(TOKEN_NAME);
  res.json({ ok: true });
});

// Changer le mot de passe
app.post('/api/auth/change-password', requireAdmin, async (req, res) => {
  const d = db.load();
  const { oldPassword, newPassword } = req.body || {};
  const ok = await bcrypt.compare(oldPassword || '', d.admin.passHash);
  if (!ok) return res.status(401).json({ error: 'ancien_incorrect' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'password_court' });
  d.admin.passHash = await bcrypt.hash(newPassword, 12);
  db.save();
  res.json({ ok: true });
});

/* ============================================================
   API admin protegee (requireAdmin sur tout)
============================================================ */

// Supprime les commandes annulees depuis plus de 24h. Renvoie true si modif.
function purgeCancelledOrders() {
  const d = db.load();
  // delai configurable (en heures) -> millisecondes ; 24h par defaut
  const DELAY = ((d.settings && d.settings.cancelDelay) || 24) * 60 * 60 * 1000;
  const before = d.orders.length;
  d.orders = d.orders.filter(o => {
    if (o.status === 'cancel' && o.cancelledAt) return (Date.now() - o.cancelledAt) < DELAY;
    return true;
  });
  if (d.orders.length !== before) { db.save(); return true; }
  return false;
}

// Toutes les donnees (dont commandes) pour le panneau admin
app.get('/api/admin/data', requireAdmin, (req, res) => {
  purgeCancelledOrders();            // nettoyage a la demande
  const d = db.load();
  res.json({ settings: d.settings, products: d.products, orders: d.orders });
});

// Reglages
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const d = db.load();
  const b = req.body || {};
  d.settings.shopName = String(b.shopName || 'Ma Boutique').slice(0, 80);
  d.settings.currency = String(b.currency || 'DA').slice(0, 10);
  d.settings.deliveryHome = parseInt(b.deliveryHome) || 0;
  d.settings.deliveryDesk = parseInt(b.deliveryDesk) || 0;
  // delai de suppression auto : uniquement 12, 24 ou 48 h
  d.settings.cancelDelay = [12, 24, 48].includes(parseInt(b.cancelDelay)) ? parseInt(b.cancelDelay) : 24;
  db.save();
  purgeCancelledOrders();           // applique immediatement le nouveau delai
  res.json({ ok: true, settings: d.settings });
});

// Creer un produit
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const d = db.load();
  const p = normalizeProduct(req.body, d.nextProductId++);
  d.products.push(p);
  db.save();
  res.json({ ok: true, product: p });
});

// Modifier un produit
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const d = db.load();
  const id = parseInt(req.params.id);
  const idx = d.products.findIndex(x => x.id === id);
  if (idx < 0) return res.status(404).json({ error: 'introuvable' });
  const updated = normalizeProduct(req.body, id);
  d.products[idx] = updated;
  db.save();
  res.json({ ok: true, product: updated });
});

// Supprimer un produit
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const d = db.load();
  const id = parseInt(req.params.id);
  d.products = d.products.filter(x => x.id !== id);
  db.save();
  res.json({ ok: true });
});

// Tout supprimer
app.delete('/api/admin/products', requireAdmin, (req, res) => {
  const d = db.load();
  d.products = [];
  db.save();
  res.json({ ok: true });
});

// Changer le statut d'une commande
app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const d = db.load();
  const id = parseInt(req.params.id);
  const o = d.orders.find(x => x.id === id);
  if (!o) return res.status(404).json({ error: 'introuvable' });
  const valid = ['new', 'prep', 'ship', 'done', 'cancel'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'statut_invalide' });
  o.status = req.body.status;
  // enregistrer le moment de l'annulation (pour suppression auto apres 24h)
  if (req.body.status === 'cancel') o.cancelledAt = Date.now();
  else delete o.cancelledAt;
  db.save();
  res.json({ ok: true });
});

// Upload d'une photo/video -> renvoie l'URL
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('media')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'aucun_fichier' });
    const type = /^video\//.test(req.file.mimetype) ? 'video' : 'image';
    res.json({ ok: true, url: '/uploads/' + req.file.filename, type });
  });
});

function normalizeProduct(b, id) {
  b = b || {};
  const name = String(b.name || '').slice(0, 120) || 'Sans nom';
  const desc = String(b.desc || '').slice(0, 500);
  const cat = String(b.cat || 'Divers').slice(0, 60);
  return {
    id,
    name: { fr: name, en: name },
    desc: { fr: desc, en: desc },
    cat: { fr: cat, en: cat },
    emoji: String(b.emoji || '📦').slice(0, 8),
    price: Math.max(0, parseFloat(b.price) || 0),
    oldPrice: b.oldPrice ? Math.max(0, parseFloat(b.oldPrice) || 0) : 0,
    isNew: !!b.isNew,
    isTop: !!b.isTop,
    stock: Math.max(0, parseInt(b.stock) || 0),
    media: String(b.media || '').slice(0, 300),
    mediaType: ['image', 'video'].includes(b.mediaType) ? b.mediaType : ''
  };
}

/* -------------------- Fichiers statiques -------------------- */
app.use('/uploads', express.static(UP_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Nettoyage automatique des commandes annulees > 24h (toutes les heures + au demarrage)
purgeCancelledOrders();
setInterval(purgeCancelledOrders, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log('\n  🛍️  Boutique securisee demarree !');
  console.log('  ➜  Ouvrez : http://localhost:' + PORT + '\n');
});
