# 🌐 je-tu-il.github.io — Portfolio & Hub Officiel

> **Site vitrine officiel de Jules R. (Je-tu-il) hébergé sur GitHub Pages : [https://je-tu-il.github.io](https://je-tu-il.github.io)**  
> Catalogue de projets personnels, avec applications web, démonstrations et fiches.

---

## 🚀 Fonctionnalités du Site

* **🎮 15 Démos Jouables Directement en Ligne** :
  * **[Démineur Ultime](projects/demineur/index.html)** : Jeu de démineur multijoueur mondial avec chronomètre et classement.
  * **[QR-Shroud](projects/qr-shroud/index.html)** : Cryptographie et stéganographie visuelle par décomposition en QR codes ISO.
  * **[Celeste 2 TI-84 Plus CE](projects/celeste-ti/index.html)** : Émulateur web interactif de Celeste avec skin de calculatrice TI-84 Plus CE et téléchargement du binaire `.8xp`.
  * **[Simulateur Launcher App](projects/launcher-sim/index.html)** : Démonstration web du lanceur Windows ultra-rapide (façon Raycast) avec verrouillage d'artiste audio par touche `Tab`.
  * **[Time Travel Investing](projects/trading-training/index.html)** : Simulateur de trading historique avec graphiques chandeliers et presse financière d'époque.
  * **[Song of my RAM](projects/song-of-ram/index.html)** : Sonification audio Web Audio et visualiseur bitmap de la mémoire vive.
  * **[Gens Mort](projects/gens-mort/index.html)** : Simulation 2D d'agents IA autonomes avec dialogues temps réel.
  * **[Générateur Diceware](projects/password-generator/index.html)** : Calculateur cryptographique d'entropie basé sur la liste de mots de l'EFF.
  * **[Les Lanternes de Stan](projects/lanterne-stan/index.html)** : Vitrine 3D et photos de la lanterne artisanale de Nancy.
  * **[VoxelPrint / Obj3D](projects/voxel3d/index.html)** : Configurateur d'illusions dual-text et cartes de relief 3D.
  * **[Teleprompter Pro](projects/teleprompter/index.html)** : Téléprompteur vidéo avec défilement 60 FPS et mode miroir optique.
  * **[FFmpeg Studio](projects/ffmpeg-studio/index.html)** : Atelier visuel de conversion vidéo.
  * **[Portfolio Graphisme](projects/design-gallery/index.html)** : Galerie d'illustrations vectorielles (Champibad, La Danse des Œufs).
  * **[Fav Hub](projects/fav-hub/index.html)** : Annuaire instantané de ressources web.
  * **[CvModule](projects/cv-module/index.html)** : Éditeur modulaire de CV.
* **Recherche par titre, mot-clé et technologie** avec filtres par catégorie.
* **🏷️ Filtrage Multi-Catégories** :
  * Jeux & Émulateurs, Cybersécurité & Crypto, Web & IA, Mobile iOS, Système & Outils, 3D & Matériel, Concepts.
* **📑 Fiches Techniques Exhaustives (`projects/project.html?id=...`)** :
  * Présentation détaillée de chaque projet, architecture logicielle, contraintes techniques et liens GitHub.
* **⚡ 100% Client-Side & GitHub Pages Ready** :
  * Zéro configuration de build complexe, compatible avec le déploiement statique GitHub Pages.

---

## 📂 Structure du Répertoire

```text
GithubMain/
├── index.html                   # Page d'accueil & hub portfolio
├── style.css                    # Design cyberpunk, thème sombre & glassmorphism
├── main.js                      # Moteur de recherche, filtres & Command Palette
├── .nojekyll                    # Désactive le moteur Jekyll sur GitHub Pages
├── data/
│   └── projects.json            # Base de données structurée des 39 projets
└── projects/
    ├── project.html             # Page de détail universelle (?id=...)
    ├── demineur/                # Démineur Ultime (build de production)
    ├── qr-shroud/               # QR-Shroud stéganographie & cryptographie
    ├── celeste-ti/              # Celeste 2 TI-84 Plus CE + simulateur
    ├── launcher-sim/            # Simulateur Launcher App (Raycast style)
    ├── trading-training/        # Time Travel Investing + graphiques historiques
    ├── song-of-ram/             # Sonification RAM Web Audio API
    ├── gens-mort/               # Simulation 2D d'agents IA autonomes
    ├── password-generator/      # Générateur de phrases de passe Diceware EFF
    ├── lanterne-stan/           # Les Lanternes de Stan & modèles 3D
    ├── voxel3d/                 # VoxelPrint e-commerce & illusions 3D
    ├── teleprompter/            # Téléprompteur autonome
    ├── ffmpeg-studio/           # Atelier FFmpeg vidéo
    ├── design-gallery/          # Galerie haute résolution Champibad & Danse des Œufs
    ├── fav-hub/                 # Hub de favoris & recherche instantanée
    └── cv-module/               # Constructeur modulaire de CV
```

---

## 🚢 Déploiement sur GitHub Pages

1. **Initialiser et pousser sur GitHub** :
   ```bash
   git add .
   git commit -m "feat: Déploiement du portfolio officiel et des 15 démos interactives"
   git push -u origin main
   ```
2. **Activer GitHub Pages dans les paramètres du dépôt** :
   * Rendez-vous sur `https://github.com/je-tu-il/je-tu-il.github.io/settings/pages`
   * Sous **Build and deployment > Source**, sélectionnez **Deploy from a branch**
   * Choisissez la branche **main** et le dossier **/ (root)**
   * Cliquez sur **Save**

Le site sera accessible en quelques instants à l'adresse [https://je-tu-il.github.io](https://je-tu-il.github.io) !
