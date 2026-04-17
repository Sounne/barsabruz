# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bars à Bruz** is a mobile showcase website for bars in Bruz (France), deployed on GitHub Pages. It is a **Vite + React** single-page application.

## Deployment

- GitHub Actions builds the project and deploys to GitHub Pages automatically on every push to `main`.
- Live URL: `https://sounne.github.io/barsabruz/`
- Local dev: `npm run dev` → http://localhost:5173/barsabruz/
- Manual build: `npm run build` → outputs to `dist/`

## Architecture

```
src/
├── main.jsx              # Entry point — mounts <App /> into #app-root
├── App.jsx               # Root component — tab navigation + overlay sheets
├── index.css             # Global CSS variables, fonts, layout
├── data/
│   └── index.js          # Mock data: BARS_DATA, USER_DATA, ANNONCES_PUBLIC
├── components/
│   └── ui.jsx            # Shared primitives: Icon, Avatar, BarHero, Tag, OpenDot, shade
└── screens/
    ├── HomeScreen.jsx    # HomeScreen, DiscoverScreen, MapView
    ├── BarDetailScreen.jsx
    ├── AgendaScreen.jsx  # AgendaScreen, EventSheet
    ├── GroupesScreen.jsx # GroupesScreen, GroupChatScreen, NewAnnonceSheet
    └── AccountScreen.jsx
```

**Stack**: React 18, Vite 6, vanilla CSS (CSS custom properties), JSX.  
**No CSS-in-JS, no router, no external UI library** — styles are inline or via CSS classes.

## Working in This Repo

- **Bar data** (names, hours, events, etc.) → edit `src/data/index.js`
- **Shared UI** (icons, colors, hero cards) → edit `src/components/ui.jsx`
- **Screen layout/UX** → edit the relevant file in `src/screens/`
- **Global styles / CSS variables** → edit `src/index.css`

## Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server with HMR
npm run build    # production build → dist/
npm run preview  # preview production build locally
```
