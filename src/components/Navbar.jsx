import { Link } from "react-router-dom";
import { useState } from "react";
import { useDiceModal } from "../context/DiceModalContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "./UI/Button";
import ThemeToggle from "./ThemeToggle";
import LoginModal from "./LoginModal";
import UserInfo from "./UserInfo";
import RoleManager from "./RoleManager";

export default function Navbar() {
  const { show } = useDiceModal();
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <nav className="w-full flex justify-between items-center p-4 bg-secondary border-b border-primary">
        <Link to="/" className="font-bold text-lg text-primary">Aria JDR</Link>
        <div className="flex gap-2 items-center">
          <Link to="/games" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200">
            Parties
          </Link>
          <Button onClick={show} className="bg-green-500 hover:bg-green-600 transition-colors duration-200">Lancer le dé</Button>
                  <ThemeToggle />
                  {isAuthenticated() ? (
                    <div className="flex items-center gap-4">
                      <RoleManager />
                      <UserInfo />
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowLoginModal(true)} 
                      className="bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200"
                    >
                      Se connecter
                    </Button>
                  )}
        </div>
      </nav>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}
