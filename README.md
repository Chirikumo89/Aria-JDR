# 🎲 Aria JDR

Application de gestion de parties de jeu de rôle Aria avec système de dés 3D et gestion de cartes.

## 🚀 Démarrage rapide

### Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev:full
```

### Production avec Hamachi

```bash
# Démarrer en mode Hamachi (build + serveur)
npm run hamachi
```

## 🌐 Accès réseau

- **Local** : `http://localhost:4000`
- **Hamachi** : `http://[VOTRE_IP_HAMACHI]:4000`

## 📋 Fonctionnalités

- 🎲 Système de dés 3D interactif
- 👥 Gestion des personnages et parties
- 🗺️ Système de cartes géographiques
- 🔄 Synchronisation temps réel via Socket.IO
- 🎮 Interface multijoueur

## 🔧 Scripts disponibles

- `npm run dev` - Client de développement
- `npm run server` - Serveur API uniquement
- `npm run dev:full` - Client + serveur en développement
- `npm run hamachi` - Build + serveur pour Hamachi
- `npm run build` - Build de production

## 📚 Documentation

- [Guide Hamachi](HAMACHI_GUIDE.md) - Configuration pour les sessions multijoueurs
