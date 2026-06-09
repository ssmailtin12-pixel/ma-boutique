/* ============================================================
   Boutique securisee - Frontend
   Communique avec l'API serveur. L'authentification est geree
   cote serveur via cookie httpOnly (invisible/inviolable au JS).
============================================================ */
let lang='fr';
let cart={};                 // {productId: qty}
let activeCat='all';
let adminActiveTab='dash';
let shop={settings:{shopName:'Ma Boutique',currency:'DA',deliveryHome:600,deliveryDesk:400},products:[],configured:false};
let adminData={settings:{},products:[],orders:[]};
let adminUnlocked=false;

const WILAYAS=["01 - Adrar","02 - Chlef","03 - Laghouat","04 - Oum El Bouaghi","05 - Batna","06 - Béjaïa","07 - Biskra","08 - Béchar","09 - Blida","10 - Bouira","11 - Tamanrasset","12 - Tébessa","13 - Tlemcen","14 - Tiaret","15 - Tizi Ouzou","16 - Alger","17 - Djelfa","18 - Jijel","19 - Sétif","20 - Saïda","21 - Skikda","22 - Sidi Bel Abbès","23 - Annaba","24 - Guelma","25 - Constantine","26 - Médéa","27 - Mostaganem","28 - M'Sila","29 - Mascara","30 - Ouargla","31 - Oran","32 - El Bayadh","33 - Illizi","34 - Bordj Bou Arréridj","35 - Boumerdès","36 - El Tarf","37 - Tindouf","38 - Tissemsilt","39 - El Oued","40 - Khenchela","41 - Souk Ahras","42 - Tipaza","43 - Mila","44 - Aïn Defla","45 - Naâma","46 - Aïn Témouchent","47 - Ghardaïa","48 - Relizane","49 - Timimoun","50 - Bordj Badji Mokhtar","51 - Ouled Djellal","52 - Béni Abbès","53 - In Salah","54 - In Guezzam","55 - Touggourt","56 - Djanet","57 - El M'Ghair","58 - El Meniaa"];

/* -------------------- API helper -------------------- */
async function api(path, opts={}){
  const o=Object.assign({headers:{},credentials:'same-origin'},opts);
  if(o.body && !(o.body instanceof FormData)){o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.body);}
  const r=await fetch('/api'+path,o);
  let data={};try{data=await r.json();}catch(e){}
  if(!r.ok)throw Object.assign(new Error(data.error||'erreur'),{status:r.status,data});
  return data;
}

