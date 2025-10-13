#!/usr/bin/env node

import { spawn } from 'child_process';
import os from 'os';

console.log('🎲 Aria JDR - Démarrage en mode Hamachi');
console.log('==========================================');

// Fonction pour obtenir l'IP Hamachi
function getHamachiIP() {
  const interfaces = os.networkInterfaces();
  
  // Chercher une interface qui pourrait être Hamachi
  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses) {
      // Hamachi utilise généralement des IPs dans la plage 25.x.x.x ou 5.x.x.x
      if (address.family === 'IPv4' && 
          (address.address.startsWith('25.') || 
           address.address.startsWith('5.') ||
           name.toLowerCase().includes('hamachi'))) {
        return address.address;
      }
    }
  }
  
  return null;
}

// Fonction pour afficher les instructions
function displayInstructions(hamachiIP) {
  console.log('');
  console.log('📋 Instructions pour vos amis:');
  console.log('==============================');
  
  if (hamachiIP) {
    console.log(`✅ IP Hamachi détectée: ${hamachiIP}`);
    console.log('');
    console.log('🌐 Vos amis doivent se connecter à:');
    console.log(`   http://${hamachiIP}:4000`);
  } else {
    console.log('⚠️  IP Hamachi non détectée automatiquement');
    console.log('');
    console.log('🔍 Pour trouver votre IP Hamachi:');
    console.log('1. Ouvrez Hamachi');
    console.log('2. Regardez votre IP dans l\'interface (ex: 25.0.0.1)');
    console.log('3. Remplacez [VOTRE_IP] dans l\'URL ci-dessous');
    console.log('');
    console.log('🌐 Vos amis doivent se connecter à:');
    console.log('   http://[VOTRE_IP]:4000');
  }
  
  console.log('');
  console.log('🚀 Build et démarrage du serveur...');
  console.log('');
}

// Fonction pour lancer le build et le serveur
function startServer() {
  const hamachiIP = getHamachiIP();
  displayInstructions(hamachiIP);
  
  // Lancer le build
  console.log('📦 Build de l\'application...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build terminé avec succès');
      console.log('🚀 Démarrage du serveur...');
      
      // Lancer le serveur
      const serverProcess = spawn('node', ['src/server.js'], {
        stdio: 'inherit',
        shell: true
      });
      
      // Gérer l'arrêt du processus
      process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt du serveur...');
        serverProcess.kill();
        process.exit(0);
      });
    } else {
      console.error('❌ Erreur lors du build');
      process.exit(1);
    }
  });
}

// Vérifier que nous sommes dans le bon répertoire
import { existsSync } from 'fs';
if (!existsSync('package.json')) {
  console.error('❌ Erreur: Ce script doit être exécuté depuis la racine du projet');
  process.exit(1);
}

startServer();

