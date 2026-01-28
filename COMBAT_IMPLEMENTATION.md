# 🎭 Système de Gestion des Combats - Documentation d'Implémentation

## ✅ Fonctionnalités Implémentées

### 1. **Modèles de Base de Données**
   - **Combat** : Représente une instance de combat avec tour actuel et statut actif/terminé
   - **CombatCombatant** : Liens entre personnages et combats avec positions sur la grille
   - **Enemy** : Ennemis contrôlés par le MJ avec vie, dégâts d'arme et position

**Sauvegardé en base de données** ✅

### 2. **Routes API (Backend)**

#### Routes Combat :
- `POST /api/games/:id/combats` - Créer un nouveau combat (MJ seulement)
- `GET /api/games/:id/combat` - Récupérer le combat actif d'une partie
- `DELETE /api/combats/:id` - Terminer un combat (MJ seulement)
- `PUT /api/combats/:combatId/move` - Déplacer un combattant ou ennemi (MJ seulement)
- `DELETE /api/combats/:combatId/combatants/:characterId` - Retirer un personnage (MJ seulement)

#### Routes Ennemis :
- `POST /api/combats/:combatId/enemies` - Ajouter un ennemi au combat (MJ seulement)
- `PUT /api/enemies/:id` - Mettre à jour un ennemi (vie, dégâts) (MJ seulement)
- `DELETE /api/enemies/:id` - Retirer un ennemi du combat (MJ seulement)

**Toutes les opérations sauvegardent les données en base de données** ✅

### 3. **Interface Joueur - MJ Dashboard**

#### Fonctionnalités :
- **Bouton "⚔️ Afficher Combats"** pour basculer vers la carte de combat
- **Grille de combat 10x10** avec quadrillage visuel
- **Affichage des personnages** : Position sur la grille + barre de vie (visible par tous)
- **Affichage des ennemis** : Position + barre de vie (visible par MJ seulement)

#### Interactions MJ :
- **Clic gauche sur un personnage/ennemi** : Sélectionner pour déplacement
- **Clic sur la grille après sélection** : Déplacer le combattant
- **Clic droit sur un combattant** : Menu contextuel pour retirer du combat
- **Clic droit sur la grille vide** : Menu pour ajouter un ennemi
  - Saisie du nom de l'ennemi
  - Saisie des points de vie max
  - Saisie des dégâts de l'arme (ex: 2d6+1)
  - Position automatiquement définie à partir du clic droit

#### Affichage des informations :
- **Panneau latéral** : Liste des combattants avec vie actuelle/max
- **Panneau ennemi** : Liste des ennemis avec stats (visible MJ seulement)
- **Indice visuel** : Les personnages/ennemis changent de style lors de la sélection

**Toutes les données sont synchronisées en temps réel** ✅

### 4. **Interface Joueur - Page de Visualisation**

#### Route : `/combat/:gameId`

#### Fonctionnalités :
- **Grille de combat identique** à celle du MJ
- **Affichage des personnages** : Position + barre de vie complète
- **Affichage des ennemis** : Position UNIQUEMENT (no stats, no life bar details)
- **Panneau latéral** : 
  - Liste des personnages avec santé en couleur (vert/jaune/rouge)
  - Liste des ennemis sans détails (juste le nom et position)
  - Légende explicative

#### Restrictions pour les Joueurs :
- ❌ Pas d'accès aux dégâts des armes des ennemis
- ❌ Pas d'accès à la vie max des ennemis
- ❌ Pas de possibilité de déplacer les combattants
- ✅ Visualisation de la grille et des positions
- ✅ Visualisation de la vie des personnages joueurs
- ✅ Visualisation de la présence des ennemis

**Synchronisation en temps réel via WebSocket** ✅

### 5. **Synchronisation en Temps Réel (WebSocket)**

#### Événements implémentés :
- `combatStarted` - Combat démarré
- `combatantMoved` - Combattant déplacé
- `enemyAdded` - Ennemi ajouté
- `enemyUpdated` - Ennemi mis à jour (vie/dégâts)
- `enemyRemoved` - Ennemi retiré
- `combatantRemoved` - Combattant retiré
- `combatEnded` - Combat terminé

Tous les clients connectés reçoivent les mises à jour en temps réel.

### 6. **Services API Frontend**