/* -------------------- i18n -------------------- */
const T={
  search:{fr:"Rechercher...",en:"Search..."},
  heroTitle:{fr:"Bienvenue dans la boutique",en:"Welcome to the shop"},
  heroSub:{fr:"Parcourez nos produits et commandez en quelques clics.",en:"Browse our products and order in a few clicks."},
  heroCta:{fr:"Voir le panier 🛒",en:"View cart 🛒"},
  all:{fr:"Tout",en:"All"},add:{fr:"Ajouter",en:"Add"},
  out:{fr:"Rupture",en:"Out of stock"},low:{fr:"Bientôt épuisé",en:"Low stock"},inStock:{fr:"En stock",en:"In stock"},
  noProd:{fr:"Aucun produit trouvé.",en:"No products found."},
  cartTitle:{fr:"Votre panier",en:"Your cart"},emptyCart:{fr:"Votre panier est vide.",en:"Your cart is empty."},
  total:{fr:"Total",en:"Total"},checkout:{fr:"Commander",en:"Checkout"},
  adminTitle:{fr:"Panneau d'administration",en:"Admin panel"},adminSub:{fr:"Gérez vos produits, commandes et stocks.",en:"Manage products, orders and stock."},
  backShop:{fr:"← Retour à la boutique",en:"← Back to shop"},logoutBtn:{fr:"🔒 Déconnexion",en:"🔒 Logout"},
  tabDash:{fr:"📊 Tableau de bord",en:"📊 Dashboard"},tabProd:{fr:"📦 Produits",en:"📦 Products"},tabOrd:{fr:"🧾 Commandes",en:"🧾 Orders"},tabSet:{fr:"🔧 Réglages",en:"🔧 Settings"},
  recentTitle:{fr:"Commandes récentes",en:"Recent orders"},
  prodMgrTitle:{fr:"Liste des produits",en:"Product list"},addProd:{fr:"+ Ajouter un produit",en:"+ Add product"},
  delAll:{fr:"🗑️ Tout supprimer",en:"🗑️ Delete all"},confirmDelAll:{fr:"Supprimer TOUS les produits ?",en:"Delete ALL products?"},allDeleted:{fr:"Tous les produits supprimés",en:"All products deleted"},
  prodFormAdd:{fr:"Ajouter un produit",en:"Add product"},prodFormEdit:{fr:"Modifier le produit",en:"Edit product"},
  coTitle:{fr:"Finaliser la commande",en:"Complete order"},confirmOrder:{fr:"Confirmer la commande",en:"Confirm order"},
  save:{fr:"Enregistrer",en:"Save"},cancel:{fr:"Annuler",en:"Cancel"},
  sProducts:{fr:"Produits",en:"Products"},sOrders:{fr:"Commandes",en:"Orders"},sRevenue:{fr:"Chiffre d'affaires",en:"Revenue"},sLow:{fr:"Stock faible/rupture",en:"Low/out of stock"},
  sSold:{fr:"Articles vendus",en:"Items sold"},bestTitle:{fr:"Articles vendus (détail)",en:"Items sold (details)"},noSales:{fr:"Aucune vente pour le moment.",en:"No sales yet."},thQtySold:{fr:"Quantité vendue",en:"Quantity sold"},thRevenue:{fr:"Recette",en:"Revenue"},
  thProd:{fr:"Produit",en:"Product"},thCat:{fr:"Catégorie",en:"Category"},thPrice:{fr:"Prix",en:"Price"},thStock:{fr:"Stock",en:"Stock"},thActions:{fr:"Actions",en:"Actions"},
  thOrder:{fr:"Commande",en:"Order"},thClient:{fr:"Client",en:"Customer"},thItems:{fr:"Articles",en:"Items"},thTotal:{fr:"Total",en:"Total"},thDate:{fr:"Date",en:"Date"},thStatus:{fr:"Statut",en:"Status"},
  edit:{fr:"Modifier",en:"Edit"},del:{fr:"Supprimer",en:"Delete"},noOrders:{fr:"Aucune commande pour le moment.",en:"No orders yet."},autoDelete:{fr:"Suppression auto dans",en:"Auto-delete in"},tagNew:{fr:"NOUVEAU",en:"NEW"},tagTop:{fr:"TOP VENTE",en:"BESTSELLER"},promoTitle:{fr:"🔥 Promotions",en:"🔥 Deals"},promoSub:{fr:"Profitez-en, offres limitées !",en:"Hurry, limited offers!"},
  st_new:{fr:"Nouvelle",en:"New"},st_prep:{fr:"En préparation",en:"Preparing"},st_ship:{fr:"Expédiée",en:"Shipped"},st_done:{fr:"Livrée",en:"Delivered"},st_cancel:{fr:"Annulée",en:"Cancelled"},
  lblPName:{fr:"Nom du produit",en:"Product name"},lblPDesc:{fr:"Description",en:"Description"},lblPCat:{fr:"Catégorie",en:"Category"},lblPEmoji:{fr:"Icône (emoji)",en:"Icon (emoji)"},lblPPrice:{fr:"Prix",en:"Price"},lblPStock:{fr:"Stock",en:"Stock"},
  lblPMedia:{fr:"Photo ou vidéo du produit",en:"Product photo or video"},removeMedia:{fr:"🗑️ Retirer",en:"🗑️ Remove"},uploading:{fr:"Envoi en cours…",en:"Uploading…"},
  lblPOldPrice:{fr:"Ancien prix (promo)",en:"Old price (sale)"},lblPIsNew:{fr:"Nouveau",en:"New"},lblPIsTop:{fr:"Top vente",en:"Bestseller"},
  lblCName:{fr:"Nom complet",en:"Full name"},lblCEmail:{fr:"Email",en:"Email"},lblCPhone:{fr:"Téléphone",en:"Phone"},lblCAddr:{fr:"Adresse de livraison",en:"Shipping address"},lblCPay:{fr:"Mode de paiement",en:"Payment method"},
  lblCWilaya:{fr:"Wilaya",en:"Province (Wilaya)"},lblCCommune:{fr:"Commune",en:"Municipality"},lblCDelivery:{fr:"Type de livraison",en:"Delivery type"},
  coSubLbl:{fr:"Sous-total",en:"Subtotal"},coShipLbl:{fr:"Frais de livraison",en:"Delivery fee"},coTotalLbl:{fr:"Total à payer",en:"Total to pay"},
  selectWilaya:{fr:"-- Choisir la wilaya --",en:"-- Select province --"},fillWilaya:{fr:"Veuillez choisir une wilaya.",en:"Please select a province."},
  delHome:{fr:"Domicile",en:"Home"},delDesk:{fr:"Stop Desk",en:"Stop Desk"},
  lblShopName:{fr:"Nom de la boutique",en:"Shop name"},lblCurrency:{fr:"Devise (symbole)",en:"Currency (symbol)"},lblDelHome:{fr:"Frais livraison à domicile",en:"Home delivery fee"},lblDelDesk:{fr:"Frais Stop Desk",en:"Stop Desk fee"},lblCancelDelay:{fr:"⏱️ Suppression auto des commandes annulées",en:"⏱️ Auto-delete cancelled orders after"},
  lblChangePw:{fr:"🔐 Changer le mot de passe admin",en:"🔐 Change admin password"},changePwBtn:{fr:"Mettre à jour le mot de passe",en:"Update password"},saveSet:{fr:"Enregistrer les réglages",en:"Save settings"},
  pinTitle:{fr:"Accès administrateur",en:"Admin access"},lblPin2:{fr:"Mot de passe administrateur",en:"Admin password"},lblLoginUser:{fr:"Nom d'utilisateur",en:"Username"},pinEnter:{fr:"Entrer",en:"Enter"},pinWrong:{fr:"Identifiants incorrects",en:"Wrong credentials"},
  setupNote:{fr:"🔐 Premier lancement : créez votre compte administrateur.",en:"🔐 First launch: create your admin account."},
  lblNewUser:{fr:"Nom d'utilisateur",en:"Username"},lblNewPw:{fr:"Mot de passe",en:"Password"},lblNewPw2:{fr:"Confirmer le mot de passe",en:"Confirm password"},
  pwTip:{fr:"Conseil : au moins 8 caractères, avec chiffres et lettres.",en:"Tip: at least 8 characters, with digits and letters."},createPwBtn:{fr:"Créer mon accès sécurisé",en:"Create my secure access"},
  accountCreated:{fr:"Compte sécurisé créé ✓",en:"Secure account created ✓"},pwTooShort:{fr:"Mot de passe trop court (min. 6).",en:"Password too short (min. 6)."},userTooShort:{fr:"Nom d'utilisateur trop court (min. 3).",en:"Username too short (min. 3)."},pwMismatch:{fr:"Les mots de passe ne correspondent pas.",en:"Passwords do not match."},
  attemptsLeft:{fr:"essai(s) restant(s)",en:"attempt(s) left"},locked:{fr:"Trop de tentatives. Réessayez dans ",en:"Too many attempts. Try again in "},
  loggedOut:{fr:"Déconnecté 🔒",en:"Logged out 🔒"},oldWrong:{fr:"Mot de passe actuel incorrect.",en:"Current password is wrong."},pwChanged:{fr:"Mot de passe mis à jour ✓",en:"Password updated ✓"},
  added:{fr:"Ajouté au panier ✓",en:"Added to cart ✓"},orderOk:{fr:"Commande passée ! N° ",en:"Order placed! No. "},prodSaved:{fr:"Produit enregistré ✓",en:"Product saved ✓"},prodDel:{fr:"Produit supprimé",en:"Product deleted"},setSaved:{fr:"Réglages enregistrés ✓",en:"Settings saved ✓"},
  confirmDel:{fr:"Supprimer ce produit ?",en:"Delete this product?"},fillName:{fr:"Veuillez renseigner un nom et un prix.",en:"Please enter a name and price."},fillCheckout:{fr:"Veuillez remplir nom, email et adresse.",en:"Please fill name, email and address."},noStock:{fr:"Stock insuffisant pour ",en:"Not enough stock for "},
  mediaTooBig:{fr:"Fichier trop volumineux (max 25 Mo).",en:"File too large (max 25 MB)."},confirmTitle:{fr:"Confirmation",en:"Confirmation"},confirmYes:{fr:"Confirmer",en:"Confirm"},confirmNo:{fr:"Annuler",en:"Cancel"},
  netErr:{fr:"Erreur réseau / serveur.",en:"Network/server error."}
};
function t(k){return (T[k]&&T[k][lang])||k;}
function L(o){if(o==null)return"";if(typeof o==='string')return o;return o[lang]||o.fr||o.en||"";}
function money(n){const c=(adminUnlocked?adminData.settings.currency:shop.settings.currency)||'DA';
  if(c==='DA'||c==='DZD'||c==='د.ج')return Math.round(Number(n)).toLocaleString(lang==='fr'?'fr-FR':'en-US')+' '+c;
  return c+Number(n).toFixed(2);}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function val(id){return document.getElementById(id).value.trim();}

