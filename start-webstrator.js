#!/usr/bin/env node

// Script de démarrage pour Webstrator
// Ce script configure l'environnement pour le déploiement sur Webstrator

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration pour Webstrator
process.env.NODE_ENV = 'production';
process.env.PORT = '30072';

console.log('🚀 Démarrage de l\'application Aria JDR sur Webstrator...');
console.log(`📡 Port: ${process.env.PORT}`);
console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
console.log('');

// Démarrer le serveur
const serverPath = path.join(__dirname, 'src', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🛑 Serveur arrêté avec le code: ${code}`);
  process.exit(code);
});

// Gestion des signaux pour un arrêt propre
process.on('SIGTERM', () => {
  console.log('📡 Signal SIGTERM reçu, arrêt du serveur...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 Signal SIGINT reçu, arrêt du serveur...');
  server.kill('SIGINT');
});