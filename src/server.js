import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = process.env.PORT || 30072;

// Configuration CORS pour Socket.IO et API
const corsOptions = {
  origin: [
    'http://localhost:30072',
    'http://185.207.226.6:30072',
    'http://localhost:5173', // Pour le dev Vite
    'http://localhost:3000'  // Pour le dev React
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Servir les fichiers statiques du dossier cartes
app.use('/cartes', express.static('public/cartes'));

// Diagnostic de l'environnement
console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
console.log('[Server] Working directory:', process.cwd());
console.log('[Server] Dossier dist existe:', fs.existsSync('dist'));
console.log('[Server] index.html existe:', fs.existsSync('dist/index.html'));

// Servir les fichiers statiques du client (toujours en production sur Webstrator)
console.log('[Server] Configuration du serveur de fichiers statiques...');
console.log('[Server] Dossier dist:', path.join(process.cwd(), 'dist'));

// Servir les fichiers statiques du dossier dist
app.use(express.static('dist'));

console.log('[Server] Fichiers statiques configurés pour le dossier dist');

// Route de test pour vérifier que le serveur fonctionne
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Serveur fonctionne !', 
    nodeEnv: process.env.NODE_ENV,
    workingDir: process.cwd(),
    distExists: fs.existsSync('dist'),
    indexExists: fs.existsSync('dist/index.html')
  });
});