/* -------------------- Chargement initial -------------------- */
async function init(){
  try{shop=await api('/shop');}catch(e){toast(t('netErr'));}
  // si deja connecte (cookie valide), on le sait
  try{await api('/auth/me');adminUnlocked=true;}catch(e){adminUnlocked=false;}
  render();
}

/* -------------------- Navigation -------------------- */
function go(view){
  if(view==='admin'&&!adminUnlocked){adminGate();return;}
  document.getElementById('shopView').classList.toggle('hidden',view!=='shop');
  document.getElementById('adminView').classList.toggle('hidden',view!=='admin');
  if(view==='admin')loadAndRenderAdmin();else render();
  window.scrollTo(0,0);
}

/* -------------------- Auth -------------------- */
async function adminGate(){
  if(adminUnlocked){go('admin');return;}
  // rafraichir l'etat configured
  try{shop=await api('/shop');}catch(e){}
  const setup=document.getElementById('authSetup'),login=document.getElementById('authLogin');
  if(!shop.configured){
    setup.classList.remove('hidden');login.classList.add('hidden');
    ['authNewUser','authNewPw','authNewPw2'].forEach(i=>document.getElementById(i).value='');
  }else{
    setup.classList.add('hidden');login.classList.remove('hidden');
    document.getElementById('loginUser').value='';document.getElementById('pinInput').value='';document.getElementById('authMsg').textContent='';
  }
  refreshAuthTexts();openModal('pinModal');
}
function refreshAuthTexts(){
  ['pinTitle','setupNote','lblNewUser','lblNewPw','lblNewPw2','pwTip','createPwBtn','lblLoginUser','lblPin2'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=t(id==='lblNewUser'?'lblNewUser':id);});
  document.getElementById('pinTitle').textContent=t('pinTitle');
  document.getElementById('setupNote').textContent=t('setupNote');
  document.getElementById('lblNewUser').textContent=t('lblNewUser');
  document.getElementById('lblNewPw').textContent=t('lblNewPw');
  document.getElementById('lblNewPw2').textContent=t('lblNewPw2');
  document.getElementById('pwTip').textContent=t('pwTip');
  document.getElementById('createPwBtn').textContent=t('createPwBtn');
  document.getElementById('lblLoginUser').textContent=t('lblLoginUser');
  document.getElementById('lblPin2').textContent=t('lblPin2');
  document.getElementById('pinBtn').textContent=t('pinEnter');
}
async function createAccount(){
  const u=val('authNewUser'),p1=document.getElementById('authNewPw').value,p2=document.getElementById('authNewPw2').value;
  if(u.length<3){toast(t('userTooShort'));return;}
  if(p1.length<6){toast(t('pwTooShort'));return;}
  if(p1!==p2){toast(t('pwMismatch'));return;}
  try{await api('/auth/setup',{method:'POST',body:{username:u,password:p1}});
    adminUnlocked=true;closeAll();toast(t('accountCreated'));go('admin');
  }catch(e){toast(t('netErr'));}
}
async function doLogin(){
  const u=val('loginUser'),p=document.getElementById('pinInput').value;
  const msg=document.getElementById('authMsg');
  try{await api('/auth/login',{method:'POST',body:{username:u,password:p}});
    adminUnlocked=true;closeAll();go('admin');
  }catch(e){
    if(e.status===429){msg.textContent=t('locked')+(e.data.minutes||5)+' min.';}
    else{const left=e.data&&e.data.attemptsLeft;msg.textContent=t('pinWrong')+(left!=null?' ('+left+' '+t('attemptsLeft')+')':'');}
    document.getElementById('pinInput').value='';
  }
}
async function adminLogout(){
  try{await api('/auth/logout',{method:'POST'});}catch(e){}
  adminUnlocked=false;go('shop');toast(t('loggedOut'));
}
async function changePassword(){
  const oldP=document.getElementById('setOldPw').value,n1=document.getElementById('setNewPw').value,n2=document.getElementById('setNewPw2').value;
  if(n1.length<6){toast(t('pwTooShort'));return;}
  if(n1!==n2){toast(t('pwMismatch'));return;}
  try{await api('/auth/change-password',{method:'POST',body:{oldPassword:oldP,newPassword:n1}});
    ['setOldPw','setNewPw','setNewPw2'].forEach(i=>document.getElementById(i).value='');toast(t('pwChanged'));
  }catch(e){toast(e.status===401?t('oldWrong'):t('netErr'));}
}

