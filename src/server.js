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

// ========== ROUTES POUR L'HEURE EN JEU ==========

// Route pour récupérer l'heure en jeu d'une partie
app.get("/api/games/:id/game-time", async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        gameTime: true,
        gameDate: true
      }
    });
    
    if (!game) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    res.json(game);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'heure en jeu:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour mettre à jour l'heure en jeu d'une partie (MJ seulement)
app.put("/api/games/:id/game-time", async (req, res) => {
  try {
    const { id } = req.params;
    const { gameTime, gameDate } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut modifier l'heure en jeu" });
    }
    
    // Vérifier que la partie existe
    const existingGame = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!existingGame) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    // Mettre à jour l'heure en jeu
    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        gameTime: gameTime !== undefined ? gameTime : existingGame.gameTime,
        gameDate: gameDate !== undefined ? gameDate : existingGame.gameDate
      },
      select: {
        id: true,
        gameTime: true,
        gameDate: true
      }
    });
    
    // Émettre l'événement WebSocket pour notifier tous les joueurs
    emitToAll('gameTimeUpdated', { gameId: id, gameTime: updatedGame.gameTime, gameDate: updatedGame.gameDate });
    
    console.log(`[Server] Heure en jeu mise à jour pour la partie ${id}:`, updatedGame);
    
    res.json(updatedGame);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'heure en jeu:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
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
    
    // Parser les données JSON pour possessions, notes et temporarySkills
    const processedCharacters = characters.map(character => {
      let possessions = [];
      let notes = [];
      let temporarySkills = [];

      try {
        possessions = character.possessions ? JSON.parse(character.possessions) : [];
      } catch (e) {
        possessions = [];
      }

      try {
        notes = character.notes ? JSON.parse(character.notes) : [];
      } catch (e) {
        notes = [];
      }

      try {
        temporarySkills = character.temporarySkills ? JSON.parse(character.temporarySkills) : [];
      } catch (e) {
        temporarySkills = [];
      }

      return {
        ...character,
        possessions,
        notes,
        temporarySkills
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
    
    // Parser les données JSON pour possessions, notes et temporarySkills
    const processedCharacter = {
      ...character,
      possessions: character.possessions ? JSON.parse(character.possessions) : [],
      notes: character.notes ? JSON.parse(character.notes) : [],
      temporarySkills: character.temporarySkills ? JSON.parse(character.temporarySkills) : []
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

    // Filtrer explicitement les champs autorisés pour éviter les erreurs Prisma
    const processedData = {};

    // Champs texte simples
    if (characterData.name !== undefined) processedData.name = characterData.name;
    if (characterData.function !== undefined) processedData.function = characterData.function;
    if (characterData.playerName !== undefined) processedData.playerName = characterData.playerName;
    if (characterData.weapon1 !== undefined) processedData.weapon1 = characterData.weapon1;
    if (characterData.damage1 !== undefined) processedData.damage1 = characterData.damage1;
    if (characterData.weapon2 !== undefined) processedData.weapon2 = characterData.weapon2;
    if (characterData.damage2 !== undefined) processedData.damage2 = characterData.damage2;
    if (characterData.weapon3 !== undefined) processedData.weapon3 = characterData.weapon3;
    if (characterData.damage3 !== undefined) processedData.damage3 = characterData.damage3;
    if (characterData.awesomeBecause !== undefined) processedData.awesomeBecause = characterData.awesomeBecause;
    if (characterData.societyProblems !== undefined) processedData.societyProblems = characterData.societyProblems;

    // Champs numériques
    if (characterData.age !== undefined) processedData.age = characterData.age;
    if (characterData.lifePoints !== undefined) processedData.lifePoints = characterData.lifePoints;
    if (characterData.currentLifePoints !== undefined) processedData.currentLifePoints = characterData.currentLifePoints;
    if (characterData.wounds !== undefined) processedData.wounds = characterData.wounds;
    if (characterData.protection !== undefined) processedData.protection = characterData.protection;
    if (characterData.strength !== undefined) processedData.strength = characterData.strength;
    if (characterData.dexterity !== undefined) processedData.dexterity = characterData.dexterity;
    if (characterData.endurance !== undefined) processedData.endurance = characterData.endurance;
    if (characterData.intelligence !== undefined) processedData.intelligence = characterData.intelligence;
    if (characterData.charisma !== undefined) processedData.charisma = characterData.charisma;
    if (characterData.reflexes !== undefined) processedData.reflexes = characterData.reflexes;
    if (characterData.closeCombat !== undefined) processedData.closeCombat = characterData.closeCombat;
    if (characterData.dodge !== undefined) processedData.dodge = characterData.dodge;

    // Champs monétaires
    if (characterData.crowns !== undefined) processedData.crowns = characterData.crowns;
    if (characterData.orbs !== undefined) processedData.orbs = characterData.orbs;
    if (characterData.scepters !== undefined) processedData.scepters = characterData.scepters;
    if (characterData.kings !== undefined) processedData.kings = characterData.kings;

    // Champs JSON (convertir les tableaux en JSON string)
    if (characterData.skills !== undefined) processedData.skills = characterData.skills;
    if (characterData.specialSkills !== undefined) processedData.specialSkills = characterData.specialSkills;

    if (characterData.possessions !== undefined) {
      processedData.possessions = Array.isArray(characterData.possessions)
        ? JSON.stringify(characterData.possessions)
        : characterData.possessions;
    }

    if (characterData.notes !== undefined) {
      processedData.notes = Array.isArray(characterData.notes)
        ? JSON.stringify(characterData.notes)
        : characterData.notes;
    }

    if (characterData.temporarySkills !== undefined) {
      processedData.temporarySkills = Array.isArray(characterData.temporarySkills)
        ? JSON.stringify(characterData.temporarySkills)
        : characterData.temporarySkills;
    }

    console.log("Données reçues pour mise à jour:", processedData);
    console.log("currentLifePoints reçu:", characterData.currentLifePoints);

    let character;
    try {
      character = await prisma.character.update({
        where: { id },
        data: processedData
      });
    } catch (prismaError) {
      // Si l'erreur est "Unknown argument", retirer le champ problématique et réessayer
      if (prismaError.message && prismaError.message.includes('Unknown argument')) {
        const match = prismaError.message.match(/Unknown argument `?(\w+)`?/);
        if (match) {
          const unknownField = match[1];
          console.warn(`Champ inconnu détecté: ${unknownField}, réessai sans ce champ...`);
          delete processedData[unknownField];

          // Réessayer sans le champ problématique
          character = await prisma.character.update({
            where: { id },
            data: processedData
          });
        } else {
          throw prismaError;
        }
      } else {
        throw prismaError;
      }
    }

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

// Routes pour les sessions de jeu
app.get("/api/games/:id/sessions", async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await prisma.gameSession.findMany({
      where: { gameId: id },
      orderBy: { date: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/sessions/:id/dice-rolls", async (req, res) => {
  try {
    const { id } = req.params;
    const diceRolls = await prisma.diceRoll.findMany({
      where: { sessionId: id },
      include: {
        character: {
          select: { name: true, playerName: true }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(diceRolls);
  } catch (error) {
    console.error("Erreur lors de la récupération des jets de dés de la session:", error);
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

// ========== ROUTES POUR LES TRANSFERTS D'ITEMS ==========

// Récupérer les transferts en attente pour un personnage (reçus)
app.get("/api/characters/:id/item-transfers/pending", async (req, res) => {
  try {
    const { id } = req.params;
    
    const transfers = await prisma.itemTransfer.findMany({
      where: { 
        toCharacterId: id,
        status: 'pending'
      },
      include: {
        fromCharacter: {
          select: { id: true, name: true, playerName: true }
        },
        toCharacter: {
          select: { id: true, name: true, playerName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(transfers);
  } catch (error) {
    console.error("Erreur lors de la récupération des transferts:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer tous les transferts d'un personnage (envoyés et reçus)
app.get("/api/characters/:id/item-transfers", async (req, res) => {
  try {
    const { id } = req.params;
    
    const transfers = await prisma.itemTransfer.findMany({
      where: { 
        OR: [
          { fromCharacterId: id },
          { toCharacterId: id }
        ]
      },
      include: {
        fromCharacter: {
          select: { id: true, name: true, playerName: true }
        },
        toCharacter: {
          select: { id: true, name: true, playerName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(transfers);
  } catch (error) {
    console.error("Erreur lors de la récupération des transferts:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer une demande de transfert d'item (don ou échange)
app.post("/api/item-transfers", async (req, res) => {
  try {
    const { 
      itemId, itemText, fromCharacterId, toCharacterId, gameId, 
      requestedItemId, requestedItemText, isExchange,
      // Argent offert
      offeredCrowns = 0, offeredOrbs = 0, offeredScepters = 0, offeredKings = 0,
      // Argent demandé
      requestedCrowns = 0, requestedOrbs = 0, requestedScepters = 0, requestedKings = 0
    } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier qu'il y a quelque chose à transférer
    const hasItem = itemId && itemText;
    const hasOfferedMoney = offeredCrowns > 0 || offeredOrbs > 0 || offeredScepters > 0 || offeredKings > 0;
    
    if (!hasItem && !hasOfferedMoney) {
      return res.status(400).json({ error: "Aucun item ou argent à transférer" });
    }
    
    // Vérifier que l'utilisateur est propriétaire du personnage source
    const fromCharacter = await prisma.character.findUnique({
      where: { id: fromCharacterId }
    });
    
    if (!fromCharacter) {
      return res.status(404).json({ error: "Personnage source non trouvé" });
    }
    
    if (fromCharacter.userId !== userId) {
      // Vérifier si c'est le MJ
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'mj') {
        return res.status(403).json({ error: "Vous ne pouvez transférer que vos propres items" });
      }
    }
    
    // Vérifier que le personnage source a assez d'argent
    if (offeredCrowns > (fromCharacter.crowns || 0) ||
        offeredOrbs > (fromCharacter.orbs || 0) ||
        offeredScepters > (fromCharacter.scepters || 0) ||
        offeredKings > (fromCharacter.kings || 0)) {
      return res.status(400).json({ error: "Vous n'avez pas assez d'argent" });
    }
    
    // Vérifier que le personnage cible existe
    const toCharacter = await prisma.character.findUnique({
      where: { id: toCharacterId }
    });
    
    if (!toCharacter) {
      return res.status(404).json({ error: "Personnage cible non trouvé" });
    }
    
    // Vérifier que les deux personnages sont dans la même partie
    if (fromCharacter.gameId !== toCharacter.gameId) {
      return res.status(400).json({ error: "Les personnages doivent être dans la même partie" });
    }
    
    // Note: On ne vérifie pas si la cible a assez d'argent ici
    // La vérification se fera lors de l'acceptation du transfert
    // Cela évite de révéler les fonds d'un joueur
    
    // Créer le transfert (don ou échange)
    const transfer = await prisma.itemTransfer.create({
      data: {
        itemId: hasItem ? itemId : null,
        itemText: hasItem ? itemText : null,
        fromCharacterId,
        toCharacterId,
        gameId: fromCharacter.gameId,
        isExchange: isExchange || false,
        requestedItemId: isExchange && requestedItemId ? requestedItemId : null,
        requestedItemText: isExchange && requestedItemText ? requestedItemText : null,
        // Argent
        offeredCrowns: offeredCrowns || 0,
        offeredOrbs: offeredOrbs || 0,
        offeredScepters: offeredScepters || 0,
        offeredKings: offeredKings || 0,
        requestedCrowns: isExchange ? (requestedCrowns || 0) : 0,
        requestedOrbs: isExchange ? (requestedOrbs || 0) : 0,
        requestedScepters: isExchange ? (requestedScepters || 0) : 0,
        requestedKings: isExchange ? (requestedKings || 0) : 0
      },
      include: {
        fromCharacter: {
          select: { id: true, name: true, playerName: true }
        },
        toCharacter: {
          select: { id: true, name: true, playerName: true }
        }
      }
    });
    
    // Émettre l'événement WebSocket
    emitToAll('itemTransferCreated', { gameId: fromCharacter.gameId, transfer });
    
    res.status(201).json(transfer);
  } catch (error) {
    console.error("Erreur lors de la création du transfert:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Accepter ou refuser un transfert
app.put("/api/item-transfers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' ou 'rejected'
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    
    // Récupérer le transfert
    const transfer = await prisma.itemTransfer.findUnique({
      where: { id },
      include: {
        fromCharacter: true,
        toCharacter: true
      }
    });
    
    if (!transfer) {
      return res.status(404).json({ error: "Transfert non trouvé" });
    }
    
    // Vérifier que l'utilisateur est propriétaire du personnage cible (ou MJ)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMJ = user && user.role === 'mj';
    
    if (transfer.toCharacter.userId !== userId && !isMJ) {
      return res.status(403).json({ error: "Vous ne pouvez pas répondre à ce transfert" });
    }
    
    // Si accepté, effectuer le transfert d'item et/ou d'argent (et l'échange si applicable)
    if (status === 'accepted') {
      // Récupérer les possessions des deux personnages
      let fromPossessions = transfer.fromCharacter.possessions 
        ? JSON.parse(transfer.fromCharacter.possessions) 
        : [];
      let toPossessions = transfer.toCharacter.possessions 
        ? JSON.parse(transfer.toCharacter.possessions) 
        : [];
      
      // Vérifier si un item est offert
      const hasOfferedItem = transfer.itemId && transfer.itemText;
      let itemIndex = -1;
      
      if (hasOfferedItem) {
        itemIndex = fromPossessions.findIndex(item => String(item.id) === String(transfer.itemId));
        if (itemIndex === -1) {
          await prisma.itemTransfer.update({
            where: { id },
            data: { status: 'rejected' }
          });
          return res.status(400).json({ error: "L'item n'existe plus dans l'inventaire source" });
        }
      }
      
      // Vérifier l'argent offert
      const hasOfferedMoney = (transfer.offeredCrowns || 0) > 0 || 
                              (transfer.offeredOrbs || 0) > 0 || 
                              (transfer.offeredScepters || 0) > 0 || 
                              (transfer.offeredKings || 0) > 0;
      
      if (hasOfferedMoney) {
        if ((transfer.offeredCrowns || 0) > (transfer.fromCharacter.crowns || 0) ||
            (transfer.offeredOrbs || 0) > (transfer.fromCharacter.orbs || 0) ||
            (transfer.offeredScepters || 0) > (transfer.fromCharacter.scepters || 0) ||
            (transfer.offeredKings || 0) > (transfer.fromCharacter.kings || 0)) {
          await prisma.itemTransfer.update({
            where: { id },
            data: { status: 'rejected' }
          });
          return res.status(400).json({ error: "L'expéditeur n'a plus assez d'argent" });
        }
      }
      
      // Si c'est un échange, vérifier que l'item demandé existe toujours et l'argent demandé
      let exchangedItemIndex = -1;
      const hasRequestedItem = transfer.isExchange && transfer.requestedItemId;
      const hasRequestedMoney = transfer.isExchange && (
        (transfer.requestedCrowns || 0) > 0 || 
        (transfer.requestedOrbs || 0) > 0 || 
        (transfer.requestedScepters || 0) > 0 || 
        (transfer.requestedKings || 0) > 0
      );
      
      if (hasRequestedItem) {
        exchangedItemIndex = toPossessions.findIndex(item => String(item.id) === String(transfer.requestedItemId));
        if (exchangedItemIndex === -1) {
          await prisma.itemTransfer.update({
            where: { id },
            data: { status: 'rejected' }
          });
          return res.status(400).json({ error: "L'item demandé en échange n'existe plus" });
        }
      }
      
      if (hasRequestedMoney) {
        if ((transfer.requestedCrowns || 0) > (transfer.toCharacter.crowns || 0) ||
            (transfer.requestedOrbs || 0) > (transfer.toCharacter.orbs || 0) ||
            (transfer.requestedScepters || 0) > (transfer.toCharacter.scepters || 0) ||
            (transfer.requestedKings || 0) > (transfer.toCharacter.kings || 0)) {
          await prisma.itemTransfer.update({
            where: { id },
            data: { status: 'rejected' }
          });
          return res.status(400).json({ error: "Vous n'avez plus assez d'argent pour cet échange" });
        }
      }
      
      // Transférer l'item offert (de source vers cible)
      if (hasOfferedItem && itemIndex !== -1) {
        const [transferredItem] = fromPossessions.splice(itemIndex, 1);
        const newItemForTarget = {
          ...transferredItem,
          id: Date.now() + Math.random(),
          checked: false
        };
        toPossessions.push(newItemForTarget);
      }
      
      // Transférer l'item demandé en échange (de cible vers source)
      if (hasRequestedItem && exchangedItemIndex !== -1) {
        const currentExchangeIndex = toPossessions.findIndex(item => String(item.id) === String(transfer.requestedItemId));
        if (currentExchangeIndex !== -1) {
          const [exchangedItem] = toPossessions.splice(currentExchangeIndex, 1);
          const newItemForSource = {
            ...exchangedItem,
            id: Date.now() + Math.random() + 1,
            checked: false
          };
          fromPossessions.push(newItemForSource);
        }
      }
      
      // Calculer les nouveaux montants d'argent
      const newFromMoney = {
        crowns: (transfer.fromCharacter.crowns || 0) - (transfer.offeredCrowns || 0) + (transfer.requestedCrowns || 0),
        orbs: (transfer.fromCharacter.orbs || 0) - (transfer.offeredOrbs || 0) + (transfer.requestedOrbs || 0),
        scepters: (transfer.fromCharacter.scepters || 0) - (transfer.offeredScepters || 0) + (transfer.requestedScepters || 0),
        kings: (transfer.fromCharacter.kings || 0) - (transfer.offeredKings || 0) + (transfer.requestedKings || 0)
      };
      
      const newToMoney = {
        crowns: (transfer.toCharacter.crowns || 0) + (transfer.offeredCrowns || 0) - (transfer.requestedCrowns || 0),
        orbs: (transfer.toCharacter.orbs || 0) + (transfer.offeredOrbs || 0) - (transfer.requestedOrbs || 0),
        scepters: (transfer.toCharacter.scepters || 0) + (transfer.offeredScepters || 0) - (transfer.requestedScepters || 0),
        kings: (transfer.toCharacter.kings || 0) + (transfer.offeredKings || 0) - (transfer.requestedKings || 0)
      };
      
      // Préparer les transactions à créer dans l'historique
      const transactionsToCreate = [];
      const fromCharacterName = transfer.fromCharacter.name;
      const toCharacterName = transfer.toCharacter.name;
      
      // Transactions pour l'argent offert (expéditeur perd, destinataire gagne)
      const offeredCurrencies = [
        { key: 'crowns', amount: transfer.offeredCrowns || 0 },
        { key: 'orbs', amount: transfer.offeredOrbs || 0 },
        { key: 'scepters', amount: transfer.offeredScepters || 0 },
        { key: 'kings', amount: transfer.offeredKings || 0 }
      ].filter(c => c.amount > 0);
      
      for (const curr of offeredCurrencies) {
        // Transaction de sortie pour l'expéditeur
        transactionsToCreate.push({
          type: 'transfer_out',
          amount: curr.amount,
          currency: curr.key,
          description: `Transfert à ${toCharacterName}${transfer.itemText ? ` (avec: ${transfer.itemText})` : ''}`,
          characterId: transfer.fromCharacterId,
          gameId: transfer.gameId
        });
        // Transaction d'entrée pour le destinataire
        transactionsToCreate.push({
          type: 'transfer_in',
          amount: curr.amount,
          currency: curr.key,
          description: `Reçu de ${fromCharacterName}${transfer.itemText ? ` (avec: ${transfer.itemText})` : ''}`,
          characterId: transfer.toCharacterId,
          gameId: transfer.gameId
        });
      }
      
      // Transactions pour l'argent demandé en échange (destinataire perd, expéditeur gagne)
      if (transfer.isExchange) {
        const requestedCurrencies = [
          { key: 'crowns', amount: transfer.requestedCrowns || 0 },
          { key: 'orbs', amount: transfer.requestedOrbs || 0 },
          { key: 'scepters', amount: transfer.requestedScepters || 0 },
          { key: 'kings', amount: transfer.requestedKings || 0 }
        ].filter(c => c.amount > 0);
        
        for (const curr of requestedCurrencies) {
          // Transaction de sortie pour le destinataire
          transactionsToCreate.push({
            type: 'transfer_out',
            amount: curr.amount,
            currency: curr.key,
            description: `Échange avec ${fromCharacterName}${transfer.itemText ? ` (contre: ${transfer.itemText})` : ''}`,
            characterId: transfer.toCharacterId,
            gameId: transfer.gameId
          });
          // Transaction d'entrée pour l'expéditeur
          transactionsToCreate.push({
            type: 'transfer_in',
            amount: curr.amount,
            currency: curr.key,
            description: `Échange avec ${toCharacterName}${transfer.itemText ? ` (contre: ${transfer.itemText})` : ''}`,
            characterId: transfer.fromCharacterId,
            gameId: transfer.gameId
          });
        }
      }
      
      // Mettre à jour les deux personnages et créer les transactions dans une transaction DB
      await prisma.$transaction([
        prisma.character.update({
          where: { id: transfer.fromCharacterId },
          data: { 
            possessions: JSON.stringify(fromPossessions),
            crowns: newFromMoney.crowns,
            orbs: newFromMoney.orbs,
            scepters: newFromMoney.scepters,
            kings: newFromMoney.kings
          }
        }),
        prisma.character.update({
          where: { id: transfer.toCharacterId },
          data: { 
            possessions: JSON.stringify(toPossessions),
            crowns: newToMoney.crowns,
            orbs: newToMoney.orbs,
            scepters: newToMoney.scepters,
            kings: newToMoney.kings
          }
        }),
        prisma.itemTransfer.update({
          where: { id },
          data: { status: 'accepted' }
        }),
        // Créer toutes les transactions d'historique
        ...transactionsToCreate.map(t => prisma.transaction.create({ data: t }))
      ]);
      
      // Émettre les événements WebSocket pour synchroniser les personnages
      const updatedFromCharacter = await prisma.character.findUnique({
        where: { id: transfer.fromCharacterId }
      });
      const updatedToCharacter = await prisma.character.findUnique({
        where: { id: transfer.toCharacterId }
      });
      
      emitToAll('characterUpdated', updatedFromCharacter);
      emitToAll('characterUpdated', updatedToCharacter);
      emitToAll('itemTransferCompleted', { 
        gameId: transfer.gameId, 
        transferId: id,
        status: 'accepted',
        fromCharacterId: transfer.fromCharacterId,
        toCharacterId: transfer.toCharacterId,
        itemText: transfer.itemText,
        isExchange: transfer.isExchange,
        requestedItemText: transfer.requestedItemText,
        offeredCrowns: transfer.offeredCrowns,
        offeredOrbs: transfer.offeredOrbs,
        offeredScepters: transfer.offeredScepters,
        offeredKings: transfer.offeredKings,
        requestedCrowns: transfer.requestedCrowns,
        requestedOrbs: transfer.requestedOrbs,
        requestedScepters: transfer.requestedScepters,
        requestedKings: transfer.requestedKings
      });
      
      const message = transfer.isExchange 
        ? "Échange accepté" 
        : "Transfert accepté";
      
      res.json({ 
        message, 
        transfer: { ...transfer, status: 'accepted' }
      });
    } else {
      // Refuser le transfert
      await prisma.itemTransfer.update({
        where: { id },
        data: { status: 'rejected' }
      });
      
      emitToAll('itemTransferCompleted', { 
        gameId: transfer.gameId, 
        transferId: id,
        status: 'rejected',
        fromCharacterId: transfer.fromCharacterId,
        toCharacterId: transfer.toCharacterId,
        itemText: transfer.itemText
      });
      
      res.json({ 
        message: "Transfert refusé", 
        transfer: { ...transfer, status: 'rejected' }
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du transfert:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Annuler un transfert (par l'expéditeur)
app.delete("/api/item-transfers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    const transfer = await prisma.itemTransfer.findUnique({
      where: { id },
      include: { fromCharacter: true }
    });
    
    if (!transfer) {
      return res.status(404).json({ error: "Transfert non trouvé" });
    }
    
    // Vérifier que l'utilisateur est propriétaire du personnage source (ou MJ)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMJ = user && user.role === 'mj';
    
    if (transfer.fromCharacter.userId !== userId && !isMJ) {
      return res.status(403).json({ error: "Vous ne pouvez pas annuler ce transfert" });
    }
    
    if (transfer.status !== 'pending') {
      return res.status(400).json({ error: "Ce transfert ne peut plus être annulé" });
    }
    
    await prisma.itemTransfer.delete({ where: { id } });
    
    emitToAll('itemTransferDeleted', { gameId: transfer.gameId, transferId: id });
    
    res.json({ message: "Transfert annulé" });
  } catch (error) {
    console.error("Erreur lors de l'annulation du transfert:", error);
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

// ========== ROUTES POUR LES COMBATS ==========

// Créer un nouveau combat
app.post("/api/games/:id/combats", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    console.log('[API] POST /api/games/:id/combats');
    console.log('[API] gameId:', id);
    console.log('[API] userId:', userId);
    console.log('[API] headers:', req.headers);
    
    if (!userId) {
      console.log('[API] ❌ Utilisateur non authentifié');
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      console.log('[API] ❌ Utilisateur pas MJ');
      return res.status(403).json({ error: "Seul le Maître de Jeu peut créer des combats" });
    }
    
    // Vérifier que la partie existe
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      console.log('[API] ❌ Partie non trouvée');
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    // Récupérer tous les personnages de la partie
    const characters = await prisma.character.findMany({
      where: { gameId: id }
    });
    
    console.log('[API] 📋 Personnages trouvés:', characters.length);
    
    // Créer le combat
    const combat = await prisma.combat.create({
      data: {
        gameId: id,
        isActive: true,
        currentRound: 1,
        // Ajouter les personnages au combat
        combatants: {
          create: characters.map(char => ({
            characterId: char.id,
            xPos: Math.floor(Math.random() * 10),
            yPos: Math.floor(Math.random() * 10),
            order: 0
          }))
        }
      },
      include: {
        combatants: {
          include: {
            character: {
              select: { id: true, name: true, playerName: true, lifePoints: true, currentLifePoints: true, weapon1: true, damage1: true }
            }
          }
        },
        enemies: true
      }
    });
    
    console.log('[API] ✅ Combat créé:', combat.id);
    
    // Émettre l'événement WebSocket
    emitToAll('combatStarted', { gameId: id, combat });
    
    res.json(combat);
  } catch (error) {
    console.error("[API] ❌ Erreur lors de la création du combat:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// ========== INITIATIVE ==========

// Lancer l'initiative pour un combattant (personnage)
app.post("/api/combats/:combatId/initiative/:combatantId", async (req, res) => {
  try {
    const { combatId, combatantId } = req.params;
    
    console.log(`[API] POST Initiative pour combattant ${combatantId}`);
    
    // Récupérer le combattant
    const combatant = await prisma.combatCombatant.findUnique({
      where: { id: combatantId },
      include: { character: true, combat: true }
    });
    
    if (!combatant) {
      return res.status(404).json({ error: "Combattant non trouvé" });
    }
    
    // Vérifier que le combattant appartient au combat
    if (combatant.combatId !== combatId) {
      return res.status(400).json({ error: "Combattant n'appartient pas à ce combat" });
    }
    
    // Lancer 1D100
    const initiativeRoll = Math.floor(Math.random() * 100) + 1;
    const reflexesScore = combatant.character.reflexes || 50;
    const passed = initiativeRoll <= reflexesScore;
    
    console.log(`[API] Initiative: D100=${initiativeRoll}, Réflexes=${reflexesScore}, Réussi=${passed}`);
    
    // Mettre à jour le combattant
    const updated = await prisma.combatCombatant.update({
      where: { id: combatantId },
      data: {
        initiativeRoll,
        reflexesScore,
        passed
      },
      include: { character: true }
    });
    
    // Émettre l'événement WebSocket
    emitToAll('initiativeRolled', {
      gameId: combatant.combat.gameId,
      combatId,
      combatantId,
      characterName: combatant.character.name,
      roll: initiativeRoll,
      reflexes: reflexesScore,
      passed
    });
    
    res.json(updated);
  } catch (error) {
    console.error("[API] ❌ Erreur lors du lancer d'initiative:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Lancer l'initiative pour un ennemi
app.post("/api/combats/:combatId/initiative-enemy/:enemyId", async (req, res) => {
  try {
    const { combatId, enemyId } = req.params;
    
    console.log(`[API] POST Initiative pour ennemi ${enemyId}`);
    
    // Récupérer l'ennemi
    const enemy = await prisma.enemy.findUnique({
      where: { id: enemyId }
    });
    
    if (!enemy) {
      return res.status(404).json({ error: "Ennemi non trouvé" });
    }
    
    // Vérifier que l'ennemi appartient au combat
    if (enemy.combatId !== combatId) {
      return res.status(400).json({ error: "Ennemi n'appartient pas à ce combat" });
    }
    
    // Lancer 1D100
    const initiativeRoll = Math.floor(Math.random() * 100) + 1;
    const reflexesScore = enemy.reflexes || 50;
    const passed = initiativeRoll <= reflexesScore;
    
    console.log(`[API] Initiative: D100=${initiativeRoll}, Réflexes=${reflexesScore}, Réussi=${passed}`);
    
    // Mettre à jour l'ennemi
    const updated = await prisma.enemy.update({
      where: { id: enemyId },
      data: {
        initiativeRoll,
        passed
      }
    });
    
    // Récupérer le combat pour obtenir gameId
    const combat = await prisma.combat.findUnique({ where: { id: combatId } });
    
    // Émettre l'événement WebSocket
    emitToAll('initiativeRolled', {
      gameId: combat.gameId,
      combatId,
      enemyId,
      enemyName: enemy.name,
      roll: initiativeRoll,
      reflexes: reflexesScore,
      passed
    });
    
    res.json(updated);
  } catch (error) {
    console.error("[API] ❌ Erreur lors du lancer d'initiative ennemi:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Calculer et organiser l'ordre d'initiative du combat
app.post("/api/combats/:combatId/calculate-initiative", async (req, res) => {
  try {
    const { combatId } = req.params;
    
    console.log(`[API] POST Calculer l'initiative pour le combat ${combatId}`);
    
    // Récupérer le combat avec tous les combattants et ennemis
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      include: {
        combatants: { include: { character: true } },
        enemies: true
      }
    });
    
    if (!combat) {
      return res.status(404).json({ error: "Combat non trouvé" });
    }
    
    // Créer un tableau avec tous les participants
    const participants = [];
    
    // Ajouter les personnages
    combat.combatants.forEach(c => {
      participants.push({
        type: 'character',
        id: c.id,
        name: c.character.name,
        roll: c.initiativeRoll || 0,
        passed: c.passed || true
      });
    });
    
    // Ajouter les ennemis
    combat.enemies.forEach(e => {
      participants.push({
        type: 'enemy',
        id: e.id,
        name: e.name,
        roll: e.initiativeRoll || 0,
        passed: e.passed || true
      });
    });
    
    // Trier selon les règles:
    // 1. Les réussis d'abord (par roll croissant)
    // 2. Les ratés à la fin (par roll croissant)
    participants.sort((a, b) => {
      if (a.passed && b.passed) return a.roll - b.roll;  // Réussis: ordre croissant
      if (!a.passed && !b.passed) return a.roll - b.roll; // Ratés: ordre croissant
      return a.passed ? -1 : 1;  // Réussis avant ratés
    });
    
    // Attribuer les ordres (à partir de 1)
    const updates = [];
    participants.forEach((p, index) => {
      if (p.type === 'character') {
        updates.push(
          prisma.combatCombatant.update({
            where: { id: p.id },
            data: { order: index + 1 }
          })
        );
      } else {
        updates.push(
          prisma.enemy.update({
            where: { id: p.id },
            data: { order: index + 1 }
          })
        );
      }
    });
    
    await Promise.all(updates);
    
    console.log(`[API] ✅ Initiative calculée. Ordre:`, participants.map((p, i) => `${i + 1}. ${p.name}`));
    
    res.json({ success: true, order: participants });
  } catch (error) {
    console.error("[API] ❌ Erreur lors du calcul d'initiative:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// ============ SYSTÈME D'ACTIONS ============

// Effectuer une attaque
app.post("/api/combats/:combatId/attack", async (req, res) => {
  try {
    const { combatId } = req.params;
    const { actorId, targetId, actorType, targetType, weaponIndex = 0 } = req.body;
    
    console.log(`[API] POST Attaque - Attaquant: ${actorId} (${actorType}), Cible: ${targetId} (${targetType})`);
    
    // Récupérer le combat
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      include: {
        combatants: { include: { character: true } },
        enemies: true
      }
    });
    
    if (!combat) return res.status(404).json({ error: "Combat non trouvé" });
    
    // Récupérer l'attaquant et ses stats de combat
    let attacker, attackerCombatSkill = 50;
    if (actorType === 'character') {
      const combatant = combat.combatants.find(c => c.id === actorId);
      if (!combatant) return res.status(404).json({ error: "Attaquant non trouvé" });
      attacker = combatant;
      attackerCombatSkill = combatant.character.closeCombat || 50;
    } else {
      attacker = combat.enemies.find(e => e.id === actorId);
      if (!attacker) return res.status(404).json({ error: "Ennemi attaquant non trouvé" });
      attackerCombatSkill = attacker.reflexes || 50;
    }
    
    // Récupérer la cible et ses stats de combat
    let target, targetCombatSkill = 50, targetArmor = 0, targetWeaponDamage = "1d6";
    if (targetType === 'character') {
      const combatant = combat.combatants.find(c => c.id === targetId);
      if (!combatant) return res.status(404).json({ error: "Cible non trouvée" });
      target = combatant;
      targetCombatSkill = combatant.character.closeCombat || 50;
      targetArmor = combatant.character.protection || 0;
      // Utiliser l'arme 1 par défaut
      targetWeaponDamage = combatant.character.damage1 || "1d6";
    } else {
      target = combat.enemies.find(e => e.id === targetId);
      if (!target) return res.status(404).json({ error: "Ennemi cible non trouvé" });
      targetCombatSkill = target.reflexes || 50;
      targetArmor = target.armor || 0;
      targetWeaponDamage = target.weaponDamage || "1d6";
    }
    
    // Lance d'attaque (D100)
    const attackRoll = Math.floor(Math.random() * 100) + 1;
    const attackSuccess = attackRoll <= attackerCombatSkill;
    
    // Déterminer si critique ou fumble
    const isCritical = attackRoll <= 5;
    const isFumble = attackRoll >= 96;
    
    let damage = 0;
    let defenseRoll = 0;
    let defenseSuccess = false;
    
    if (attackSuccess || isCritical) {
      // L'attaque touche - la cible peut se défendre
      defenseRoll = Math.floor(Math.random() * 100) + 1;
      defenseSuccess = defenseRoll <= targetCombatSkill;
      
      if (!defenseSuccess) {
        // La défense échoue - calculer les dégâts
        damage = rollDice(targetWeaponDamage);
        
        // Si critique, doubler les dégâts (et ignorer l'armure pour le second d20)
        if (isCritical) {
          damage = damage * 2;
        }
        
        // Soustraire l'armure
        damage = Math.max(0, damage - targetArmor);
      }
    }
    
    // Créer l'action dans la base de données
    const action = await prisma.combatAction.create({
      data: {
        combatId,
        round: combat.currentRound,
        actionType: 'attack',
        actionResult: attackSuccess || isCritical ? (defenseSuccess ? 'defended' : 'hit') : 'miss',
        attackRoll,
        defenseRoll: defenseSuccess ? defenseRoll : null,
        damage: damage > 0 ? damage : null,
        isCritical,
        isFumble,
        description: `${attacker.id === actorId ? (actorType === 'character' ? attacker.character?.name : attacker.name) : 'Acteur inconnu'} attaque ${target.id === targetId ? (targetType === 'character' ? target.character?.name : target.name) : 'Cible inconnue'}`,
        actorId: `${actorType}-${actorId}`,
        targetId: `${targetType}-${targetId}`
      }
    });
    
    // Mettre à jour la santé de la cible si elle a reçu des dégâts
    if (damage > 0 && targetType === 'character') {
      await prisma.combatCombatant.update({
        where: { id: targetId },
        data: { currentHealth: (target.currentHealth || 0) - damage }
      });
    } else if (damage > 0 && targetType === 'enemy') {
      await prisma.enemy.update({
        where: { id: targetId },
        data: { currentLife: (target.currentLife || 0) - damage }
      });
    }
    
    console.log(`[API] ✅ Attaque résolue: ${attackRoll} <= ${attackerCombatSkill} = ${attackSuccess}. Dégâts: ${damage}`);
    
    res.json({
      success: true,
      action: {
        attackRoll,
        attackSuccess,
        isCritical,
        isFumble,
        defenseRoll,
        defenseSuccess,
        damage
      }
    });
  } catch (error) {
    console.error("[API] ❌ Erreur lors de l'attaque:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Fonction utilitaire pour lancer les dés
function rollDice(diceNotation) {
  // Parse notation comme "1d6", "2d6+3", "1d4", etc.
  const match = diceNotation.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
  if (!match) return 0;
  
  const numDice = parseInt(match[1]);
  const diceSize = parseInt(match[2]);
  const bonus = parseInt(match[3]) || 0;
  
  let total = bonus;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * diceSize) + 1;
  }
  return total;
}

// Passer au tour suivant
app.post("/api/combats/:combatId/next-turn", async (req, res) => {
  try {
    const { combatId } = req.params;
    
    console.log(`[API] POST Prochain tour pour le combat ${combatId}`);
    
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      include: {
        combatants: { include: { character: true } },
        enemies: true
      }
    });
    
    if (!combat) return res.status(404).json({ error: "Combat non trouvé" });
    
    // Récupérer le prochain participant qui n'a pas agi
    const allParticipants = [
      ...combat.combatants.map(c => ({ type: 'character', id: c.id, order: c.order, hasActed: c.hasActed, name: c.character.name })),
      ...combat.enemies.map(e => ({ type: 'enemy', id: e.id, order: e.order, hasActed: e.hasActed, name: e.name }))
    ];
    
    // Trier par ordre d'initiative
    allParticipants.sort((a, b) => a.order - b.order);
    
    // Trouver le premier qui n'a pas agi
    let nextTurn = allParticipants.find(p => !p.hasActed);
    
    // Si tous ont agi, réinitialiser et recommencer (nouveau round)
    if (!nextTurn) {
      combat.currentRound++;
      
      // Réinitialiser hasActed pour tous
      const resetUpdates = [];
      combat.combatants.forEach(c => {
        resetUpdates.push(prisma.combatCombatant.update({
          where: { id: c.id },
          data: { hasActed: false }
        }));
      });
      combat.enemies.forEach(e => {
        resetUpdates.push(prisma.enemy.update({
          where: { id: e.id },
          data: { hasActed: false }
        }));
      });
      
      await Promise.all(resetUpdates);
      nextTurn = allParticipants[0];
    }
    
    // Marquer le participant actuel comme ayant agi
    if (nextTurn.type === 'character') {
      await prisma.combatCombatant.update({
        where: { id: nextTurn.id },
        data: { hasActed: true }
      });
    } else {
      await prisma.enemy.update({
        where: { id: nextTurn.id },
        data: { hasActed: true }
      });
    }
    
    console.log(`[API] ✅ Prochain tour: ${nextTurn.name} (${nextTurn.type})`);
    
    res.json({
      success: true,
      currentRound: combat.currentRound,
      nextTurn
    });
  } catch (error) {
    console.error("[API] ❌ Erreur lors du prochain tour:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Récupérer le combat actif d'une partie
app.get("/api/games/:id/combat", async (req, res) => {
  try {
    const { id } = req.params;
    
    const combat = await prisma.combat.findFirst({
      where: { 
        gameId: id,
        isActive: true
      },
      include: {
        combatants: {
          include: {
            character: {
              select: { 
                id: true, 
                name: true, 
                playerName: true, 
                lifePoints: true, 
                currentLifePoints: true,
                weapon1: true,
                damage1: true,
                weapon2: true,
                damage2: true,
                weapon3: true,
                damage3: true
              }
            }
          }
        },
        enemies: true
      }
    });
    
    if (!combat) {
      return res.status(404).json({ error: "Aucun combat actif" });
    }
    
    res.json(combat);
  } catch (error) {
    console.error("Erreur lors de la récupération du combat:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Terminer un combat
app.delete("/api/combats/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut terminer les combats" });
    }
    
    const combat = await prisma.combat.findUnique({
      where: { id },
      select: { gameId: true }
    });
    
    if (!combat) {
      return res.status(404).json({ error: "Combat non trouvé" });
    }
    
    // Marquer le combat comme inactif au lieu de le supprimer (pour historique)
    const updatedCombat = await prisma.combat.update({
      where: { id },
      data: { isActive: false }
    });
    
    emitToAll('combatEnded', { gameId: combat.gameId, combatId: id });
    
    res.json({ message: "Combat terminé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du combat:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Déplacer un personnage ou un ennemi dans le combat
app.put("/api/combats/:combatId/move", async (req, res) => {
  try {
    const { combatId } = req.params;
    const { characterId, enemyId, xPos, yPos } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut déplacer les combattants" });
    }
    
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      select: { gameId: true }
    });
    
    if (!combat) {
      return res.status(404).json({ error: "Combat non trouvé" });
    }
    
    let updatedData = {};
    
    if (characterId) {
      // Mettre à jour la position du combattant
      updatedData = await prisma.combatCombatant.update({
        where: {
          combatId_characterId: {
            combatId: combatId,
            characterId: characterId
          }
        },
        data: { xPos, yPos },
        include: {
          character: {
            select: { id: true, name: true, playerName: true }
          }
        }
      });
    } else if (enemyId) {
      // Mettre à jour la position de l'ennemi
      updatedData = await prisma.enemy.update({
        where: { id: enemyId },
        data: { xPos, yPos }
      });
    }
    
    // Émettre l'événement WebSocket
    emitToAll('combatantMoved', { gameId: combat.gameId, combatId, data: updatedData });
    
    res.json(updatedData);
  } catch (error) {
    console.error("Erreur lors du déplacement:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Retirer un personnage du combat
app.delete("/api/combats/:combatId/combatants/:characterId", async (req, res) => {
  try {
    const { combatId, characterId } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut retirer les combattants" });
    }
    
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      select: { gameId: true }
    });
    
    if (!combat) {
      return res.status(404).json({ error: "Combat non trouvé" });
    }
    
    await prisma.combatCombatant.deleteMany({
      where: {
        combatId: combatId,
        characterId: characterId
      }
    });
    
    emitToAll('combatantRemoved', { gameId: combat.gameId, combatId, characterId });
    
    res.json({ message: "Combattant retiré du combat" });
  } catch (error) {
    console.error("Erreur lors de la suppression du combattant:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ========== ROUTES POUR LES ENNEMIS ==========

// Ajouter un ennemi au combat
app.post("/api/combats/:combatId/enemies", async (req, res) => {
  try {
    const { combatId } = req.params;
    const { name, maxLife, weaponDamage, xPos = 0, yPos = 0 } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut ajouter des ennemis" });
    }
    
    const combat = await prisma.combat.findUnique({
      where: { id: combatId },
      select: { gameId: true }
    });
    
    if (!combat) {
      return res.status(404).json({ error: "Combat non trouvé" });
    }
    
    const enemy = await prisma.enemy.create({
      data: {
        combatId,
        name,
        currentLife: maxLife,
        maxLife,
        weaponDamage: weaponDamage || "1d6",
        xPos,
        yPos,
        order: 0
      }
    });
    
    emitToAll('enemyAdded', { gameId: combat.gameId, combatId, enemy });
    
    res.json(enemy);
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'ennemi:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Mettre à jour un ennemi (vie, dégâts)
app.put("/api/enemies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentLife, weaponDamage } = req.body;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut modifier les ennemis" });
    }
    
    const enemy = await prisma.enemy.findUnique({
      where: { id },
      include: { combat: { select: { gameId: true } } }
    });
    
    if (!enemy) {
      return res.status(404).json({ error: "Ennemi non trouvé" });
    }
    
    const updateData = {};
    if (currentLife !== undefined) updateData.currentLife = currentLife;
    if (weaponDamage !== undefined) updateData.weaponDamage = weaponDamage;
    
    const updatedEnemy = await prisma.enemy.update({
      where: { id },
      data: updateData
    });
    
    emitToAll('enemyUpdated', { gameId: enemy.combat.gameId, enemy: updatedEnemy });
    
    res.json(updatedEnemy);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'ennemi:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Retirer un ennemi du combat
app.delete("/api/enemies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }
    
    // Vérifier que l'utilisateur est MJ
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'mj') {
      return res.status(403).json({ error: "Seul le Maître de Jeu peut retirer des ennemis" });
    }
    
    const enemy = await prisma.enemy.findUnique({
      where: { id },
      include: { combat: { select: { gameId: true } } }
    });
    
    if (!enemy) {
      return res.status(404).json({ error: "Ennemi non trouvé" });
    }
    
    await prisma.enemy.delete({
      where: { id }
    });
    
    emitToAll('enemyRemoved', { gameId: enemy.combat.gameId, enemyId: id });
    
    res.json({ message: "Ennemi retiré du combat" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'ennemi:", error);
    res.status(500).json({ error: "Erreur serveur" });
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

// ========== FALLBACK HANDLER POUR SPA ==========
// Doit être APRÈS toutes les routes API pour que les requêtes API passent correctement
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

  // Relayer les notifications de combat
  socket.on("combatStartedNotification", (data) => {
    console.log(`[Server] ⚔️ Notification de combat pour la partie ${data.gameId}`);
    // Émettre à tous les clients
    io.emit("combatStartedNotification", data);
  });

  // Relayer les demandes d'initiative
  socket.on("requestInitiative", (data) => {
    console.log(`[Server] 🎲 Demande d'initiative pour ${data.characterName}`);
    io.emit("requestInitiative", data);
  });

  socket.on("disconnect", () => console.log("[Server] Un joueur est parti"));
});

console.log(`[Server] Socket.IO server running on port ${PORT}`);