// Routes API pour l'authentification
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Le pseudo est requis" });
    }

    const cleanUsername = username.trim();
    
    // Chercher l'utilisateur existant
    let user = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      user = await prisma.user.create({
        data: { username: cleanUsername }
      });
      console.log(`[API] Nouvel utilisateur créé: ${cleanUsername}`);
    } else {
      console.log(`[API] Utilisateur connecté: ${cleanUsername}`);
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur requis" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['player', 'mj'].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }

    // Récupérer l'utilisateur pour vérifier son pseudo
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Seul l'utilisateur avec le pseudo "MJ" peut avoir le rôle MJ
    if (role === 'mj' && user.username.toLowerCase() !== 'mj') {
      return res.status(403).json({ 
        error: "Seul l'utilisateur avec le pseudo 'MJ' peut avoir le rôle de Maître de Jeu" 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes API
app.get("/api/games", async (req, res) => {
  try {
    console.log("[API] Récupération des parties...");
    console.log("[API] DATABASE_URL:", process.env.DATABASE_URL);
    const games = await prisma.game.findMany({
      include: {
        characters: true,
        _count: {
          select: {
            diceRolls: true,
            gameSessions: true
          }
        }
      }
    });
    console.log("[API] Parties récupérées:", games.length);
    res.json(games);
  } catch (error) {
    console.error("Erreur lors de la récupération des parties:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Route pour récupérer la caisse commune d'une partie
app.get("/api/games/:id/common-treasury", async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        commonTreasuryCrowns: true,
        commonTreasuryOrbs: true,
        commonTreasuryScepters: true,
        commonTreasuryKings: true
      }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    res.json(game);
  } catch (error) {
    console.error("Erreur lors de la récupération de la caisse commune:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour mettre à jour la caisse commune d'une partie
app.put("/api/games/:id/common-treasury", async (req, res) => {
  try {
    const { id } = req.params;
    const { commonTreasuryCrowns, commonTreasuryOrbs, commonTreasuryScepters, commonTreasuryKings } = req.body;
    
    // Vérifier que la partie existe
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    // Mettre à jour la caisse commune
    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        commonTreasuryCrowns: commonTreasuryCrowns || 0,
        commonTreasuryOrbs: commonTreasuryOrbs || 0,
        commonTreasuryScepters: commonTreasuryScepters || 0,
        commonTreasuryKings: commonTreasuryKings || 0
      },
      select: {
        id: true,
        commonTreasuryCrowns: true,
        commonTreasuryOrbs: true,
        commonTreasuryScepters: true,
        commonTreasuryKings: true
      }
    });
    
    // Émettre l'événement WebSocket pour notifier les autres joueurs
    emitToAll('commonTreasuryUpdated', { gameId: id, treasury: updatedGame });
    
    res.json(updatedGame);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la caisse commune:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

app.post("/api/games", async (req, res) => {
  try {
    const { name, description } = req.body;
    const game = await prisma.game.create({
      data: { name, description }
    });
    res.json(game);
  } catch (error) {
    console.error("Erreur lors de la création de la partie:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/games/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Récupérer l'ID de l'utilisateur depuis la query
    
    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur requis" });
    }

    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    if (user.role !== 'mj') {
      return res.status(403).json({ 
        error: "Seuls les Maîtres de Jeu peuvent supprimer des parties" 
      });
    }
    
    // Supprimer la partie (cascade supprimera les personnages et lancers de dés)
    await prisma.game.delete({
      where: { id }
    });
    
    res.json({ message: "Partie supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la partie:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/games/:id/characters", async (req, res) => {
  try {
    const { id } = req.params;
    const characters = await prisma.character.findMany({
      where: { gameId: id },
      include: {
        _count: {
          select: { diceRolls: true }
        },
        characterCards: {
          include: {
            card: true
          }
        }
      }
    });
    
    // Parser les données JSON pour possessions
    const processedCharacters = characters.map(character => {
      let possessions = [];
      let notes = [];
      
      try {
        possessions = character.possessions ? JSON.parse(character.possessions) : [];
      } catch (e) {
        console.warn('Erreur parsing possessions pour personnage', character.id, ':', e.message);
        console.warn('Valeur possessions:', character.possessions);
        possessions = [];
      }
      
      try {
        notes = character.notes ? JSON.parse(character.notes) : [];
      } catch (e) {
        console.warn('Erreur parsing notes pour personnage', character.id, ':', e.message);
        console.warn('Valeur notes:', character.notes);
        notes = [];
      }
      
      return {
        ...character,
        possessions,
        notes
      };
    });
    
    res.json(processedCharacters);
  } catch (error) {
    console.error("Erreur lors de la récupération des personnages:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/games/:id/characters", async (req, res) => {
  try {
    const { id } = req.params;
    const characterData = req.body;
    const userId = req.headers['user-id']; // Récupérer l'ID utilisateur depuis les headers
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }
    
    // Vérifier que la partie existe
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    // Vérifier si l'utilisateur a déjà un personnage dans cette partie
    const existingCharacter = await prisma.character.findFirst({
      where: {
        gameId: id,
        userId: userId
      }
    });
    
    if (existingCharacter) {
      return res.status(400).json({ error: "Vous ne pouvez créer qu'un seul personnage par partie" });
    }
    
    // Convertir les tableaux en JSON pour la sauvegarde
    const processedData = {
      ...characterData,
      playerName: user.username, // Utiliser le nom d'utilisateur automatiquement
      possessions: Array.isArray(characterData.possessions) 
        ? JSON.stringify(characterData.possessions) 
        : characterData.possessions,
      notes: Array.isArray(characterData.notes) 
        ? JSON.stringify(characterData.notes) 
        : characterData.notes
    };
    
    const character = await prisma.character.create({
      data: {
        ...processedData,
        gameId: id,
        userId: userId // Assigner l'utilisateur au personnage
      }
    });
    
    // Parser les données JSON pour la réponse
    const processedCharacter = {
      ...character,
      possessions: character.possessions ? JSON.parse(character.possessions) : [],
      notes: character.notes ? JSON.parse(character.notes) : []
    };
    
    // Émettre l'événement WebSocket pour notifier les MJ
    emitToAll('characterCreated', processedCharacter);
    
    res.json(processedCharacter);
  } catch (error) {
    console.error("Erreur lors de la création du personnage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/characters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        game: true,
        user: true,
        characterCards: {
          include: {
            card: true
          }
        }
      }
    });
    
    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }
    
    // Parser les données JSON pour possessions
    const processedCharacter = {
      ...character,
      possessions: character.possessions ? JSON.parse(character.possessions) : [],
      notes: character.notes ? JSON.parse(character.notes) : []
    };
    
    res.json(processedCharacter);
  } catch (error) {
    console.error("Erreur lors de la récupération du personnage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/characters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const characterData = req.body;
    
    // Convertir les tableaux en JSON pour la sauvegarde
    const processedData = {
      ...characterData,
      possessions: Array.isArray(characterData.possessions) 
        ? JSON.stringify(characterData.possessions) 
        : characterData.possessions,
      notes: Array.isArray(characterData.notes) 
        ? JSON.stringify(characterData.notes) 
        : characterData.notes
    };
    
    console.log("Données reçues pour mise à jour:", processedData);
    console.log("currentLifePoints reçu:", characterData.currentLifePoints);
    
    const character = await prisma.character.update({
      where: { id },
      data: processedData
    });
    
    // Émettre l'événement WebSocket pour notifier les MJ
    emitToAll('characterUpdated', character);
    
    console.log("Personnage mis à jour avec succès:", character);
    console.log("currentLifePoints sauvegardé:", character.currentLifePoints);
    
    res.json(character);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du personnage:", error);
    console.error("Détails de l'erreur:", error.message);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

app.delete("/api/characters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Récupérer le personnage pour vérifier les permissions
    const character = await prisma.character.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }
    
    // Vérifier les permissions
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMJ = user?.role === 'mj';
    const isOwner = character.userId === userId;
    
    if (!isMJ && !isOwner) {
      return res.status(403).json({ error: "Vous n'avez pas le droit de supprimer ce personnage" });
    }
    
    // Supprimer le personnage
    await prisma.character.delete({
      where: { id }
    });
    
    // Émettre l'événement WebSocket pour notifier les MJ
    emitToAll('characterDeleted', id);
    
    res.json({ message: "Personnage supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du personnage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/games/:id/dice-rolls", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const diceRolls = await prisma.diceRoll.findMany({
      where: { gameId: id },
      include: {
        character: {
          select: { name: true, playerName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    res.json(diceRolls);
  } catch (error) {
    console.error("Erreur lors de la récupération des lancers de dés:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour récupérer TOUS les jets de dés récents (toutes parties confondues)
app.get("/api/dice-rolls/recent", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const diceRolls = await prisma.diceRoll.findMany({
      include: {
        character: {
          select: { name: true, playerName: true }
        },
        game: {
          select: { name: true }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    res.json(diceRolls);
  } catch (error) {
    console.error("Erreur lors de la récupération des lancers de dés récents:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour récupérer les statistiques des jets de dés
app.get("/api/dice-rolls/stats", async (req, res) => {
  try {
    // Récupérer tous les jets
    const allRolls = await prisma.diceRoll.findMany({
      include: {
        character: { select: { name: true, playerName: true } },
        user: { select: { username: true } }
      }
    });
    
    // Date d'aujourd'hui (début de journée)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculer les statistiques
    const totalRolls = allRolls.length;
    const todayRolls = allRolls.filter(r => new Date(r.createdAt) >= today).length;
    
    // Moyenne générale
    const averageResult = totalRolls > 0 
      ? allRolls.reduce((sum, r) => sum + r.result, 0) / totalRolls 
      : 0;
    
    // Stats par type de dé
    const byDiceType = {};
    allRolls.forEach(roll => {
      const type = roll.diceType?.toLowerCase() || 'unknown';
      if (!byDiceType[type]) {
        byDiceType[type] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
      }
      byDiceType[type].count++;
      byDiceType[type].sum += roll.result;
      byDiceType[type].min = Math.min(byDiceType[type].min, roll.result);
      byDiceType[type].max = Math.max(byDiceType[type].max, roll.result);
    });
    
    // Calculer les moyennes par type
    Object.keys(byDiceType).forEach(type => {
      byDiceType[type].average = byDiceType[type].sum / byDiceType[type].count;
      if (byDiceType[type].min === Infinity) byDiceType[type].min = 0;
      if (byDiceType[type].max === -Infinity) byDiceType[type].max = 0;
    });
    
    // Stats par joueur
    const byPlayer = {};
    allRolls.forEach(roll => {
      const playerName = roll.character?.name || roll.user?.username || roll.playerName || 'Inconnu';
      if (!byPlayer[playerName]) {
        byPlayer[playerName] = { count: 0, sum: 0 };
      }
      byPlayer[playerName].count++;
      byPlayer[playerName].sum += roll.result;
    });
    
    // Calculer les moyennes par joueur
    Object.keys(byPlayer).forEach(player => {
      byPlayer[player].average = byPlayer[player].sum / byPlayer[player].count;
    });
    
    // Joueurs uniques
    const uniquePlayers = Object.keys(byPlayer).length;
    
    // Records
    const d100Rolls = allRolls.filter(r => r.diceType?.toLowerCase() === 'd100');
    const records = {
      bestD100: d100Rolls.length > 0 
        ? d100Rolls.reduce((best, r) => r.result < best.result ? r : best)
        : null,
      worstD100: d100Rolls.length > 0 
        ? d100Rolls.reduce((worst, r) => r.result > worst.result ? r : worst)
        : null
    };
    
    res.json({
      totalRolls,
      todayRolls,
      averageResult,
      uniquePlayers,
      byDiceType,
      byPlayer,
      records
    });
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes pour les cartes
app.get("/api/games/:id/cards", async (req, res) => {
  try {
    const { id } = req.params;
    const cards = await prisma.card.findMany({
      where: { gameId: id },
      include: {
        characterCards: {
          include: {
            character: {
              select: { id: true, name: true, playerName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(cards);
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/games/:id/cards", async (req, res) => {
  try {
    const { id } = req.params;
    const cardData = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent créer des cartes" });
    }
    
    // Vérifier que la partie existe
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    const card = await prisma.card.create({
      data: {
        ...cardData,
        gameId: id
      },
      include: {
        characterCards: {
          include: {
            character: {
              select: { id: true, name: true, playerName: true }
            }
          }
        }
      }
    });
    
    res.json(card);
  } catch (error) {
    console.error("Erreur lors de la création de la carte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cardData = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent modifier des cartes" });
    }
    
    const card = await prisma.card.update({
      where: { id },
      data: cardData,
      include: {
        characterCards: {
          include: {
            character: {
              select: { id: true, name: true, playerName: true }
            }
          }
        }
      }
    });
    
    res.json(card);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la carte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent supprimer des cartes" });
    }
    
    await prisma.card.delete({
      where: { id }
    });
    
    res.json({ message: "Carte supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la carte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/cards/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { characterId, notes } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent attribuer des cartes" });
    }
    
    // Vérifier que la carte existe
    const card = await prisma.card.findUnique({
      where: { id }
    });
    
    if (!card) {
      return res.status(404).json({ error: "Carte non trouvée" });
    }
    
    // Vérifier que le personnage existe
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }
    
    // Vérifier que le personnage et la carte sont dans la même partie
    if (character.gameId !== card.gameId) {
      return res.status(400).json({ error: "Le personnage et la carte doivent être dans la même partie" });
    }
    
    // Créer l'attribution
    const characterCard = await prisma.characterCard.create({
      data: {
        cardId: id,
        characterId: characterId,
        notes: notes || ''
      },
      include: {
        card: true,
        character: {
          select: { id: true, name: true, playerName: true }
        }
      }
    });
    
    res.json(characterCard);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Ce personnage possède déjà cette carte" });
    }
    console.error("Erreur lors de l'attribution de la carte:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/cards/:id/remove", async (req, res) => {
  try {
    const { id } = req.params;
    const { characterId } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent retirer des cartes" });
    }
    
    // Supprimer l'attribution
    await prisma.characterCard.deleteMany({
      where: {
        cardId: id,
        characterId: characterId
      }
    });
    
    res.json({ message: "Carte retirée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la carte du personnage:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Endpoints pour les transactions
app.get("/api/characters/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    
    const transactions = await prisma.transaction.findMany({
      where: { characterId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(transactions);
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/characters/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, currency, description } = req.body;
    
    // Vérifier que le personnage existe
    const character = await prisma.character.findUnique({
      where: { id },
      include: { game: true }
    });
    
    if (!character) {
      return res.status(404).json({ error: "Personnage non trouvé" });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount,
        currency,
        description,
        characterId: id,
        gameId: character.gameId
      }
    });
    
    res.json(transaction);
  } catch (error) {
    console.error("Erreur lors de la création de la transaction:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes pour les transactions de la caisse commune
app.get("/api/games/:id/common-treasury/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    
    const transactions = await prisma.commonTreasuryTransaction.findMany({
      where: { gameId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(transactions);
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions de la caisse commune:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/games/:id/common-treasury/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, currency, description, username } = req.body;
    
    // Vérifier que la partie existe
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    if (!username) {
      return res.status(400).json({ error: "Nom d'utilisateur requis" });
    }
    
    const transaction = await prisma.commonTreasuryTransaction.create({
      data: {
        type,
        amount,
        currency,
        description,
        username,
        gameId: id
      }
    });
    
    // Émettre l'événement WebSocket pour notifier tous les joueurs
    emitToAll('commonTreasuryTransaction', {
      gameId: id,
      transaction,
      username
    });
    
    res.json(transaction);
  } catch (error) {
    console.error("Erreur lors de la création de la transaction de la caisse commune:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Routes pour les véhicules (inventaire commun)
app.get("/api/games/:id/vehicles", async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicles = await prisma.vehicle.findMany({
      where: { gameId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parser le JSON des cagettes pour chaque véhicule
    const processedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      crates: vehicle.crates ? JSON.parse(vehicle.crates) : []
    }));
    
    res.json(processedVehicles);
  } catch (error) {
    console.error("Erreur lors de la récupération des véhicules:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/games/:id/vehicles", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, maxCrates } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent créer des véhicules" });
    }
    
    // Vérifier que la partie existe
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    const vehicle = await prisma.vehicle.create({
      data: {
        name: name || 'Nouveau véhicule',
        maxCrates: maxCrates || 1,
        crates: JSON.stringify([]),
        gameId: id
      }
    });
    
    // Parser les cagettes pour la réponse
    const processedVehicle = {
      ...vehicle,
      crates: []
    };
    
    // Émettre l'événement WebSocket pour notifier tous les joueurs
    emitToAll('vehicleCreated', { gameId: id, vehicle: processedVehicle });
    
    res.json(processedVehicle);
  } catch (error) {
    console.error("Erreur lors de la création du véhicule:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, maxCrates, crates } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que le véhicule existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });
    
    if (!existingVehicle) {
      return res.status(404).json({ error: "Véhicule non trouvé" });
    }
    
    // Préparer les données à mettre à jour
    const updateData = {};
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    const isMJ = user && user.role === 'mj';
    
    // Tout le monde peut modifier le nom du véhicule
    if (name !== undefined) updateData.name = name;
    
    // Seul le MJ peut modifier le maxCrates du véhicule
    if (isMJ) {
      if (maxCrates !== undefined) updateData.maxCrates = maxCrates;
    }
    
    // Gestion des cagettes
    if (crates !== undefined) {
      const currentCrates = existingVehicle.crates ? JSON.parse(existingVehicle.crates) : [];
      const vehicleMaxCrates = maxCrates !== undefined ? maxCrates : existingVehicle.maxCrates;
      
      // Vérifier que le nombre de cagettes ne dépasse pas le max (sauf pour le MJ)
      if (!isMJ && crates.length > vehicleMaxCrates) {
        return res.status(403).json({ 
          error: `Nombre maximum de cagettes atteint (${vehicleMaxCrates}). Faites une demande au MJ pour en ajouter.` 
        });
      }
      
      updateData.crates = JSON.stringify(crates);
    }
    
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData
    });
    
    // Parser les cagettes pour la réponse
    const processedVehicle = {
      ...vehicle,
      crates: vehicle.crates ? JSON.parse(vehicle.crates) : []
    };
    
    // Émettre l'événement WebSocket pour notifier tous les joueurs
    emitToAll('vehicleUpdated', { gameId: existingVehicle.gameId, vehicle: processedVehicle });
    
    res.json(processedVehicle);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du véhicule:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Routes pour les demandes de cagettes
app.get("/api/games/:id/crate-requests", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    const where = { gameId: id };
    if (status) {
      where.status = status;
    }
    
    const requests = await prisma.crateRequest.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(requests);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/vehicles/:id/crate-requests", async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedSlots, reason } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    // Vérifier que le véhicule existe
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: "Véhicule non trouvé" });
    }
    
    const request = await prisma.crateRequest.create({
      data: {
        requestedSlots: requestedSlots || 1,
        reason: reason || null,
        username: user.username,
        vehicleId: id,
        gameId: vehicle.gameId
      },
      include: {
        vehicle: {
          select: { id: true, name: true, maxCrates: true }
        }
      }
    });
    
    // Émettre l'événement WebSocket pour notifier le MJ
    emitToAll('crateRequestCreated', { gameId: vehicle.gameId, request });
    
    res.json(request);
  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/crate-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent approuver les demandes" });
    }
    
    // Récupérer la demande
    const request = await prisma.crateRequest.findUnique({
      where: { id },
      include: { vehicle: true }
    });
    
    if (!request) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.crateRequest.update({
      where: { id },
      data: { status },
      include: {
        vehicle: {
          select: { id: true, name: true, maxCrates: true }
        }
      }
    });
    
    // Si approuvée, augmenter seulement maxCrates (sans ajouter de cagette)
    if (status === 'approved') {
      const vehicle = request.vehicle;
      const requestedIncrease = request.requestedSlots || 1;
      
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          maxCrates: vehicle.maxCrates + requestedIncrease
        }
      });
      
      // Parser et émettre la mise à jour du véhicule
      const processedVehicle = {
        ...updatedVehicle,
        crates: updatedVehicle.crates ? JSON.parse(updatedVehicle.crates) : []
      };
      
      emitToAll('vehicleUpdated', { gameId: vehicle.gameId, vehicle: processedVehicle });
    }
    
    // Émettre l'événement pour la mise à jour de la demande
    emitToAll('crateRequestUpdated', { gameId: request.gameId, request: updatedRequest });
    
    res.json(updatedRequest);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la demande:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/crate-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent supprimer les demandes" });
    }
    
    const request = await prisma.crateRequest.findUnique({
      where: { id }
    });
    
    if (!request) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    await prisma.crateRequest.delete({
      where: { id }
    });
    
    emitToAll('crateRequestDeleted', { gameId: request.gameId, requestId: id });
    
    res.json({ message: "Demande supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la demande:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ========== ROUTES POUR LES DEMANDES DE VÉHICULES ==========

// Récupérer les demandes de véhicules pour une partie
app.get("/api/games/:id/vehicle-requests", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    const where = { gameId: id };
    if (status) {
      where.status = status;
    }
    
    const requests = await prisma.vehicleRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(requests);
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes de véhicules:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer une demande de véhicule
app.post("/api/games/:id/vehicle-requests", async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleName, maxCrates, reason } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    if (!vehicleName || !vehicleName.trim()) {
      return res.status(400).json({ error: "Le nom du véhicule est requis" });
    }
    
    const request = await prisma.vehicleRequest.create({
      data: {
        vehicleName: vehicleName.trim(),
        maxCrates: maxCrates || 1,
        reason: reason || null,
        username: user.username,
        gameId: id
      }
    });
    
    emitToAll('vehicleRequestCreated', { gameId: id, request });
    
    res.status(201).json(request);
  } catch (error) {
    console.error("Erreur lors de la création de la demande de véhicule:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour une demande de véhicule (approuver/rejeter - MJ seulement)
app.put("/api/vehicle-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent traiter les demandes" });
    }
    
    const existingRequest = await prisma.vehicleRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    // Si la demande est approuvée, créer le véhicule
    if (status === 'approved') {
      // Créer le véhicule
      const vehicle = await prisma.vehicle.create({
        data: {
          name: existingRequest.vehicleName,
          maxCrates: existingRequest.maxCrates,
          crates: JSON.stringify([]),
          gameId: existingRequest.gameId
        }
      });
      
      // Émettre l'événement de création de véhicule
      emitToAll('vehicleCreated', { 
        gameId: existingRequest.gameId, 
        vehicle: {
          ...vehicle,
          crates: []
        }
      });
    }
    
    // Mettre à jour le statut de la demande
    const request = await prisma.vehicleRequest.update({
      where: { id },
      data: { status }
    });
    
    emitToAll('vehicleRequestUpdated', { gameId: request.gameId, request });
    
    res.json(request);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la demande de véhicule:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une demande de véhicule (MJ seulement)
app.delete("/api/vehicle-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent supprimer les demandes" });
    }
    
    const request = await prisma.vehicleRequest.findUnique({
      where: { id }
    });
    
    if (!request) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }
    
    await prisma.vehicleRequest.delete({
      where: { id }
    });
    
    emitToAll('vehicleRequestDeleted', { gameId: request.gameId, requestId: id });
    
    res.json({ message: "Demande supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la demande de véhicule:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seuls les Maîtres de Jeu peuvent supprimer des véhicules" });
    }
    
    // Récupérer le véhicule pour avoir le gameId
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: "Véhicule non trouvé" });
    }
    
    await prisma.vehicle.delete({
      where: { id }
    });
    
    // Émettre l'événement WebSocket pour notifier tous les joueurs
    emitToAll('vehicleDeleted', { gameId: vehicle.gameId, vehicleId: id });
    
    res.json({ message: "Véhicule supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du véhicule:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour scanner les cartes disponibles
app.get("/api/cards/available", async (req, res) => {
  try {
    const cartesDir = path.join(process.cwd(), 'public', 'cartes');
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(cartesDir)) {
      return res.json([]);
    }

    // Lire les fichiers du dossier
    const files = fs.readdirSync(cartesDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    // Générer les cartes à partir des fichiers PDF
    const availableCards = pdfFiles.map(file => {
      const nameWithoutExt = file.replace(/\.pdf$/i, '');
      const words = nameWithoutExt.split('-');
      const capitalizedWords = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      );
      const cardName = capitalizedWords.join(' ');
      
      return {
        name: cardName,
        description: `Une carte géographique détaillée : ${cardName}`,
        type: "Carte du monde",
        rarity: "Commune",
        cost: 0,
        image: `/cartes/${file}`,
        filename: file
      };
    });

    res.json(availableCards);
  } catch (error) {
    console.error("Erreur lors du scan des cartes:", error);
    res.status(500).json({ error: "Erreur lors du scan des cartes" });
  }
});

// Route pour la racine
app.get('/', (req, res) => {
  console.log(`[Server] Route racine demandée`);
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  console.log(`[Server] Tentative de servir: ${indexPath}`);
  console.log(`[Server] Fichier existe: ${fs.existsSync(indexPath)}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Fichier index.html non trouvé',
      path: indexPath,
      workingDir: process.cwd(),
      distExists: fs.existsSync('dist')
    });
  }
});

// Route de fallback pour toutes les autres routes SPA
app.use((req, res) => {
  console.log(`[Server] Route de fallback pour: ${req.path}`);
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  console.log(`[Server] Tentative de servir: ${indexPath}`);
  console.log(`[Server] Fichier existe: ${fs.existsSync(indexPath)}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Fichier index.html non trouvé',
      path: indexPath,
      workingDir: process.cwd(),
      distExists: fs.existsSync('dist')
    });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] API server running on port ${PORT}`);
  console.log(`[Server] Accessible via localhost: http://localhost:${PORT}`);
  console.log(`[Server] Accessible via Webstrator: http://185.207.226.6:${PORT}`);
  console.log('');
  console.log('🌐 Application déployée sur Webstrator');
  console.log(`📱 URL d\'accès: http://185.207.226.6:${PORT}`);
  console.log('');
});

// Créer l'instance Socket.IO
const io = new Server(server, { 
  cors: {
    origin: [
      'http://localhost:30072',
      'http://185.207.226.6:30072',
      'http://localhost:5173', // Pour le dev Vite
      'http://localhost:3000'  // Pour le dev React
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Fonction pour émettre des événements WebSocket
const emitToAll = (event, data) => {
  if (io) {
    console.log(`[Server] Émission ${event}:`, data?.name || data);
    io.emit(event, data);
  } else {
    console.warn(`[Server] Impossible d'émettre ${event}: io non disponible`);
  }
};

io.on("connection", (socket) => {
  console.log("🧑 Un joueur est connecté :", socket.id);

  // Quand un joueur lance les dés
  socket.on("dice:roll", async (data) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`[Server] 🎲 ÉVÉNEMENT dice:roll REÇU`);
    console.log(`[Server] 📦 Données complètes reçues:`, JSON.stringify(data, null, 2));
    console.log(`[Server] 🆔 Session ID reçu:`, data.sessionId);
    console.log(`[Server] 👤 Joueur:`, data.player);
    
    const { notation, type, player, sessionId, gameId, characterId, userId } = data || {};
    
    if ((!notation && !type) || !player) {
      console.error("[Server] ❌ Données manquantes dans dice:roll:", data);
      return;
    }
    
    // Préparer les données à relayer (SANS générer de résultat)
    const dataToRelay = { 
      notation: notation || type, 
      type: type,
      player,
      sessionId,  // ← IMPORTANT : Relayer le sessionId
      gameId,
      characterId,
      userId
    };
    
    console.log(`[Server] 📤 Données relayées à TOUS les clients:`, JSON.stringify(dataToRelay, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    io.emit("dice:rolled", dataToRelay);
  });

  // Quand un joueur partage son résultat de dé
  socket.on("dice:result", async (data) => {
    console.log(`[Server] 📊 dice:result reçu de ${data.player}:`, data.result);
    console.log(`[Server] 📦 Données complètes reçues:`, JSON.stringify(data, null, 2));
    const { result, details, player, notation, type, sessionId, gameId, characterId, userId } = data || {};
    
    if (result === null || result === undefined || !player) {
      console.error("[Server] Données manquantes dans dice:result:", data);
      return;
    }
    
    // TOUJOURS sauvegarder dans la base de données (gameId est maintenant optionnel)
    let savedDiceRoll = null;
    try {
      // Calculer tens et units pour les d100
      let tens = null;
      let units = null;
      if ((type === 'd100' || notation === 'd100') && typeof result === 'number') {
        tens = Math.floor(result / 10);
        units = result % 10;
      }
      
      savedDiceRoll = await prisma.diceRoll.create({
        data: {
          diceType: type || notation || 'unknown',
          result: result,
          tens: tens,
          units: units,
          playerName: player, // Stocker le nom du joueur
          gameId: gameId || null,
          characterId: characterId || null,
          userId: userId || null
        },
        include: {
          character: {
            select: { name: true, playerName: true }
          },
          game: {
            select: { name: true }
          },
          user: {
            select: { username: true }
          }
        }
      });
      console.log(`[Server] ✅ Jet de dé sauvegardé en base:`, savedDiceRoll.id);
    } catch (error) {
      console.error("[Server] ❌ Erreur lors de la sauvegarde du jet de dé:", error);
    }
    
    // Relayer le résultat à tous les autres joueurs avec toutes les infos
    console.log(`[Server] 📤 Partage du résultat de ${player} à tous les clients:`, result);
    console.log(`[Server] 📊 Type de dé: ${notation || type || 'inconnu'}`);
    
    const resultData = { 
      result, 
      details: details || [],
      player,
      notation,  // Ajouter la notation
      type,      // Ajouter le type
      sessionId,  // Ajouter le sessionId
      gameId,
      savedRoll: savedDiceRoll  // Inclure le jet sauvegardé pour la mise à jour en temps réel
    };
    
    io.emit("dice:result", resultData);
    
    // Émettre un événement spécifique pour l'historique si sauvegardé
    if (savedDiceRoll) {
      io.emit("dice:history:new", { 
        gameId, 
        diceRoll: {
          ...savedDiceRoll,
          player  // Ajouter le nom du joueur pour l'affichage
        }
      });
    }
  });

  // Relayer les frames du canvas pour le streaming vidéo
  socket.on("canvas:frame", (data) => {
    // Relayer le frame à tous les autres clients (broadcast)
    socket.broadcast.emit("canvas:frame", data);
  });

  // Relayer la fin du stream
  socket.on("canvas:stream-end", (data) => {
    console.log(`[Server] 🛑 Fin du stream de ${data.player}`);
    socket.broadcast.emit("canvas:stream-end", data);
  });

  socket.on("disconnect", () => console.log("[Server] Un joueur est parti"));
});

console.log(`[Server] Socket.IO server running on port ${PORT}`);
