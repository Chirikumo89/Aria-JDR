import { Link } from "react-router-dom";
import { useState } from "react";
import { useDiceModal } from "../context/DiceModalContext";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { Button } from "./UI/Button";
import ThemeToggle from "./ThemeToggle";
import LoginModal from "./LoginModal";
import UserInfo from "./UserInfo";
import RoleManager from "./RoleManager";
import GameTimeDisplay from "./GameTimeDisplay";

export default function Navbar() {
  const { show } = useDiceModal();
  const { user, isAuthenticated } = useAuth();
  const { currentGame } = useGame();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGameTimeModal, setShowGameTimeModal] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg animate-fadeIn">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Aria JDR
          </span>
        </Link>

        {/* Heure en jeu (visible si une partie est sélectionnée) */}
        {currentGame && (
          <div 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors"
            onClick={() => setShowGameTimeModal(true)}
            title="Cliquez pour modifier l'heure en jeu"
          >
            <GameTimeDisplay gameId={currentGame.id} compact={true} />
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex gap-3 items-center">
          <Link
            to="/games"
            className="group relative px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white font-medium transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Parties
            </span>
          </Link>

          <Link
            to="/dice-history"
            className="group relative px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white font-medium transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historique
            </span>
          </Link>

          <Button
            onClick={show}
            className="group relative px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium shadow-lg hover:shadow-green-500/50 transition-all duration-300"
          >
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              Lancer le dé
            </span>
          </Button>

          <ThemeToggle />

          {isAuthenticated() ? (
            <div className="flex items-center gap-3 ml-2">
              <RoleManager />
              <UserInfo />
            </div>
          ) : (
            <Button
              onClick={() => setShowLoginModal(true)}
              className="group relative px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              <span className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Se connecter
              </span>
            </Button>
          )}
        </div>
      </nav>

      {/* Spacer pour compenser la navbar fixe */}
      <div className="h-20"></div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Modal Heure en jeu */}
      {showGameTimeModal && currentGame && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowGameTimeModal(false)}
        >
          <div 
            className="w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">
                {currentGame.name}
              </h2>
              <button
                onClick={() => setShowGameTimeModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <GameTimeDisplay gameId={currentGame.id} />
          </div>
        </div>
      )}
    </>
  );
}
