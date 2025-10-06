import { useAuth } from '../context/AuthContext';

export default function UserInfo() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm text-primary font-medium">
          {user.username}
        </div>
        <div className="text-xs text-muted">
          Connecté
        </div>
      </div>
      <button
        onClick={logout}
        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
        title="Se déconnecter"
      >
        Déconnexion
      </button>
    </div>
  );
}
