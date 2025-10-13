# Système Monétaire d'Aria 🏰

## Vue d'ensemble

Le système monétaire d'Aria est basé sur quatre types de pièces avec des taux de conversion fixes, permettant une gestion réaliste et immersive de l'économie du jeu.

## Les Monnaies

### 👑 Couronnes (Or)
- **Nom officiel :** Couronnes
- **Noms alternatifs :** Écu
- **Valeur :** Monnaie principale (la plus précieuse)
- **Symbole :** 👑

### 🔮 Orbes (Argent)
- **Nom officiel :** Orbes
- **Noms alternatifs :** Denier
- **Valeur :** 1 Couronne = 10 Orbes
- **Symbole :** 🔮

### ⚜️ Sceptres (Cuivre)
- **Nom officiel :** Sceptres
- **Noms alternatifs :** Liard
- **Valeur :** 1 Orbe = 10 Sceptres
- **Symbole :** ⚜️

### 👑 Rois (Fer)
- **Nom officiel :** Rois
- **Noms alternatifs :** Sou
- **Valeur :** 1 Sceptre = 10 Rois
- **Symbole :** 👑

## Taux de Conversion

```
1 Couronne = 10 Orbes = 100 Sceptres = 1000 Rois
```

### Exemples de conversion :
- 1 Couronne = 10 Orbes
- 1 Couronne = 100 Sceptres
- 1 Couronne = 1000 Rois
- 1 Orbe = 10 Sceptres
- 1 Orbe = 100 Rois
- 1 Sceptre = 10 Rois

## Fonctionnalités du Système

### 🔄 Optimisation Automatique
Le système optimise automatiquement les monnaies :
- 10+ Rois → 1 Sceptre + reste en Rois
- 10+ Sceptres → 1 Orbe + reste en Sceptres
- 10+ Orbes → 1 Couronne + reste en Orbes

### 🔀 Convertisseur
- Conversion manuelle entre toutes les monnaies
- Calcul automatique des taux
- Validation des fonds disponibles

### 💰 Gestion des Transactions
- Vérification des fonds suffisants
- Calcul automatique des coûts
- Mise à jour des soldes

## Utilisation dans le Jeu

### Pour les Joueurs
1. **Ajouter de l'argent :** Saisir directement dans les champs
2. **Convertir :** Utiliser le convertisseur pour changer de monnaie
3. **Optimiser :** Cliquer sur "Optimiser" pour convertir automatiquement
4. **Voir le total :** Le total en rois est affiché en permanence

### Pour les Maîtres de Jeu
- Attribution d'argent lors des récompenses
- Gestion des coûts d'équipement
- Transactions commerciales
- Économie du monde de jeu

## Intégration Technique

### Base de Données
```sql
-- Champs ajoutés au modèle Character
crowns      Int @default(0)  -- Couronnes (or)
orbs        Int @default(0)  -- Orbes (argent)
scepters    Int @default(0)  -- Sceptres (cuivre)
kings       Int @default(0)  -- Rois (fer)
```

### API
- Sauvegarde automatique des modifications
- Validation des transactions
- Calculs de conversion côté serveur

### Interface Utilisateur
- Composant `MoneyManager` intégré dans la fiche de personnage
- Aide contextuelle avec `CurrencyHelp`
- Interface intuitive avec symboles visuels

## Exemples d'Usage

### Récompense de Quête
```
Récompense : 2 Couronnes + 5 Orbes
= 2 × 1000 + 5 × 100 = 2500 Rois
```

### Achat d'Équipement
```
Épée : 1 Couronne + 3 Orbes
Coût total : 1300 Rois
```

### Conversion Manuelle
```
Convertir 50 Rois en Sceptres
Résultat : 5 Sceptres (50 ÷ 10)
```

## Notes de Design

- **Immersion :** Les noms des monnaies reflètent l'univers médiéval-fantastique
- **Simplicité :** Taux de conversion simples (1:10)
- **Flexibilité :** Support des noms alternatifs selon les régions
- **Accessibilité :** Interface claire avec symboles visuels
- **Performance :** Calculs optimisés côté client et serveur

Ce système monétaire enrichit l'expérience de jeu en offrant une gestion économique réaliste et immersive, tout en restant simple à utiliser pour tous les joueurs.
