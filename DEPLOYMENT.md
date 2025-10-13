# Déploiement sur Webstrator - Aria JDR ✅

## Instructions de déploiement

### 1. Préparation ✅
- ✅ Le frontend est construit (`npm run build`)
- ✅ Le dossier `dist` contient les fichiers statiques
- ✅ La base de données Prisma est configurée
- ✅ Le serveur est testé et fonctionne localement

### 2. Configuration Webstrator
Dans votre panneau Webstrator :
1. **Point d'entrée** : `start-webstrator.js`
2. **Port** : `30072` (automatiquement configuré)
3. **Variables d'environnement** :
   - `NODE_ENV=production`
   - `PORT=30072`

### 3. Structure des fichiers
```
aria-jdr/
├── start-webstrator.js     # Script de démarrage pour Webstrator ✅
├── src/server.js           # Serveur Express principal ✅
├── dist/                   # Frontend construit ✅
│   ├── index.html         # Page principale ✅
│   └── assets/            # CSS, JS, images ✅
├── prisma/                 # Base de données et schéma ✅
└── public/                 # Fichiers statiques (cartes PDF) ✅
```

### 4. Fonctionnalités disponibles ✅
- ✅ Interface web complète
- ✅ Système d'authentification
- ✅ Gestion des parties et personnages
- ✅ Lancer de dés en temps réel
- ✅ Système de cartes
- ✅ Base de données SQLite

### 5. Accès ✅
Une fois déployé, votre application sera accessible via :
`http://185.207.226.6:30072`

### 6. Tests effectués ✅
- ✅ Serveur démarre correctement
- ✅ Route de test fonctionne (`/test`)
- ✅ Page principale se charge (`/`)
- ✅ Fichiers statiques servis correctement
- ✅ Route de fallback pour SPA fonctionne

### 7. Commandes utiles
```bash
# Construire le frontend
npm run build

# Tester localement avec la même configuration
npm run webstrator

# Développement local complet
npm run dev:full
```

### 8. Résolution des problèmes ✅
- ✅ Problème de port résolu (30072 au lieu de 4000)
- ✅ Problème de chemins relatifs résolu (`base: './'` dans Vite)
- ✅ Problème de route de fallback résolu (syntaxe Express)
- ✅ Problème de fichiers statiques résolu

## 🎉 Prêt pour le déploiement !

Votre application est maintenant prête à être déployée sur Webstrator. Tous les tests locaux passent avec succès.