Ajout des méthodes dans `api.js` :
- `createCombat(gameId)` - Créer un combat
- `getActiveCombat(gameId)` - Récupérer le combat actif
- `endCombat(combatId)` - Terminer un combat
- `moveCombatant(combatId, characterId, enemyId, xPos, yPos)` - Déplacer un combattant
- `removeCombatant(combatId, characterId)` - Retirer un combattant
- `addEnemy(combatId, enemyData)` - Ajouter un ennemi
- `updateEnemy(enemyId, enemyData)` - Mettre à jour un ennemi
- `removeEnemy(enemyId)` - Retirer un ennemi

### 7. **Composants React**

#### `CombatMap.jsx`
- Composant principal de gestion des combats pour le MJ
- Grille interactive 10x10
- Menu contextuel (clic droit)
- Formulaire modal pour ajouter des ennemis
- Sélection et déplacement des combattants

#### `CombatViewerPage.jsx`
- Page dédiée pour visualiser les combats (tous les joueurs)
- Affichage lisible et épuré
- Restrictions des informations selon le rôle

### 8. **Intégration UI**

- **MJDashboard** : Bouton "⚔️ Afficher/Masquer Combats" dans le header
- **Page Games** : 
  - Bouton "Combats" pour le MJ avec lien vers `/combat/:gameId`
  - Bouton "Voir les Combats" pour les joueurs avec lien vers `/combat/:gameId`
- **Routing** : Route ajoutée dans App.jsx pour `/combat/:gameId`

## 📊 Flux de Données

```
MJ démarrage combat
    ↓
API crée combat + ajoute personnages
    ↓
Sauvegarde en BD (Combat + CombatCombatant)
    ↓
WebSocket notifie tous les clients
    ↓
Joueurs voient la grille de combat
    ↓
MJ peut ajouter ennemis via clic droit
    ↓
API crée Enemy + sauvegarde
    ↓
WebSocket notifie + Joueurs voient ennemis (sans stats)
    ↓
MJ déplace combattants/ennemis
    ↓
API met à jour positions + sauvegarde
    ↓
WebSocket notifie + Tous voient les nouvelles positions
```

## 🔒 Sécurité & Permissions

### MJ Seulement :
- ✅ Créer/terminer combats
- ✅ Ajouter/modifier/retirer ennemis
- ✅ Déplacer tous les combattants
- ✅ Voir toutes les stats des ennemis (vie max, dégâts)

### Joueurs :
- ✅ Visualiser combats
- ✅ Voir positions de tous les combattants
- ✅ Voir santé des personnages
- ❌ Voir stats des ennemis (vie max, dégâts)
- ❌ Contrôler le combat

## 🎨 Styling

- **Thème sombre** pour la grille de combat
- **Gradient coloré** pour les combattants (bleu pour joueurs, rouge pour ennemis)
- **Barres de vie** avec dégradé de couleur (vert→jaune→rouge)
- **Menu contextuel** moderne avec ombre
- **Modal** pour ajouter des ennemis
- **Responsive** : Adapté au mobile et desktop

## 📝 Prochaines Étapes Possibles

1. Initiative du combat (ordre d'attaque)
2. Système de dégâts et de santé dynamique
3. Historique des actions du combat
4. Sauvegarde des combats terminés
5. Effets spéciaux (poison, buffs, debuffs)
6. Système d'attaque directe depuis la grille
7. Compétences spéciales des ennemis

## 📦 Fichiers Modifiés/Créés

### Modifiés :
- `prisma/schema.prisma` - Ajout modèles Combat, CombatCombatant, Enemy
- `src/server.js` - Routes API pour combats et ennemis
- `src/services/api.js` - Méthodes API frontend
- `src/pages/MJDashboard.jsx` - Intégration CombatMap
- `src/pages/Games.jsx` - Boutons d'accès aux combats
- `src/App.jsx` - Route `/combat/:gameId`

### Créés :
- `src/components/CombatMap.jsx` - Composant grille de combat (MJ)
- `src/components/CombatMap.css` - Styles de la grille
- `src/pages/CombatViewerPage.jsx` - Page de visualisation (joueurs)

## ✅ Checklist Implémentation

- [x] Modèles de base de données
- [x] Routes API CRUD
- [x] WebSocket synchronisation
- [x] Composant CombatMap
- [x] Page de visualisation
- [x] Menu contextuel
- [x] Formulaire d'ennemi
- [x] Permissions MJ/Joueurs
- [x] Intégration UI
- [x] Sauvegarde en base de données
- [x] Synchronisation temps réel
