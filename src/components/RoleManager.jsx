import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export default function RoleManager() {
  const { user, login } = useAuth();
  const [isChangingRole, setIsChangingRole] = useState(false);

  // Vérifier si l'utilisateur peut changer de rôle
  const canChangeRole = () => {
    if (!user) return false;
    
    // Seul l'utilisateur avec le pseudo "MJ" peut avoir le rôle MJ
    return user.username.toLowerCase() === 'mj';
  };

  const handleRoleChange = async () => {
    if (!user || !canChangeRole()) return;
    
    try {
      setIsChangingRole(true);
      const newRole = user.role === 'mj' ? 'player' : 'mj';
      
      // Mettre à jour le rôle via l'API
      const updatedUser = await apiService.updateUserRole(user.id, newRole);
      
      // Mettre à jour l'utilisateur dans le contexte
      await login(updatedUser.username);
      
      console.log(`Rôle changé vers: ${newRole}`);
      if (window.notificationSystem) {
        window.notificationSystem.success(`Rôle changé vers: ${newRole === 'mj' ? 'Maître de Jeu' : 'Joueur'}`);
      }
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      if (window.notificationSystem) {
        window.notificationSystem.error('Erreur lors du changement de rôle');
      }
    } finally {
      setIsChangingRole(false);
    }
  };

  if (!user) return null;

  // Si l'utilisateur ne peut pas changer de rôle, ne pas afficher le composant
  if (!canChangeRole()) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-primary">
        Rôle: <span className="font-semibold">{user.role === 'mj' ? 'Maître de Jeu' : 'Joueur'}</span>
      </span>
      <button
        onClick={handleRoleChange}
        disabled={isChangingRole}
        className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 transition-colors duration-200"
      >
        {isChangingRole ? 'Changement...' : `Devenir ${user.role === 'mj' ? 'Joueur' : 'MJ'}`}
      </button>
    </div>
  );
}
