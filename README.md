# 🛍️ Boutique en ligne sécurisée (version serveur)

Boutique e-commerce adaptée à l'Algérie, avec **authentification serveur inviolable**.
Bilingue FR/EN · Dinars (DA) · Livraison par wilaya · Photos/vidéos produits.

---

## 🚀 Démarrage rapide

### 1. Prérequis
- Installer **Node.js** (version 18 ou plus) : https://nodejs.org

### 2. Installer les dépendances (une seule fois)
```bash
cd boutique-serveur
npm install
```

### 3. Lancer le serveur
```bash
npm start
```

### 4. Ouvrir la boutique
Dans votre navigateur : **http://localhost:3000**

> ⚠️ **Important** : ouvrez l'adresse `http://localhost:3000` (servie par le serveur),
> et **non** le fichier `index.html` directement. Sinon l'API ne fonctionnera pas.

---

## 🔐 Première utilisation

1. Cliquez sur **⚙️ Admin**
2. Au tout premier lancement, on vous demande de **créer votre compte administrateur**
   (nom d'utilisateur + mot de passe). **Vous seul le connaîtrez.**
3. Ensuite, cet écran demandera vos identifiants à chaque connexion.

---

## 🛡️ Sécurité (vraiment inviolable cette fois)

| Mécanisme | Détail |
|-----------|--------|
| **Mots de passe bcrypt** | Hachés avec sel (coût 12). Jamais stockés en clair. |
| **Session JWT en cookie httpOnly** | Le jeton est **invisible au JavaScript** → protégé du vol (XSS). |
| **Cookie SameSite=strict** | Protège contre les attaques CSRF. |
| **Vérification 100% serveur** | Aucune donnée admin n'est envoyée tant qu'on n'est pas authentifié. Impossible à contourner depuis le navigateur. |
| **Anti-force brute par IP** | Blocage 5 minutes après 5 essais ratés. |
| **Prix recalculés serveur** | Les commandes recalculent prix et stock côté serveur (le client ne peut pas tricher). |

---

## 📁 Structure du projet

```
boutique-serveur/
├── server.js          → Serveur Express + API + authentification
├── db.js              → Base de données (fichier JSON, écriture atomique)
├── package.json       → Dépendances
├── public/
│   ├── index.html     → Interface de la boutique
│   └── app.js         → Logique du navigateur (appelle l'API)
├── data/
│   └── db.json        → Vos données (produits, commandes, compte admin) [créé au 1er lancement]
└── uploads/           → Photos et vidéos des produits [créé automatiquement]
```

---

## 💾 Sauvegarde

Pour sauvegarder toute votre boutique, copiez simplement les dossiers **`data/`** et **`uploads/`**.
Pour restaurer, remettez-les en place.

---

## 🌍 Mettre en ligne (hébergement)

Cette application peut être déployée sur :
- **Render**, **Railway**, **Fly.io** (simples, avec offres gratuites)
- Un **VPS** (OVH, Contabo, etc.) avec Node.js

En production, pensez à :
1. Mettre `secure: true` pour le cookie dans `server.js` (ligne `setAuthCookie`) si vous utilisez **HTTPS** (fortement recommandé).
2. Définir la variable d'environnement `PORT` si votre hébergeur l'impose.

---

## ❓ Mot de passe oublié ?

Le mot de passe est haché et irrécupérable (c'est voulu). Pour repartir à zéro,
supprimez le fichier `data/db.json` puis relancez : vous pourrez recréer un compte.
⚠️ Cela efface aussi produits et commandes — pensez à sauvegarder avant.
