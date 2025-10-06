// Service pour scanner automatiquement les cartes du monde depuis le dossier public/cartes/

export class CardScanner {
  constructor() {
    this.availableCards = [];
    this.scanInterval = null;
  }

  // Scanner le dossier cartes pour détecter les fichiers PDF
  async scanCards() {
    try {
      const response = await fetch('/api/cards/available');
      if (response.ok) {
        const cards = await response.json();
        this.availableCards = cards;
        return this.availableCards;
      } else {
        console.error('Erreur lors du scan des cartes:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du scan des cartes:', error);
      return [];
    }
  }

  // Obtenir les cartes disponibles
  getAvailableCards() {
    return this.availableCards;
  }

  // Démarrer le scan automatique (optionnel)
  startAutoScan(intervalMs = 30000) {
    this.scanInterval = setInterval(() => {
      this.scanCards();
    }, intervalMs);
  }

  // Arrêter le scan automatique
  stopAutoScan() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  // Générer un nom de carte à partir du nom de fichier
  generateCardName(filename) {
    // Convertir "carte-aria.pdf" en "Carte d'Aria"
    const nameWithoutExt = filename.replace(/\.(pdf|PDF)$/, '');
    const words = nameWithoutExt.split('-');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    return capitalizedWords.join(' ');
  }

  // Générer une description basée sur le type de carte
  generateCardDescription(filename, type) {
    const baseDescriptions = {
      "Carte du monde": "Une carte géographique détaillée montrant les lieux d'intérêt et les routes principales.",
      "Lieu": "Une carte d'un lieu spécifique avec ses détails et particularités.",
      "Région": "Une carte d'une région particulière avec ses caractéristiques géographiques.",
      "Ville": "Un plan détaillé d'une ville avec ses quartiers et bâtiments importants.",
      "Dungeon": "Une carte de donjon avec ses salles, passages et pièges."
    };
    
    return baseDescriptions[type] || "Une carte géographique pour votre aventure.";
  }
}

export const cardScanner = new CardScanner();
