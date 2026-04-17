# Bars à Bruz

Site vitrine des bars de Bruz (prototype mobile) — React + Vite, déployé sur GitHub Pages.

## Développement local

```bash
npm install
npm run dev       # http://localhost:5173/barsabruz/
```

## Structure

```
src/
├── data/index.js          # Données des bars (à éditer pour ajouter/modifier des bars)
├── components/ui.jsx      # Primitives UI partagées (icônes, cartes, etc.)
├── screens/               # Un fichier par écran
└── App.jsx                # Navigation principale
```

## Déploiement

GitHub Actions build automatiquement à chaque push sur `main` et déploie sur GitHub Pages.

URL : `https://sounne.github.io/barsabruz/`

Pour mettre à jour les données des bars, modifier `src/data/index.js` et pusher.