/* -------------------- Rendu boutique -------------------- */
function productCard(p){
  let sc='in',sl=t('inStock');
  if(p.stock<=0){sc='out';sl=t('out');}else if(p.stock<=5){sc='low';sl=t('low')+' ('+p.stock+')';}
  const dis=p.stock<=0?'disabled style="opacity:.5;cursor:not-allowed"':'';
  return `<div class="product"><div class="pimg">${productTags(p)}${mediaHTML(p)}</div><div class="pbody">
      <div class="pcat">${esc(L(p.cat))}</div><div class="pname">${esc(L(p.name))}</div><div class="pdesc">${esc(L(p.desc))}</div>
      <div class="prow"><span>${priceHTML(p)}</span><span class="stock ${sc}">${sl}</span></div>
      <button class="btn primary small" style="margin-top:6px" onclick="addToCart(${p.id})" ${dis}>+ ${t('add')}</button>
    </div></div>`;
}
function render(){
  applyStaticTexts();renderCats();renderPromos();
  const q=document.getElementById('searchInput').value.toLowerCase();
  const grid=document.getElementById('grid');
  let list=shop.products.filter(p=>{
    const inCat=activeCat==='all'||L(p.cat)===activeCat;
    const inQ=!q||L(p.name).toLowerCase().includes(q)||L(p.desc).toLowerCase().includes(q);
    return inCat&&inQ;
  });
  if(!list.length){grid.innerHTML=`<div class="empty">${t('noProd')}</div>`;return;}
  grid.innerHTML=list.map(productCard).join('');
}
function renderPromos(){
  const sec=document.getElementById('promoSection');
  const q=document.getElementById('searchInput').value.trim();
  const promos=shop.products.filter(p=>discountPct(p)>0);
  if(!promos.length||activeCat!=='all'||q){sec.classList.add('hidden');return;}
  document.getElementById('promoTitle').textContent=t('promoTitle');
  document.getElementById('promoSub').textContent=t('promoSub');
  promos.sort((a,b)=>discountPct(b)-discountPct(a));
  document.getElementById('promoGrid').innerHTML=promos.map(productCard).join('');
  sec.classList.remove('hidden');
}
function discountPct(p){return (p.oldPrice&&p.oldPrice>p.price)?Math.round((1-p.price/p.oldPrice)*100):0;}
function priceHTML(p){
  if(p.oldPrice&&p.oldPrice>p.price)return `<span class="oldprice">${money(p.oldPrice)}</span><span class="price">${money(p.price)}</span>`;
  return `<span class="price normal">${money(p.price)}</span>`;
}
function productTags(p){
  let tags='';const d=discountPct(p);
  if(d>0)tags+=`<span class="ptag promo">-${d}%</span>`;
  if(p.isNew)tags+=`<span class="ptag new">${t('tagNew')}</span>`;
  if(p.isTop)tags+=`<span class="ptag top">${t('tagTop')}</span>`;
  return tags?`<div class="ptags">${tags}</div>`:'';
}
function mediaHTML(p){
  if(p.media){
    if(p.mediaType==='video')return `<video src="${esc(p.media)}" muted loop playsinline autoplay></video><span class="play-tag">▶ vidéo</span>`;
    return `<img src="${esc(p.media)}" alt="${esc(L(p.name))}" loading="lazy">`;
  }
  return p.emoji||'📦';
}
function renderCats(){
  const cats=[...new Set(shop.products.map(p=>L(p.cat)).filter(Boolean))];
  document.getElementById('cats').innerHTML=`<div class="chip ${activeCat==='all'?'active':''}" onclick="setCat('all')">${t('all')}</div>`+
    cats.map(c=>`<div class="chip ${activeCat===c?'active':''}" onclick="setCat('${esc(c)}')">${esc(c)}</div>`).join('');
}
function setCat(c){activeCat=c;render();}
function applyStaticTexts(){
  const s=adminUnlocked?adminData.settings:shop.settings;
  document.getElementById('brandName').textContent=s.shopName||'Ma Boutique';
  document.getElementById('searchInput').placeholder=t('search');
  document.getElementById('heroTitle').textContent=t('heroTitle');
  document.getElementById('heroSub').textContent=t('heroSub');
  document.getElementById('heroCta').textContent=t('heroCta');
  document.getElementById('cartTitle').textContent=t('cartTitle');
  document.getElementById('totalLbl').textContent=t('total');
  document.getElementById('checkoutBtn').textContent=t('checkout');
  document.getElementById('langBtn').textContent=lang==='fr'?'EN':'FR';
  document.title=s.shopName||'Ma Boutique';
  updateCartCount();
}

