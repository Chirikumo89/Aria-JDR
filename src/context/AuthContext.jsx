import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('aria-jdr-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Définir l'ID utilisateur dans le service API
          apiService.setUserId(userData.id);
          setUser(userData);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        localStorage.removeItem('aria-jdr-user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Connexion avec pseudo
  const login = async (username) => {
    try {
      setLoading(true);
      setError(null);
      
      // Nettoyer le pseudo
      const cleanUsername = username.trim();
      if (!cleanUsername) {
        throw new Error('Le pseudo ne peut pas être vide');
      }

      // Vérifier si l'utilisateur existe ou le créer
      const userData = await apiService.loginOrCreateUser(cleanUsername);
      
      // Définir l'ID utilisateur dans le service API
      apiService.setUserId(userData.id);
      
      // Sauvegarder en local
      localStorage.setItem('aria-jdr-user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('aria-jdr-user');
    setUser(null);
    setError(null);
  };

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
