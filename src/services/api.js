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
}

export const apiService = new ApiService();