/* -------------------- Panier -------------------- */
function addToCart(id){
  const p=shop.products.find(x=>x.id===id);if(!p||p.stock<=0)return;
  const cur=cart[id]||0;if(cur+1>p.stock){toast(t('noStock')+L(p.name));return;}
  cart[id]=cur+1;updateCartCount();toast(t('added'));renderCart();
}
function updateCartCount(){document.getElementById('cartCount').textContent=Object.values(cart).reduce((a,b)=>a+b,0);}
function cartTotal(){return Object.entries(cart).reduce((s,[id,q])=>{const p=shop.products.find(x=>x.id==id);return s+(p?p.price*q:0);},0);}
function openCart(){renderCart();openDrawer();}
function renderCart(){
  const body=document.getElementById('cartBody');
  const entries=Object.entries(cart).filter(([id,q])=>q>0);
  if(!entries.length){body.innerHTML=`<div class="empty">${t('emptyCart')}</div>`;}
  else{body.innerHTML=entries.map(([id,q])=>{
    const p=shop.products.find(x=>x.id==id);if(!p)return'';
    const thumb=p.media?(p.mediaType==='video'?`<video src="${esc(p.media)}" muted class="em-media"></video>`:`<img src="${esc(p.media)}" class="em-media" alt="">`):`<div class="em">${p.emoji||'📦'}</div>`;
    return `<div class="citem">${thumb}<div class="info"><div style="font-weight:700">${esc(L(p.name))}</div><div style="font-size:.82rem;color:var(--muted)">${money(p.price)}</div></div>
      <div class="qty"><button onclick="chgQty(${id},-1)">−</button><span>${q}</span><button onclick="chgQty(${id},1)">+</button></div></div>`;
  }).join('');}
  document.getElementById('cartTotal').textContent=money(cartTotal());updateCartCount();
}
function chgQty(id,d){
  const p=shop.products.find(x=>x.id==id);let q=(cart[id]||0)+d;
  if(q>p.stock){toast(t('noStock')+L(p.name));return;}
  if(q<=0)delete cart[id];else cart[id]=q;renderCart();
}

/* -------------------- Checkout -------------------- */
function shippingFee(){const s=shop.settings;return val('co_delivery')==='desk'?(s.deliveryDesk||0):(s.deliveryHome||0);}
function updateCoTotal(){const sub=cartTotal(),ship=shippingFee();
  document.getElementById('coSub').textContent=money(sub);document.getElementById('coShip').textContent=money(ship);document.getElementById('coTotal').textContent=money(sub+ship);}
function openCheckout(){
  if(!Object.keys(cart).length){toast(t('emptyCart'));return;}
  closeDrawer();
  document.getElementById('coTitle').textContent=t('coTitle');document.getElementById('confirmOrderBtn').textContent=t('confirmOrder');
  ['lblCName','lblCEmail','lblCPhone','lblCAddr','lblCPay','lblCWilaya','lblCCommune','lblCDelivery','coTotalLbl','coSubLbl','coShipLbl'].forEach(id=>document.getElementById(id).textContent=t(id));
  const wsel=document.getElementById('co_wilaya');
  wsel.innerHTML=`<option value="">${t('selectWilaya')}</option>`+WILAYAS.map(w=>`<option value="${esc(w)}">${esc(w)}</option>`).join('');
  updateCoTotal();openModal('checkoutModal');
}
async function placeOrder(){
  const name=val('co_name'),email=val('co_email'),addr=val('co_addr'),wilaya=val('co_wilaya');
  if(!name||!email||!addr){toast(t('fillCheckout'));return;}
  if(!wilaya){toast(t('fillWilaya'));return;}
  const items=Object.entries(cart).map(([id,q])=>({id:parseInt(id),qty:q}));
  try{
    const res=await api('/orders',{method:'POST',body:{
      customer:{name,email,phone:val('co_phone'),address:addr,wilaya,commune:val('co_commune')},
      pay:val('co_pay'),delivery:val('co_delivery'),items
    }});
    cart={};updateCartCount();closeAll();toast(t('orderOk')+'#'+res.id);
    shop=await api('/shop');render();   // rafraichir stocks
  }catch(e){
    if(e.data&&e.data.error==='stock_insuffisant')toast(t('noStock')+L(e.data.product));
    else toast(t('netErr'));
  }
}

