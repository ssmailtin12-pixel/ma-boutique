/* ============================================================
   Base de donnees simple : fichier JSON avec ecriture atomique.
   Aucune dependance native -> fonctionne partout (Windows, Linux, Mac).
============================================================ */
const fs = require('fs');
const path = require('path');

// En production, on utilise le disque persistant (variable DATA_DIR fournie par l'hebergeur).
// En local, on utilise le dossier "data" du projet.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DB = {
  settings: {
    shopName: 'Ma Boutique',
    currency: 'DA',
    deliveryHome: 600,
    deliveryDesk: 400,
    cancelDelay: 24
  },
  // Le compte admin est cree au premier lancement (setup).
  admin: null, // { username, passHash }
  products: [
    { id: 1, name:{fr:"Casque audio sans fil",en:"Wireless headphones"}, desc:{fr:"Son immersif, 30h d'autonomie.",en:"Immersive sound, 30h battery."}, cat:{fr:"Électronique",en:"Electronics"}, emoji:"🎧", price:8900, oldPrice:11900, isTop:true, stock:12, media:"/images/casque.jpg", mediaType:"image" },
    { id: 2, name:{fr:"T-shirt coton bio",en:"Organic cotton t-shirt"}, desc:{fr:"Doux, confortable, durable.",en:"Soft, comfy, sustainable."}, cat:{fr:"Mode",en:"Fashion"}, emoji:"👕", price:1800, isTop:true, stock:40, media:"/images/tshirt.jpg", mediaType:"image" },
    { id: 3, name:{fr:"Mug céramique",en:"Ceramic mug"}, desc:{fr:"350ml, va au lave-vaisselle.",en:"350ml, dishwasher safe."}, cat:{fr:"Maison",en:"Home"}, emoji:"☕", price:900, stock:3, media:"/images/mug.jpg", mediaType:"image" },
    { id: 4, name:{fr:"Sac à dos urbain",en:"Urban backpack"}, desc:{fr:"Compartiment laptop 15\".",en:"15\" laptop compartment."}, cat:{fr:"Accessoires",en:"Accessories"}, emoji:"🎒", price:6500, stock:8, media:"/images/sac.jpg", mediaType:"image" },
    { id: 5, name:{fr:"Lampe de bureau LED",en:"LED desk lamp"}, desc:{fr:"3 températures, USB.",en:"3 temperatures, USB."}, cat:{fr:"Maison",en:"Home"}, emoji:"💡", price:3200, isNew:true, stock:14, media:"/images/lampe.jpg", mediaType:"image" },
    { id: 6, name:{fr:"Bouteille isotherme",en:"Insulated bottle"}, desc:{fr:"Garde au chaud 12h.",en:"Keeps hot for 12h."}, cat:{fr:"Accessoires",en:"Accessories"}, emoji:"🍶", price:1500, stock:25, media:"/images/bouteille.jpg", mediaType:"image" },
    { id: 7, name:{fr:"Clavier mécanique",en:"Mechanical keyboard"}, desc:{fr:"Switches tactiles, RGB.",en:"Tactile switches, RGB."}, cat:{fr:"Électronique",en:"Electronics"}, emoji:"⌨️", price:7900, oldPrice:9300, isNew:true, stock:6, media:"/images/clavier.jpg", mediaType:"image" },
    { id: 8, name:{fr:"Carnet de notes",en:"Notebook"}, desc:{fr:"Papier recyclé, 200 pages.",en:"Recycled paper, 200 pages."}, cat:{fr:"Maison",en:"Home"}, emoji:"📒", price:600, stock:50, media:"/images/carnet.jpg", mediaType:"image" },
    { id: 9, name:{fr:"Smartphone 128 Go",en:"Smartphone 128GB"}, desc:{fr:"Écran 6.5\", double SIM, 5000mAh.",en:"6.5\" screen, dual SIM, 5000mAh."}, cat:{fr:"Électronique",en:"Electronics"}, emoji:"📱", price:32900, oldPrice:38900, isTop:true, stock:15, media:"/images/smartphone.jpg", mediaType:"image" },
    { id: 10, name:{fr:"Parfum oriental 100ml",en:"Oriental perfume 100ml"}, desc:{fr:"Senteur boisée longue tenue, coffret cadeau.",en:"Long-lasting woody scent, gift box."}, cat:{fr:"Parfums",en:"Perfumes"}, emoji:"🧴", price:4500, isTop:true, stock:30, media:"/images/parfum.jpg", mediaType:"image" },
    { id: 11, name:{fr:"Montre connectée",en:"Smartwatch"}, desc:{fr:"Appels, sport, cardio, étanche.",en:"Calls, sport, heart rate, waterproof."}, cat:{fr:"Électronique",en:"Electronics"}, emoji:"⌚", price:6900, oldPrice:8900, isNew:true, stock:20, media:"/images/montre.jpg", mediaType:"image" },
    { id: 12, name:{fr:"Friteuse sans huile 5L",en:"Air fryer 5L"}, desc:{fr:"Cuisson saine, 1500W, minuterie.",en:"Healthy cooking, 1500W, timer."}, cat:{fr:"Électroménager",en:"Appliances"}, emoji:"🍟", price:13900, oldPrice:16900, isTop:true, stock:10, media:"/images/friteuse.jpg", mediaType:"image" },
    { id: 13, name:{fr:"Baskets sport",en:"Sport sneakers"}, desc:{fr:"Légères et confortables, semelle souple.",en:"Light and comfy, soft sole."}, cat:{fr:"Mode",en:"Fashion"}, emoji:"👟", price:4900, isNew:true, stock:25, media:"/images/baskets.jpg", mediaType:"image" },
    { id: 14, name:{fr:"Robot pâtissier",en:"Stand mixer"}, desc:{fr:"6.5L, 1200W, pour gâteaux et pain.",en:"6.5L, 1200W, for cakes and bread."}, cat:{fr:"Électroménager",en:"Appliances"}, emoji:"🎂", price:18900, stock:8, media:"/images/robot.jpg", mediaType:"image" },
    { id: 15, name:{fr:"Power bank 20000mAh",en:"Power bank 20000mAh"}, desc:{fr:"Charge rapide, 2 ports USB.",en:"Fast charge, 2 USB ports."}, cat:{fr:"Accessoires",en:"Accessories"}, emoji:"🔋", price:2900, oldPrice:3900, isNew:true, stock:40, media:"/images/powerbank.jpg", mediaType:"image" },
    { id: 16, name:{fr:"Abaya brodée",en:"Embroidered abaya"}, desc:{fr:"Tissu fluide, coupe élégante.",en:"Flowing fabric, elegant cut."}, cat:{fr:"Mode",en:"Fashion"}, emoji:"🥻", price:5500, isTop:true, stock:18, media:"/images/abaya.jpg", mediaType:"image" }
  ],
  orders: [],
  nextProductId: 17,
  nextOrderId: 1001
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_FILE)) {
      cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // garde-fou : champs manquants
      cache.settings = cache.settings || { ...DEFAULT_DB.settings };
      cache.products = cache.products || [];
      cache.orders = cache.orders || [];
      if (cache.admin === undefined) cache.admin = null;
      if (cache.nextProductId == null) cache.nextProductId = 1;
      if (cache.nextOrderId == null) cache.nextOrderId = 1001;
      return cache;
    }
  } catch (e) {
    console.error('Erreur lecture DB, reinitialisation :', e.message);
  }
  cache = JSON.parse(JSON.stringify(DEFAULT_DB));
  save();
  return cache;
}

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // ecriture atomique : ecrire dans un fichier temporaire puis renommer
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

module.exports = { load, save, DEFAULT_DB };
