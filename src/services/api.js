// Configuration de l'URL de base de l'API selon l'environnement
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Dans le navigateur
    const hostname = window.location.hostname;
    const port = window.location.port || '30072';
    
    if (hostname === 'localhost') {
      return `http://localhost:30072/api`;
    } else {
      return `http://${hostname}:30072/api`;
    }
  }
  // Fallback pour le serveur
  return 'http://localhost:30072/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.userId = null;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.userId) {
      headers['user-id'] = this.userId;
    }
    return headers;
  }
  // Authentification
  async loginOrCreateUser(username) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la connexion');
    }
    return response.json();
  }

  async getCurrentUser(userId) {
    const response = await fetch(`${API_BASE_URL}/auth/me?userId=${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'utilisateur');
    }
    return response.json();
  }

  async updateUserRole(userId, role) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du rôle');
    }
    return response.json();
  }

  // Parties
  async getGames() {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des parties');
    return response.json();
  }

  async createGame(gameData) {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    if (!response.ok) throw new Error('Erreur lors de la création de la partie');
    return response.json();
  }

  async deleteGame(gameId, userId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de la partie');
    }
    return response.json();
  }

  // Personnages
  async getCharacters(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/characters`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des personnages');
    return response.json();
  }

  async createCharacter(gameId, characterData) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/characters`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(characterData)
    });
    if (!response.ok) throw new Error('Erreur lors de la création du personnage');
    return response.json();
  }

  async getCharacter(characterId) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération du personnage');
    return response.json();
  }

  async updateCharacter(characterId, characterData) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(characterData)
    });
    if (!response.ok) throw new Error('Erreur lors de la mise à jour du personnage');
    return response.json();
  }

  async deleteCharacter(characterId) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression du personnage');
    }
    return response.json();
  }

  // Lancers de dés
  async getDiceRolls(gameId, limit = 50) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/dice-rolls?limit=${limit}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des lancers de dés');
    return response.json();
  }

  // Récupérer TOUS les jets de dés récents (toutes parties confondues)
  async getRecentDiceRolls(limit = 20) {
    const response = await fetch(`${API_BASE_URL}/dice-rolls/recent?limit=${limit}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des lancers de dés récents');
    return response.json();
  }

  // Récupérer les statistiques des jets de dés
  async getDiceStats() {
    const response = await fetch(`${API_BASE_URL}/dice-rolls/stats`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques');
    return response.json();
  }

  // Sessions de jeu
  async getGameSessions(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/sessions`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des sessions');
    return response.json();
  }

  async getSessionDiceRolls(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/dice-rolls`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des jets de dés de la session');
    return response.json();
  }

  // Cartes
  async getCards(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/cards`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des cartes');
    return response.json();
  }

  async createCard(gameId, cardData) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/cards`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(cardData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la carte');
    }
    return response.json();
  }

  async updateCard(cardId, cardData) {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(cardData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de la carte');
    }
    return response.json();
  }

  async deleteCard(cardId) {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de la carte');
    }
    return response.json();
  }

  async assignCardToCharacter(cardId, characterId, notes = '') {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ characterId, notes })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'attribution de la carte');
    }
    return response.json();
  }

  async removeCardFromCharacter(cardId, characterId) {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}/remove`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ characterId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de la carte du personnage');
    }
    return response.json();
  }

  // Transactions
  async getCharacterTransactions(characterId) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}/transactions`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des transactions');
    }
    return response.json();
  }

  async createTransaction(characterId, transactionData) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}/transactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(transactionData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la transaction');
    }
    return response.json();
  }

  // Caisse commune
  async getCommonTreasury(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/common-treasury`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de la caisse commune');
    }
    return response.json();
  }

  async updateCommonTreasury(gameId, treasuryData) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/common-treasury`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(treasuryData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de la caisse commune');
    }
    return response.json();
  }

  // Transactions de la caisse commune
  async getCommonTreasuryTransactions(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/common-treasury/transactions`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des transactions de la caisse commune');
    }
    return response.json();
  }

  async createCommonTreasuryTransaction(gameId, transactionData) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/common-treasury/transactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(transactionData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la transaction de la caisse commune');
    }
    return response.json();
  }

  // Heure en jeu
  async getGameTime(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/game-time`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'heure en jeu');
    }
    return response.json();
  }

  async updateGameTime(gameId, timeData) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/game-time`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(timeData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de l\'heure en jeu');
    }
    return response.json();
  }

  // Véhicules (inventaire commun)
  async getVehicles(gameId) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/vehicles`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des véhicules');
    }
    return response.json();
  }

  async createVehicle(gameId, vehicleData) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/vehicles`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(vehicleData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du véhicule');
    }
    return response.json();
  }

  async updateVehicle(vehicleId, vehicleData) {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(vehicleData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du véhicule');
    }
    return response.json();
  }

  async deleteVehicle(vehicleId) {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression du véhicule');
    }
    return response.json();
  }

  // Demandes de cagettes
  async getCrateRequests(gameId, status = null) {
    const url = status 
      ? `${API_BASE_URL}/games/${gameId}/crate-requests?status=${status}`
      : `${API_BASE_URL}/games/${gameId}/crate-requests`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des demandes');
    }
    return response.json();
  }

  async createCrateRequest(vehicleId, data) {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/crate-requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la demande');
    }
    return response.json();
  }

  async updateCrateRequest(requestId, data) {
    const response = await fetch(`${API_BASE_URL}/crate-requests/${requestId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de la demande');
    }
    return response.json();
  }

  async deleteCrateRequest(requestId) {
    const response = await fetch(`${API_BASE_URL}/crate-requests/${requestId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de la demande');
    }
    return response.json();
  }

  // Demandes de véhicules
  async getVehicleRequests(gameId, status = null) {
    const url = status 
      ? `${API_BASE_URL}/games/${gameId}/vehicle-requests?status=${status}`
      : `${API_BASE_URL}/games/${gameId}/vehicle-requests`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des demandes de véhicules');
    }
    return response.json();
  }

  async createVehicleRequest(gameId, data) {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/vehicle-requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la demande de véhicule');
    }
    return response.json();
  }

  async updateVehicleRequest(requestId, data) {
    const response = await fetch(`${API_BASE_URL}/vehicle-requests/${requestId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de la demande de véhicule');
    }
    return response.json();
  }

  async deleteVehicleRequest(requestId) {
    const response = await fetch(`${API_BASE_URL}/vehicle-requests/${requestId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de la demande de véhicule');
    }
    return response.json();
  }

  // Transferts d'items
  async getPendingTransfers(characterId) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}/item-transfers/pending`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des transferts');
    }
    return response.json();
  }

  async getAllTransfers(characterId) {
    const response = await fetch(`${API_BASE_URL}/characters/${characterId}/item-transfers`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des transferts');
    }
    return response.json();
  }

  async createItemTransfer(data) {
    // data peut contenir: itemId, itemText, fromCharacterId, toCharacterId, gameId
    // Et pour les échanges: isExchange, requestedItemId, requestedItemText
    const response = await fetch(`${API_BASE_URL}/item-transfers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du transfert');
    }
    return response.json();
  }

  async respondToTransfer(transferId, status) {
    const response = await fetch(`${API_BASE_URL}/item-transfers/${transferId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la réponse au transfert');
    }
    return response.json();
  }

  async cancelTransfer(transferId) {
    const response = await fetch(`${API_BASE_URL}/item-transfers/${transferId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'annulation du transfert');
    }
    return response.json();
  }
}

export const apiService = new ApiService();