/* -------------------- Admin -------------------- */
async function loadAndRenderAdmin(){
  try{adminData=await api('/admin/data');}
  catch(e){adminUnlocked=false;go('shop');adminGate();return;}
  renderAdmin();
}
function renderAdmin(){
  document.getElementById('adminTitle').textContent=t('adminTitle');
  document.getElementById('adminSub').textContent=t('adminSub');
  document.getElementById('backShop').textContent=t('backShop');
  document.getElementById('logoutBtn').textContent=t('logoutBtn');
  ['tabDash','tabProd','tabOrd','tabSet'].forEach(id=>document.getElementById(id).textContent=t(id));
  adminTab(adminActiveTab);
}
function adminTab(tab){
  adminActiveTab=tab;
  document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));
  ['Dash','Prod','Ord','Set'].forEach(s=>document.getElementById('pane'+s).classList.toggle('hidden',s.toLowerCase()!==tab));
  if(tab==='dash')renderDash();if(tab==='prod')renderProdTable();if(tab==='ord')renderOrdTable();if(tab==='set')renderSettings();
}
function renderDash(){
  const validOrders=adminData.orders.filter(o=>o.status!=='cancel');
  const revenue=validOrders.reduce((s,o)=>s+o.total,0);
  const low=adminData.products.filter(p=>p.stock<=5).length;
  // calcul des articles vendus (total + detail par produit)
  const sold={};let totalSold=0;
  validOrders.forEach(o=>o.items.forEach(it=>{
    const q=it.qty||0;totalSold+=q;
    if(!sold[it.id])sold[it.id]={id:it.id,name:it.name,emoji:it.emoji,qty:0,revenue:0};
    sold[it.id].qty+=q;sold[it.id].revenue+=(it.price||0)*q;
  }));
  const stats=[{n:totalSold,l:t('sSold')},{n:money(revenue),l:t('sRevenue')},{n:adminData.orders.length,l:t('sOrders')},{n:adminData.products.length,l:t('sProducts')},{n:low,l:t('sLow')}];
  document.getElementById('statsBox').innerHTML=stats.map(s=>`<div class="stat"><div class="n">${s.n}</div><div class="l">${s.l}</div></div>`).join('');
  document.getElementById('bestTitle').textContent=t('bestTitle');
  const list=Object.values(sold).sort((a,b)=>b.qty-a.qty);
  const bt=document.getElementById('bestTable');
  if(!list.length){bt.innerHTML=`<tr><td class="empty" style="padding:30px;text-align:center;color:var(--muted)">${t('noSales')}</td></tr>`;}
  else{bt.innerHTML=`<tr><th>${t('thProd')}</th><th>${t('thQtySold')}</th><th>${t('thRevenue')}</th></tr>`+
    list.map(p=>`<tr><td>${p.emoji||'📦'} ${esc(L(p.name))}</td><td style="font-weight:700">${p.qty}</td><td>${money(p.revenue)}</td></tr>`).join('');}
  document.getElementById('recentTitle').textContent=t('recentTitle');
  const recent=adminData.orders.slice(0,5);
  document.getElementById('recentOrders').innerHTML=recent.length?ordTableHTML(recent):`<div class="empty">${t('noOrders')}</div>`;
}
function renderProdTable(){
  document.getElementById('prodMgrTitle').textContent=t('prodMgrTitle');
  document.getElementById('addProdBtn').textContent=t('addProd');
  document.getElementById('delAllBtn').textContent=t('delAll');
  const tb=document.getElementById('prodTable');
  tb.innerHTML=`<tr><th>${t('thProd')}</th><th>${t('thCat')}</th><th>${t('thPrice')}</th><th>${t('thStock')}</th><th>${t('thActions')}</th></tr>`+
    adminData.products.map(p=>{let sc=p.stock<=0?'out':(p.stock<=5?'low':'in');
      const ic=p.media?(p.mediaType==='video'?'🎥':'🖼️'):(p.emoji||'📦');
      return `<tr><td>${ic} ${esc(L(p.name))}</td><td>${esc(L(p.cat))}</td><td>${money(p.price)}</td>
        <td class="${sc}" style="font-weight:700">${p.stock}</td>
        <td><button class="btn ghost small" onclick="openProductForm(${p.id})">${t('edit')}</button> <button class="btn danger small" onclick="delProduct(${p.id})">${t('del')}</button></td></tr>`;
    }).join('');
}
function statusBadge(s){const map={new:'b-new',prep:'b-prep',ship:'b-ship',done:'b-done',cancel:'b-cancel'};return `<span class="badge ${map[s]}">${t('st_'+s)}</span>`;}
function ordTableHTML(list){
  return `<table><tr><th>${t('thOrder')}</th><th>${t('thClient')}</th><th>${t('thItems')}</th><th>${t('thTotal')}</th><th>${t('thDate')}</th><th>${t('thStatus')}</th></tr>`+
    list.map(o=>{
      const items=o.items.map(i=>`${i.emoji||''} ${esc(L(i.name))} ×${i.qty}`).join('<br>');
      const d=new Date(o.date).toLocaleString(lang==='fr'?'fr-FR':'en-US',{dateStyle:'short',timeStyle:'short'});
      const sel=`<select onchange="setStatus(${o.id},this.value)" style="font-size:.8rem;padding:5px">${['new','prep','ship','done','cancel'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${t('st_'+s)}</option>`).join('')}</select>`;
      return `<tr><td><b>#${o.id}</b></td>
        <td>${esc(o.customer.name)}<br><span style="color:var(--muted);font-size:.8rem">${esc(o.customer.email)}<br>${esc(o.customer.phone||'')}</span><br><span style="color:var(--muted);font-size:.78rem">${esc(o.customer.address||'')}</span>${o.customer.wilaya?`<br><span style="font-size:.78rem;font-weight:600">📍 ${esc(o.customer.wilaya)}${o.customer.commune?' · '+esc(o.customer.commune):''}</span>`:''}${o.delivery?`<br><span style="font-size:.76rem;color:var(--muted)">🚚 ${o.delivery==='desk'?t('delDesk'):t('delHome')}</span>`:''}</td>
        <td style="font-size:.82rem">${items}</td><td style="font-weight:700">${money(o.total)}</td><td style="font-size:.82rem">${d}</td><td>${statusBadge(o.status)}<br>${sel}${cancelCountdown(o)}</td></tr>`;
    }).join('')+`</table>`;
}
function cancelCountdown(o){
  if(o.status!=='cancel'||!o.cancelledAt)return'';
  const delay=((adminData.settings&&adminData.settings.cancelDelay)||24)*60*60*1000;const left=o.cancelledAt+delay-Date.now();
  if(left<=0)return'';
  const h=Math.floor(left/3600000),m=Math.floor((left%3600000)/60000);
  return `<br><span style="font-size:.72rem;color:var(--bad)">🗑️ ${t('autoDelete')} ${h}h ${m}min</span>`;
}
function renderOrdTable(){const box=document.getElementById('ordTable').parentElement;box.innerHTML=adminData.orders.length?ordTableHTML(adminData.orders):`<div class="empty">${t('noOrders')}</div>`;}
async function setStatus(id,s){try{await api('/admin/orders/'+id+'/status',{method:'PUT',body:{status:s}});const o=adminData.orders.find(x=>x.id===id);if(o)o.status=s;renderAdmin();}catch(e){toast(t('netErr'));}}

/* product form */
function openProductForm(id){
  const editing=typeof id==='number';
  document.getElementById('prodFormTitle').textContent=editing?t('prodFormEdit'):t('prodFormAdd');
  ['lblPName','lblPDesc','lblPCat','lblPEmoji','lblPPrice','lblPStock','lblPMedia','lblPOldPrice','lblPIsNew','lblPIsTop'].forEach(k=>document.getElementById(k).textContent=t(k));
  document.getElementById('saveProdBtn').textContent=t('save');document.getElementById('cancelProdBtn').textContent=t('cancel');document.getElementById('removeMediaBtn').textContent=t('removeMedia');
  document.getElementById('pf_mediaFile').value='';
  if(editing){const p=adminData.products.find(x=>x.id===id);
    document.getElementById('pf_id').value=p.id;document.getElementById('pf_name').value=L(p.name);document.getElementById('pf_desc').value=L(p.desc);
    document.getElementById('pf_cat').value=L(p.cat);document.getElementById('pf_emoji').value=p.emoji||'';document.getElementById('pf_price').value=p.price;document.getElementById('pf_stock').value=p.stock;
    document.getElementById('pf_oldPrice').value=p.oldPrice||'';document.getElementById('pf_isNew').checked=!!p.isNew;document.getElementById('pf_isTop').checked=!!p.isTop;
    document.getElementById('pf_media').value=p.media||'';document.getElementById('pf_mediaType').value=p.mediaType||'';showMediaPreview();
  }else{['pf_id','pf_name','pf_desc','pf_cat','pf_emoji','pf_price','pf_stock','pf_oldPrice','pf_media','pf_mediaType'].forEach(i=>document.getElementById(i).value='');document.getElementById('pf_isNew').checked=false;document.getElementById('pf_isTop').checked=false;showMediaPreview();}
  openModal('prodModal');
}
async function handleMediaUpload(e){
  const f=e.target.files[0];if(!f)return;
  if(f.size>25*1024*1024){toast(t('mediaTooBig'));e.target.value='';return;}
  toast(t('uploading'));
  const fd=new FormData();fd.append('media',f);
  try{const res=await api('/admin/upload',{method:'POST',body:fd});
    document.getElementById('pf_media').value=res.url;document.getElementById('pf_mediaType').value=res.type;showMediaPreview();
  }catch(err){toast(t('mediaTooBig'));}
}
function showMediaPreview(){
  const media=document.getElementById('pf_media').value,type=document.getElementById('pf_mediaType').value;
  const box=document.getElementById('pf_mediaPreview'),thumb=document.getElementById('pf_mediaThumb');
  if(media){thumb.innerHTML=type==='video'?`<video src="${esc(media)}" muted></video>`:`<img src="${esc(media)}" alt="">`;box.classList.remove('hidden');}
  else{box.classList.add('hidden');thumb.innerHTML='';}
}
function removeMedia(){document.getElementById('pf_media').value='';document.getElementById('pf_mediaType').value='';document.getElementById('pf_mediaFile').value='';showMediaPreview();}
async function saveProduct(){
  const name=val('pf_name'),price=parseFloat(val('pf_price'));
  if(!name||isNaN(price)){toast(t('fillName'));return;}
  const id=val('pf_id');
  const oldPrice=parseFloat(val('pf_oldPrice'))||0;
  const body={name,desc:val('pf_desc'),cat:val('pf_cat')||'Divers',emoji:val('pf_emoji')||'📦',price,stock:parseInt(val('pf_stock'))||0,
    oldPrice:oldPrice>price?oldPrice:0,isNew:document.getElementById('pf_isNew').checked,isTop:document.getElementById('pf_isTop').checked,
    media:document.getElementById('pf_media').value||'',mediaType:document.getElementById('pf_mediaType').value||''};
  try{
    if(id)await api('/admin/products/'+id,{method:'PUT',body});
    else await api('/admin/products',{method:'POST',body});
    closeAll();toast(t('prodSaved'));adminData=await api('/admin/data');shop=await api('/shop');renderAdmin();
  }catch(e){toast(t('netErr'));}
}
function delProduct(id){askConfirm(t('confirmDel'),async()=>{
  try{await api('/admin/products/'+id,{method:'DELETE'});delete cart[id];toast(t('prodDel'));adminData=await api('/admin/data');shop=await api('/shop');renderAdmin();}catch(e){toast(t('netErr'));}
});}
function deleteAllProducts(){if(!adminData.products.length)return;askConfirm(t('confirmDelAll'),async()=>{
  try{await api('/admin/products',{method:'DELETE'});cart={};toast(t('allDeleted'));adminData=await api('/admin/data');shop=await api('/shop');renderAdmin();}catch(e){toast(t('netErr'));}
});}

/* settings */
function renderSettings(){
  ['lblShopName','lblCurrency','lblDelHome','lblDelDesk','lblChangePw','lblCancelDelay'].forEach(k=>document.getElementById(k).textContent=t(k));
  document.getElementById('saveSetBtn').textContent=t('saveSet');document.getElementById('changePwBtn').textContent=t('changePwBtn');
  document.getElementById('setShopName').value=adminData.settings.shopName||'';
  document.getElementById('setCurrency').value=adminData.settings.currency||'DA';
  document.getElementById('setDelHome').value=adminData.settings.deliveryHome||0;
  document.getElementById('setDelDesk').value=adminData.settings.deliveryDesk||0;
  document.getElementById('setCancelDelay').value=String(adminData.settings.cancelDelay||24);
}
async function saveSettings(){
  try{const res=await api('/admin/settings',{method:'PUT',body:{shopName:val('setShopName')||'Ma Boutique',currency:val('setCurrency')||'DA',deliveryHome:parseInt(val('setDelHome'))||0,deliveryDesk:parseInt(val('setDelDesk'))||0,cancelDelay:parseInt(document.getElementById('setCancelDelay').value)||24}});
    adminData.settings=res.settings;shop=await api('/shop');toast(t('setSaved'));applyStaticTexts();renderAdmin();
  }catch(e){toast(t('netErr'));}
}

/* -------------------- UI utils -------------------- */
function toggleLang(){lang=lang==='fr'?'en':'fr';document.documentElement.lang=lang;
  if(document.getElementById('adminView').classList.contains('hidden'))render();else renderAdmin();
  applyStaticTexts();renderCart();}
function openModal(id){document.getElementById('overlay').classList.add('open');document.getElementById(id).classList.add('open');}
function openDrawer(){document.getElementById('overlay').classList.add('open');document.getElementById('cartDrawer').classList.add('open');}
function closeDrawer(){document.getElementById('cartDrawer').classList.remove('open');}
function closeAll(){document.getElementById('overlay').classList.remove('open');document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));closeDrawer();}
let _confirmCb=null;
function askConfirm(msg,cb){_confirmCb=cb;document.getElementById('confirmTitle').textContent=t('confirmTitle');document.getElementById('confirmMsg').textContent=msg;document.getElementById('confirmYesBtn').textContent=t('confirmYes');document.getElementById('confirmNo').textContent=t('confirmNo');openModal('confirmModal');}
function confirmYes(){const cb=_confirmCb;closeConfirm();if(cb)cb();}
function closeConfirm(){_confirmCb=null;document.getElementById('confirmModal').classList.remove('open');if(!document.querySelector('.modal.open')&&!document.getElementById('cartDrawer').classList.contains('open'))document.getElementById('overlay').classList.remove('open');}
let toastTimer;
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}

init();
