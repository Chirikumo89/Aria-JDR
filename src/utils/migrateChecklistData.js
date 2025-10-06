// Utilitaire pour migrer les données de checklist existantes
export function migrateChecklistData(data) {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (typeof data === 'string' && data.trim()) {
    try {
      // Essayer de parser comme JSON
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Si ce n'est pas du JSON valide, créer un array avec la chaîne
      return [{ 
        id: Date.now() + Math.random(), 
        text: data, 
        checked: false 
      }];
    }
  }
  
  return [];
}

// Fonction pour migrer un personnage complet
export function migrateCharacterData(character) {
  if (!character) return character;
  
  return {
    ...character,
    possessions: migrateChecklistData(character.possessions),
    notes: migrateChecklistData(character.notes)
  };
}
