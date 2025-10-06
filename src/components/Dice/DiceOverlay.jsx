import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import D6 from "./D6";
import D100 from "./D100";

export default function DiceOverlay({ socket }) {
  const [rolling, setRolling] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [actualResult, setActualResult] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!socket) return;

    socket.on("dice:rolled", (data) => {
      console.log("[Overlay] dice:rolled reçu:", data);
      setResultData(data);
      setRolling(true);
      setVisible(true);

      // durée animation
      const t = setTimeout(() => setRolling(false), 2500);
      return () => clearTimeout(t);
    });

    return () => socket.off("dice:rolled");
  }, [socket]);

  useEffect(() => {
    if (resultData && !rolling) {
      // UTILISER LE RÉSULTAT DU SERVEUR - PAS DE GÉNÉRATION ALÉATOIRE LOCALE
      // Le serveur a déjà généré un résultat unique pour tous les clients
      console.log("[DiceOverlay] Utilisation du résultat du serveur:", resultData.result);
      const serverResult = resultData.result;
      
      setActualResult(serverResult);
      
      // Fermer la modale d'animation rapidement
      const t1 = setTimeout(() => {
        setVisible(false);
      }, 3000); // 3 secondes après stabilisation
      
      return () => clearTimeout(t1);
    }
  }, [resultData, rolling]);

  // Notification séparée pour éviter les boucles - DÉSACTIVÉE pour éviter les doublons
  // useEffect(() => {
  //   if (resultData && !rolling && actualResult !== null) {
  //     // Afficher la notification avec le résultat synchronisé du serveur
  //     console.log("[DiceOverlay] Envoi de la notification avec le résultat du serveur:", actualResult);
  //     const notificationData = {
  //       ...resultData,
  //       result: actualResult  // Ce résultat vient maintenant du serveur, pas d'un random local
  //     };
  //     showNotification(notificationData);
  //   }
  // }, [resultData, rolling, actualResult, showNotification]);

  if (!visible || !resultData || !resultData.type) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 pointer-events-none">
        <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 flex items-center justify-center border border-gray-600 ${rolling ? 'animate-glow' : ''}`}>
          <div className="flex flex-col items-center gap-6">
            {/* Indicateur de roulement */}
            {rolling && (
              <div className="text-white text-lg font-semibold animate-pulse">
                🎲 {resultData.player} lance le dé...
              </div>
            )}
            
            {/* Canvas 3D pour les dés */}
            <div className="w-96 h-96 relative">
              <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <directionalLight 
                  position={[5, 8, 5]} 
                  intensity={1.2} 
                  castShadow
                  shadow-mapSize={2048}
                />
                <directionalLight 
                  position={[-5, 6, -5]} 
                  intensity={0.6} 
                  color="#4a90e2"
                />
                <pointLight 
                  position={[0, 6, 0]} 
                  intensity={1.0} 
                  color="#ffffff"
                  distance={15}
                />
                <spotLight
                  position={[0, 10, 0]}
                  angle={0.3}
                  penumbra={0.5}
                  intensity={0.8}
                  castShadow
                  color="#f0f8ff"
                />
                
                {/* Sol invisible pour les rebonds */}
                <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[20, 20]} />
                  <meshStandardMaterial 
                    color="#2c3e50" 
                    transparent 
                    opacity={0.1}
                    roughness={0.8}
                  />
                </mesh>
                
                {/* Dés 3D - Toujours utiliser le résultat du serveur */}
                {resultData.type === "d6" && (
                  <D6 result={actualResult || resultData.result || 1} rolling={rolling} />
                )}
                {resultData.type === "d100" && (
                  <D100 
                    tens={actualResult !== null ? Math.floor(actualResult / 10) : (resultData.tens || 0)} 
                    units={actualResult !== null ? (actualResult % 10) : (resultData.units || 0)} 
                    rolling={rolling} 
                  />
                )}
                
                <Environment preset="sunset" />
              </Canvas>
            </div>
            
            {/* Résultat affiché */}
            {!rolling && actualResult !== null && (
              <div className="text-white text-2xl font-bold bg-gray-800 px-6 py-3 rounded-lg">
                Résultat : {actualResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
