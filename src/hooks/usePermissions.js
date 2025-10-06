import { useAuth } from '../context/AuthContext';

/**
 * Hook pour gérer les permissions des utilisateurs
 */
export function usePermissions() {
  const { user } = useAuth();

  // Vérifier si l'utilisateur est MJ
  const isMJ = () => {
    return user?.role === 'mj';
  };

  // Vérifier si l'utilisateur peut modifier un personnage
  const canEditCharacter = (character) => {
    if (!user || !character) return false;
    
    // MJ peut modifier tous les personnages
    if (isMJ()) return true;
    
    // Le propriétaire peut modifier son personnage
    return character.userId === user.id;
  };

  // Vérifier si l'utilisateur peut voir un personnage
  const canViewCharacter = (character) => {
    if (!user || !character) return false;
    
    // MJ peut voir tous les personnages
    if (isMJ()) return true;
    
    // Le propriétaire peut voir son personnage
    return character.userId === user.id;
  };

  // Vérifier si l'utilisateur peut créer des personnages
  const canCreateCharacter = () => {
    return !!user; // Tout utilisateur connecté peut créer des personnages
  };

  // Vérifier si l'utilisateur peut supprimer un personnage
  const canDeleteCharacter = (character) => {
    if (!user || !character) return false;
    
    // MJ peut supprimer tous les personnages
    if (isMJ()) return true;
    
    // Le propriétaire peut supprimer son personnage
    return character.userId === user.id;
  };

  // Vérifier si l'utilisateur peut gérer les parties
  const canManageGames = () => {
    return !!user; // Tout utilisateur connecté peut gérer les parties
  };

  // Vérifier si l'utilisateur peut supprimer une partie
  const canDeleteGame = (game) => {
    if (!user) return false;
    
    // Seul le MJ peut supprimer les parties
    return isMJ();
  };

  // Obtenir le rôle de l'utilisateur
  const getUserRole = () => {
    return user?.role || 'player';
  };

  // Obtenir le nom d'affichage du rôle
  const getRoleDisplayName = () => {
    const role = getUserRole();
    return role === 'mj' ? 'Maître de Jeu' : 'Joueur';
  };

  return {
    isMJ,
    canEditCharacter,
    canViewCharacter,
    canCreateCharacter,
    canDeleteCharacter,
    canManageGames,
    canDeleteGame,
    getUserRole,
    getRoleDisplayName
  };
}
