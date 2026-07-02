# Carnet de Voyage — PWA 100% hors-ligne

Application web progressive (PWA) de carnet de voyage, entièrement fonctionnelle
hors-ligne, sans backend ni base de données externe. Toutes les données
(texte, photos, vidéos, budget, itinéraire) sont stockées **exclusivement dans
le navigateur de l'utilisateur** via IndexedDB.

## ✨ Fonctionnalités

### Cahier des charges
- **100% offline** : Service Worker (Workbox via `vite-plugin-pwa`) + cache
  applicatif complet. L'app s'installe et fonctionne sans connexion après le
  premier chargement.
- **Stockage local** : IndexedDB via [Dexie.js](https://dexie.org), typé en
  TypeScript. Aucune donnée personnelle ne quitte l'appareil.
- **Multi-voyages** : création, ouverture et suppression de plusieurs carnets,
  données totalement isolées par voyage (`tripId`).
- **Export / Import global** : sauvegarde d'un voyage en une archive `.zip`
  (JSON structuré + médias compressés), réimportable sur un autre appareil.
- **Journal** : entrées illimitées par jour (et non une par jour), horodatage
  libre, humeur, météo saisie à la main ou récupérée via API si en ligne
  (Open-Meteo), et checklist de préparation.
- **Galerie médias** : import de photos/vidéos, compression et miniatures
  générées côté client (Canvas), stockage en Blobs dans IndexedDB, association
  optionnelle à une entrée du journal.
- **Budget** : dépenses par catégorie (Transport, Logement, Repas, Loisirs,
  Autre), récapitulatif graphique (camembert + comparatif) et calcul du reste
  disponible.
- **Itinéraire** : géolocalisation du navigateur, carte OpenStreetMap
  (Leaflet) traçant la ligne entre les étapes, tuiles mises en cache dès
  qu'elles sont vues en ligne pour une consultation ultérieure partielle
  hors-ligne.
- **Studio Story** : composition Canvas HTML5, 100% hors-ligne, d'un visuel
  vertical 9:16 (photo + date + lieu + citation) téléchargeable pour les
  réseaux sociaux.
- **Export PDF** : génération côté client (jsPDF) d'un carnet complet :
  itinéraire, journal, galerie et bilan budgétaire.

### Fonctionnalités ajoutées (bonus)
- **Mode sombre automatique** selon les préférences système (`prefers-color-scheme`).
- **Pastille en ligne / hors-ligne** visible en permanence.
- **Accessibilité** : focus clavier visible, respect de `prefers-reduced-motion`.
- **Design distinctif "carnet de bord"** : typographie Fraunces/Inter/JetBrains
  Mono, bord "papier déchiré" sur les entrées, tampon-cachet dans l'en-tête.
- **Import de voyage depuis l'écran d'accueil**, avec régénération des
  identifiants pour éviter tout conflit de données.

## 🏗️ Stack technique

| Domaine          | Choix                                      |
|-------------------|---------------------------------------------|
| Langage           | TypeScript strict                          |
| UI                | React 18 + React Router (HashRouter)       |
| Stockage          | Dexie.js (IndexedDB)                       |
| PWA / offline     | vite-plugin-pwa (Workbox)                  |
| Carte             | Leaflet + react-leaflet (fond OpenStreetMap) |
| Graphiques budget | Recharts                                   |
| Export PDF        | jsPDF                                      |
| Export/Import zip | JSZip                                      |
| Build             | Vite                                       |

> **Pourquoi `HashRouter` ?** Pour garantir que la navigation interne (React
> Router) fonctionne à l'identique en ligne, hors-ligne et une fois l'app
> installée en PWA, sans configuration serveur de réécriture d'URL
> particulière côté Vercel.

## 📁 Structure du projet

```
travel-journal-pwa/
├── public/                 # icônes, favicon
├── src/
│   ├── components/
│   │   ├── Trips/          # écran d'accueil (liste, création, suppression)
│   │   ├── Layout/          # en-tête, navigation par onglets
│   │   ├── Journal/          # entrées de journal + checklist
│   │   ├── Gallery/          # galerie médias + visionneuse
│   │   ├── Budget/            # dépenses + graphiques
│   │   ├── Itinerary/        # étapes géolocalisées + carte
│   │   ├── Story/             # Studio Story (Canvas)
│   │   └── ExportImport/     # export PDF / zip, import
│   ├── contexts/            # contexte du voyage courant
│   ├── db/                   # schéma Dexie / IndexedDB
│   ├── hooks/                # hooks (statut en ligne, etc.)
│   ├── types/                 # modèle de données TypeScript
│   ├── utils/                 # géoloc, météo, canvas, PDF, zip, images
│   ├── styles/                # design tokens + styles globaux
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts            # config PWA / Service Worker
├── vercel.json
└── package.json
```

## 🚀 Lancer en local

Prérequis : Node.js 18+.

```bash
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

Pour tester le comportement offline réel (Service Worker actif) :

```bash
npm run build
npm run preview
```

Puis, dans les DevTools du navigateur (onglet *Application* / *Réseau*),
active le mode *Offline* et recharge la page : l'application continue de
fonctionner intégralement.

## ☁️ Déploiement sur Vercel

### Option A — via l'interface Vercel (recommandé)
1. Pousse le code sur un dépôt GitHub (voir section suivante).
2. Sur [vercel.com](https://vercel.com), clique sur **New Project** puis
   sélectionne ton dépôt GitHub.
3. Vercel détecte automatiquement Vite. Vérifie simplement :
   - **Build command** : `npm run build`
   - **Output directory** : `dist`
4. Clique sur **Deploy**. Le fichier `vercel.json` fourni fixe déjà ces
   valeurs et configure les en-têtes du Service Worker.

### Option B — via la CLI Vercel

```bash
npm install -g vercel
vercel login
vercel        # déploiement de prévisualisation
vercel --prod # déploiement en production
```

### Après déploiement
- Vérifie que l'icône d'installation PWA apparaît dans la barre d'adresse
  (Chrome/Edge) ou via « Ajouter à l'écran d'accueil » (Safari iOS/Android).
- Le Service Worker se met à jour automatiquement (`registerType: 'autoUpdate'`)
  à chaque nouveau déploiement.

> **Remarque sur les polices** : `index.html` charge les polices Fraunces /
> Inter / JetBrains Mono depuis Google Fonts pour un rendu optimal au premier
> chargement en ligne. Le Service Worker les met ensuite en cache. Pour un
> **tout premier chargement** garanti hors-ligne (ex. démo sans aucune
> connexion préalable), il est possible de télécharger ces polices et de les
> servir depuis `public/fonts/`, puis d'adapter `index.html` et
> `tokens.css` en conséquence — l'app reste pleinement lisible entre-temps
> grâce aux polices système de repli déjà définies.

## 📦 Publier le code sur GitHub

```bash
cd travel-journal-pwa
git init
git add .
git commit -m "Initial commit: Carnet de Voyage PWA"
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/<votre-repo>.git
git push -u origin main
```

## 🔒 Confidentialité et limites connues
- Aucune donnée n'est envoyée à un serveur : tout est local (IndexedDB).
- La météo automatique et le fond de carte OpenStreetMap nécessitent une
  connexion internet ponctuelle ; en leur absence, la saisie manuelle reste
  toujours disponible.
- Le stockage du navigateur (IndexedDB) est propre à un appareil/navigateur :
  utilise la fonction **Export** pour transférer un voyage ailleurs ou en
  garder une sauvegarde.
- Les quotas de stockage dépendent du navigateur (généralement plusieurs
  centaines de Mo à quelques Go) ; pense à exporter/purger les voyages
  volumineux (nombreuses vidéos) si nécessaire.

## 🗺️ Pistes d'évolution
- Chiffrement optionnel du contenu du journal (mot de passe local).
- Recherche plein texte dans les entrées.
- Widget "carte partagée" combinant itinéraire + photos géolocalisées.
- Synchronisation pair-à-pair optionnelle (WebRTC) entre appareils, sans
  serveur central, pour les utilisateurs qui le souhaiteraient.
