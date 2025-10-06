import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setIsSubmitting(true);
      await login(username.trim());
      setUsername('');
      onClose();
    } catch (err) {
      console.error('Erreur de connexion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-lg w-96 border border-primary shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Connexion</h2>
          <p className="text-secondary">
            Entrez votre pseudo pour vous connecter ou créer un compte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-primary">
              Pseudo
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-3 border border-primary rounded bg-card text-primary placeholder-muted focus:border-focus focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Votre pseudo"
              autoFocus
              disabled={isSubmitting}
              maxLength={50}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
              disabled={isSubmitting}
            >
              Annuler
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            Si le pseudo n'existe pas, un nouveau compte sera créé automatiquement
          </p>
        </div>
      </div>
    </div>
  );
}
