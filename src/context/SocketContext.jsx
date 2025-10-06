import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log("[SocketContext] Initialisation de la connexion socket...");
    const s = io("http://localhost:4000");
    
    s.on("connect", () => {
      console.log("[SocketContext] Socket connecté !");
    });
    
    s.on("disconnect", () => {
      console.log("[SocketContext] Socket déconnecté !");
    });
    
    s.on("connect_error", (error) => {
      console.error("[SocketContext] Erreur de connexion :", error);
    });
    
    setSocket(s);
    return () => {
      console.log("[SocketContext] Nettoyage de la connexion socket");
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
