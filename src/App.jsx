import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Games from "./pages/Games";
import CharacterSheetPage from "./pages/CharacterSheetPage";
import MJDashboard from "./pages/MJDashboard";
import DiceBox3D from "./components/Dice/DiceBox3D";
import DiceSelector3D from "./components/Dice/DiceSelector3D";
import DiceBoxTest from "./components/Dice/DiceBoxTest";
import Notification from "./components/Notification";
import NotificationSystem from "./components/NotificationSystem";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { DiceModalProvider } from "./context/DiceModalContext";
import { NotificationProvider, useNotification } from "./context/NotificationContext";
import { GameProvider } from "./context/GameContext";
import { AuthProvider } from "./context/AuthContext";

function AppContent() {
  const socket = useSocket();
  const { notifications, hideNotification } = useNotification();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/character/:characterId" element={<CharacterSheetPage />} />
        <Route path="/mj/:gameId" element={<MJDashboard />} />
      </Routes>

      {/* Système 3D DiceBox obligatoire */}
      <DiceBox3D />
      
      {/* Modale de sélection 3D */}
      <DiceSelector3D />
      
      {/* Test DiceBox - TEMPORAIRE - MASQUÉ */}
      {/* <DiceBoxTest /> */}
      
              {/* Notification globale pour les dés et la caisse commune */}
              <Notification notifications={notifications.filter(n => (n.type === 'dice' && n.notation) || n.type === 'treasury')} onClose={hideNotification} />
              
              {/* Système de notifications moderne - DÉSACTIVÉ pour éviter les doublons */}
              {/* <NotificationSystem /> */}
            </>
          );
        }

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <SocketProvider>
          <DiceModalProvider>
            <NotificationProvider>
              <Router>
                <AppContent />
              </Router>
            </NotificationProvider>
          </DiceModalProvider>
        </SocketProvider>
      </GameProvider>
    </AuthProvider>
  );
}
