import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useNotification } from "../../context/NotificationContext";

// Créer l'ID de session GLOBAL une seule fois pour cette fenêtre
if (!window.diceSessionId) {
  window.diceSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log("[GLOBAL] 🆔 ID de session window créé:", window.diceSessionId);
}

export default function DiceBox3D() {
  const diceBoxRef = useRef(null);
  const diceBoxInstance = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const currentPlayerRef = useRef(null); // Ref pour stocker le joueur actuel
  const currentNotationRef = useRef(null); // Ref pour stocker la notation du dé
  const currentTypeRef = useRef(null); // Ref pour stocker le type de dé
  
  // Variables globales temporaires pour les callbacks
  let tempPlayerData = null;
  let tempNotationData = null;
  let tempTypeData = null;
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [rollPlayer, setRollPlayer] = useState(null);
  const [receivedStream, setReceivedStream] = useState(null);
  const [isReceivingStream, setIsReceivingStream] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const socket = useSocket();
  const { showNotification } = useNotification();
  
  // Mettre à jour la ref du socket
  socketRef.current = socket;
  
  // Utiliser l'ID de session global de la fenêtre
  sessionIdRef.current = window.diceSessionId;
  console.log("[DiceBox3D] 🆔 ID de session utilisé:", window.diceSessionId);

  // Écouter les changements de taille de fenêtre pour Chrome
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fonction pour capturer et diffuser le canvas
  const startCanvasStream = () => {
    const canvas = document.querySelector("#dice-box-container canvas");
    if (!canvas) {
      console.error("[DiceBox3D] Canvas non trouvé pour le streaming");
      return;
    }

    console.log("[DiceBox3D] 📹 Démarrage du streaming du canvas");
    console.log("[DiceBox3D] 🆔 Streaming avec sessionId:", sessionIdRef.current);
    console.log("[DiceBox3D] 📐 Résolution native du canvas:", canvas.width, "x", canvas.height);
    console.log("[DiceBox3D] 📐 Viewport:", window.innerWidth, "x", window.innerHeight);
    
    // Capturer les frames du canvas à intervalle régulier
    streamIntervalRef.current = setInterval(() => {
      try {
        // Créer un canvas temporaire à résolution optimisée (1.5x pour équilibre qualité/performance)
        const tempCanvas = document.createElement('canvas');
        const scale = 1.5; // 1.5x la résolution (bon compromis)
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        
        const ctx = tempCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dessiner le canvas original upscalé
        ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Capturer en JPEG avec compression optimisée (qualité/taille)
        const imageData = tempCanvas.toDataURL('image/jpeg', 0.90);
        
        if (socketRef.current && socketRef.current.connected) {
          const playerName = currentPlayerRef.current || rollPlayer || "Joueur";
          socketRef.current.emit("canvas:frame", {
            frame: imageData,
            player: playerName,  // Utiliser la ref qui est toujours à jour
            sessionId: sessionIdRef.current,
            canvasWidth: tempCanvas.width,
            canvasHeight: tempCanvas.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            aspectRatio: canvas.width / canvas.height,
            scale: scale
          });
        }
      } catch (error) {
        console.error("[DiceBox3D] Erreur lors de la capture du frame:", error);
      }
    }, 20); // 50 FPS pour fluidité maximale
  };

  // Fonction pour arrêter le streaming du canvas
  const stopCanvasStream = () => {
    console.log("[DiceBox3D] 🛑 Arrêt du streaming du canvas");
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    // Informer les autres qu'on arrête le stream
    if (socketRef.current && socketRef.current.connected) {
      const playerName = currentPlayerRef.current || rollPlayer || "Joueur";
      socketRef.current.emit("canvas:stream-end", {
        player: playerName  // Utiliser la ref qui est toujours à jour
      });
    }
  };

  // Fonctions pour gérer l'affichage de l'overlay
  const showDiceBox = () => {
    console.log("[DiceBox3D] Affichage de l'overlay - remontée du conteneur DiceBox");
    // Remonter le conteneur DiceBox au premier plan
    const container = document.getElementById("dice-box-container");
    if (container) {
      container.style.zIndex = "40"; // Au-dessus de l'interface mais sous l'overlay
      
      // Forcer le redimensionnement du canvas quand l'overlay est affiché
      setTimeout(() => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
          console.log("[DiceBox3D] Redimensionnement du canvas lors de l'affichage...");
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.objectFit = 'cover';
          canvas.style.display = 'block';
        }
      }, 50);
    }
    setIsVisible(true);
  };

  const hideDiceBox = () => {
    console.log("[DiceBox3D] Masquage de l'overlay - remise en arrière-plan du conteneur DiceBox");
    // Remettre le conteneur DiceBox en arrière-plan
    const container = document.getElementById("dice-box-container");
    if (container) {
      container.style.zIndex = "-10"; // Retour en arrière-plan
    }
    setIsVisible(false);
    setRollResult(null);
    setRollPlayer(null);
  };

  // Initialiser DiceBox
  useEffect(() => {
    const initDiceBox = async () => {
      try {
        console.log("[DiceBox3D] Début de l'initialisation...");
        
        // Attendre un peu pour que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Import dynamique de la librairie
        const DiceBox = (await import("@3d-dice/dice-box")).default;
        console.log("[DiceBox3D] Librairie chargée avec succès");
        
        // Vérifier que le conteneur principal existe
        const container = document.getElementById("dice-box-container");
        if (!container) {
          console.error("[DiceBox3D] Conteneur #dice-box-container non trouvé");
          return;
        }
        
        console.log("[DiceBox3D] Conteneur trouvé, initialisation...");
        
        // Créer l'instance DiceBox avec le conteneur principal (toujours visible)
        console.log("[DiceBox3D] Création de l'instance DiceBox...");
        diceBoxInstance.current = new DiceBox("#dice-box-container", {
          assetPath: "/assets/dice-box/",
          theme: "default",
          themeColor: "#4a90e2",
          scale: 4, // Réduit drastiquement pour des dés très petits
          gravity: 2, // Augmente la gravité pour un mouvement plus rapide
          mass: 0.3, // Encore plus léger
          friction: 0.8,
          restitution: 0.2,
          linearDamping: 0.2,
          angularDamping: 0.2,
          shadowTransparency: 0.15,
          startingHeight: 10, // Hauteur encore plus basse
          throwForce: 6, // Force réduite
          spinForce: 2, // Rotation minimale
          startingPosition: { x: 0, y: 10, z: 0 }, // Position très basse
          // Configuration pour forcer la taille du canvas
          canvas: {
            width: "100%",
            height: "100%"
          },
          onRollComplete: (results) => {
            console.log("[DiceBox3D] ✅ Résultat du lancer 3D:", results);
            
            // Calculer le total du lancer
            const total = results.reduce((sum, die) => sum + die.value, 0);
            console.log("[DiceBox3D] Total calculé:", total);
            
            // Utiliser les données stockées dans les variables globales temporaires
            const playerName = tempPlayerData || currentPlayerRef.current || "Joueur";
            const notation = tempNotationData || "1d100"; // Fallback par défaut
            const diceType = tempTypeData || "d100"; // Fallback par défaut
            
            console.log("[DiceBox3D] 🎲 Données du lancer:", { playerName, notation, diceType });
            console.log("[DiceBox3D] 🎲 Variables temporaires:", { tempPlayerData, tempNotationData, tempTypeData });
            console.log("[DiceBox3D] 🎲 Refs actuels:", { currentPlayerRef: currentPlayerRef.current });
            
            // Arrêter le streaming après un court délai pour laisser voir le résultat
            setTimeout(() => {
              stopCanvasStream();
            }, 1000);
            
            // Envoyer le résultat réel au serveur pour le partager à tous
            if (socketRef.current && socketRef.current.connected) {
              console.log("[DiceBox3D] 📤 Envoi du résultat au serveur:", total);
              console.log("[DiceBox3D] 🆔 Avec sessionId:", sessionIdRef.current);
              const dataToSend = { 
                result: total, 
                details: results,
                player: playerName,
                sessionId: sessionIdRef.current,
                notation: notation,
                type: diceType
              };
              console.log("[DiceBox3D] 📦 Données envoyées au serveur:", JSON.stringify(dataToSend, null, 2));
              socketRef.current.emit("dice:result", dataToSend);
            }
            
            // Afficher le résultat localement
            setIsRolling(false);
            setRollResult(total);
            
            // Afficher la notification avec le BON nom de joueur
            console.log("[DiceBox3D] 📢 Préparation notification avec player:", playerName, "résultat:", total);
            showNotification({
              type: "dice",
              result: total,
              player: playerName,
              details: results,
              notation: notation,
              diceType: diceType
            });
            
            // Masquer l'overlay après 3 secondes
            setTimeout(() => {
              console.log("[DiceBox3D] 🛑 Fermeture automatique du stream (joueur qui lance)");
              const container = document.getElementById("dice-box-container");
              if (container) {
                container.style.zIndex = "-10";
              }
              hideDiceBox();
            }, 3000);
          }
        });

        console.log("[DiceBox3D] Instance créée, initialisation en cours...");
        
        // Initialiser DiceBox
        await diceBoxInstance.current.init();
        
        // Forcer le redimensionnement du canvas après l'initialisation
        setTimeout(() => {
          const canvas = container.querySelector('canvas');
          if (canvas) {
            console.log("[DiceBox3D] Redimensionnement du canvas...");
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.objectFit = 'cover';
            canvas.style.display = 'block';
          }
        }, 100);
        
        setIsInitialized(true);
        console.log("[DiceBox3D] DiceBox initialisé avec succès");
        
      } catch (error) {
        console.error("[DiceBox3D] Erreur lors de l'initialisation:", error);
        console.error("[DiceBox3D] Détails de l'erreur:", error.message);
        console.error("[DiceBox3D] Stack trace:", error.stack);
      }
    };

    // Attendre un peu que le DOM soit prêt
    const timer = setTimeout(() => {
      initDiceBox();
    }, 2000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (diceBoxInstance.current) {
        diceBoxInstance.current.destroy?.();
      }
    };
  }, []);

  // Écouter les événements socket pour la synchronisation
  useEffect(() => {
    console.log("[DiceBox3D] useEffect socket - Socket:", !!socket, "Initialisé:", isInitialized);
    
    if (!socket) {
      console.log("[DiceBox3D] Pas de socket, arrêt");
      return;
    }
    
    if (!isInitialized) {
      console.log("[DiceBox3D] Pas encore initialisé, arrêt");
      return;
    }

    const handleDiceRoll = (data) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("[DiceBox3D] 🎲 ÉVÉNEMENT DICE:ROLLED REÇU");
      console.log("[DiceBox3D] 📦 Données complètes:", JSON.stringify(data, null, 2));
      console.log("[DiceBox3D] 🆔 Mon ID de session:", sessionIdRef.current);
      console.log("[DiceBox3D] 🆔 ID de session qui lance:", data.sessionId);
      console.log("[DiceBox3D] 👤 Nom du joueur qui lance:", data.player);
      
      // DEBUG: Vérifier si c'est bien reçu
      console.log("[DiceBox3D] 🔍 DEBUG - Événement dice:rolled reçu par le client !");
      
      // UTILISER L'ID DE SESSION pour déterminer si c'est mon lancer
      const isMyRoll = data.sessionId === sessionIdRef.current;
      
      console.log("[DiceBox3D] ❓ Est-ce MON lancer?", isMyRoll ? "✅ OUI" : "❌ NON");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      setIsRolling(true);
      setIsVisible(true);
      setRollPlayer(data.player);
      currentPlayerRef.current = data.player; // Stocker dans la ref pour les callbacks
      currentNotationRef.current = data.notation; // Stocker la notation
      currentTypeRef.current = data.type; // Stocker le type
      
      // S'assurer que rollPlayer est bien défini pour les callbacks
      console.log("[DiceBox3D] 👤 RollPlayer défini à:", data.player);
      console.log("[DiceBox3D] 🎲 Notation du dé:", data.notation);
      console.log("[DiceBox3D] 🎲 Type du dé:", data.type);
      console.log("[DiceBox3D] 🔍 Refs après mise à jour:", {
        currentPlayer: currentPlayerRef.current,
        currentNotation: currentNotationRef.current,
        currentType: currentTypeRef.current
      });
      
      // Utiliser la notation fournie ou convertir le type
      let notation = data.notation;
      
      if (!notation) {
        // Fallback pour l'ancien système
        if (data.type === "d6") {
          notation = "1d6";
        } else if (data.type === "d100") {
          notation = "1d100";
        } else if (data.type === "d10") {
          notation = "1d10";
        } else if (data.type === "d20") {
          notation = "1d20";
        } else {
          notation = `1${data.type}`;
        }
      }

      if (isMyRoll) {
        // C'est MOI qui lance - lancer l'animation 3D réelle et streamer
        console.log("[DiceBox3D] 🎯 C'EST MON LANCER - Animation 3D réelle avec notation:", notation);
        
        // Stocker les données du lancer dans les variables globales temporaires
        // Utiliser le nom du joueur depuis les refs si data.player est "Joueur"
        tempPlayerData = (data.player === "Joueur" && currentPlayerRef.current) ? currentPlayerRef.current : data.player;
        tempNotationData = data.notation || notation; // Utiliser la notation calculée si data.notation est undefined
        tempTypeData = data.type;
        
        // Debug: vérifier pourquoi le joueur est "Joueur" au lieu du vrai nom
        console.log("[DiceBox3D] 🔍 Debug joueur:", {
          dataPlayer: data.player,
          rollPlayer: rollPlayer,
          currentPlayerRef: currentPlayerRef.current
        });
        
        console.log("[DiceBox3D] 🎲 Données stockées pour callbacks:", { tempPlayerData, tempNotationData, tempTypeData });
        console.log("[DiceBox3D] 🎲 Données originales:", { player: data.player, notation: data.notation, type: data.type });
        console.log("[DiceBox3D] 🎲 Notation calculée:", notation);
        
        // Vérifier si l'instance existe, sinon la recréer
        if (!diceBoxInstance.current) {
          console.log("[DiceBox3D] ⚠️ Instance DiceBox détruite, RECRÉATION...");
          
          // Recréer l'instance DiceBox de manière asynchrone
          const recreateDiceBox = async () => {
            try {
              const DiceBox = (await import("@3d-dice/dice-box")).default;
              const container = document.getElementById("dice-box-container");
              
              if (!container) {
                console.error("[DiceBox3D] ❌ Conteneur non trouvé");
                return;
              }
              
              console.log("[DiceBox3D] 🔨 Recréation de l'instance DiceBox...");
              diceBoxInstance.current = new DiceBox("#dice-box-container", {
                assetPath: "/assets/dice-box/",
                theme: "default",
                themeColor: "#4a90e2",
                scale: 4,
                gravity: 2,
                mass: 0.3,
                friction: 0.8,
                restitution: 0.2,
                linearDamping: 0.2,
                angularDamping: 0.2,
                shadowTransparency: 0.15,
                startingHeight: 10,
                throwForce: 6,
                spinForce: 2,
                startingPosition: { x: 0, y: 10, z: 0 },
                canvas: {
                  width: "100%",
                  height: "100%"
                },
                onRollComplete: (results) => {
                  console.log("[DiceBox3D] ✅ Résultat du lancer 3D (recréation):", results);
                  const total = results.reduce((sum, die) => sum + die.value, 0);
                  
                  // Utiliser les données stockées dans les variables globales temporaires
                  const playerName = tempPlayerData || "Joueur";
                  const notation = tempNotationData;
                  const diceType = tempTypeData;
                  
                  console.log("[DiceBox3D] 🎲 Données du lancer (recréation):", { playerName, notation, diceType });
                  
                  setTimeout(() => stopCanvasStream(), 1000);
                  
                  if (socketRef.current && socketRef.current.connected) {
                    const dataToSend = { 
                      result: total, 
                      details: results,
                      player: playerName,
                      sessionId: sessionIdRef.current,
                      notation: notation,
                      type: diceType
                    };
                    console.log("[DiceBox3D] 📦 Données envoyées au serveur (recréation):", JSON.stringify(dataToSend, null, 2));
                    socketRef.current.emit("dice:result", dataToSend);
                  }
                  
                  setIsRolling(false);
                  setRollResult(total);
                  
                  console.log("[DiceBox3D] 📢 Préparation notification (recréation) avec player:", playerName, "résultat:", total);
                  showNotification({
                    type: "dice",
                    result: total,
                    player: playerName,
                    details: results,
                    notation: notation,
                    diceType: diceType
                  });
                  
                  setTimeout(() => {
                    console.log("[DiceBox3D] 🛑 Fermeture automatique du stream (recréation)");
                    const container = document.getElementById("dice-box-container");
                    if (container) {
                      container.style.zIndex = "-10";
                    }
                    hideDiceBox();
                  }, 3000);
                }
              });
              
              await diceBoxInstance.current.init();
              console.log("[DiceBox3D] ✅ Instance recréée avec succès");
              
              // Maintenant lancer les dés
              showDiceBox();
              setTimeout(() => startCanvasStream(), 100);
              diceBoxInstance.current.roll(notation);
              console.log("[DiceBox3D] ✅ Animation lancée - streaming en cours");
              
            } catch (error) {
              console.error("[DiceBox3D] ❌ Erreur lors de la recréation:", error);
            }
          };
          
          recreateDiceBox();
          return;
        }
        
        // L'instance existe déjà, lancer normalement
        showDiceBox();
        
        try {
          setTimeout(() => startCanvasStream(), 100);
          diceBoxInstance.current.roll(notation);
          console.log("[DiceBox3D] ✅ Animation lancée - streaming en cours");
        } catch (error) {
          console.error("[DiceBox3D] ❌ Erreur lors du lancer:", error);
        }
      } else {
        // C'est un AUTRE joueur qui lance - MODE SPECTATEUR COMPLET
        console.log("[DiceBox3D] 👀 SPECTATEUR - Attente du stream de", data.player);
        console.log("[DiceBox3D] 🚫 DESTRUCTION de l'instance DiceBox locale");
        
        // DÉTRUIRE complètement l'instance DiceBox pour éviter TOUT lancer
        if (diceBoxInstance.current) {
          try {
            console.log("[DiceBox3D] 💥 Destruction de DiceBox...");
            diceBoxInstance.current.clear?.(); // Vider tous les dés
            diceBoxInstance.current = null; // Supprimer la référence
            console.log("[DiceBox3D] ✅ DiceBox détruit");
          } catch (e) {
            console.error("[DiceBox3D] Erreur lors de la destruction:", e);
          }
        }
        
        // Supprimer physiquement le canvas du DOM
        const container = document.getElementById("dice-box-container");
        if (container) {
          const canvas = container.querySelector("canvas");
          if (canvas) {
            console.log("[DiceBox3D] 🗑️ Suppression du canvas du DOM");
            canvas.remove();
          }
        }
        
        setIsReceivingStream(true);
        console.log("[DiceBox3D] ✅ MODE RÉCEPTION PURE - pas de 3D locale");
      }
    };

    // Écouter les résultats partagés par le joueur qui a lancé
    const handleDiceResult = (data) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("[DiceBox3D] 📥 ÉVÉNEMENT DICE:RESULT REÇU");
      console.log("[DiceBox3D] 📦 Données:", JSON.stringify(data, null, 2));
      console.log("[DiceBox3D] 🆔 Mon sessionId:", sessionIdRef.current);
      console.log("[DiceBox3D] 🆔 SessionId qui envoie:", data.sessionId);
      console.log("[DiceBox3D] 👤 Joueur qui a lancé:", data.player);
      
      // Si c'est mon propre résultat (même sessionId), fermer le stream
      if (data.sessionId === sessionIdRef.current) {
        console.log("[DiceBox3D] ⏭️ C'est mon propre résultat");
        console.log("[DiceBox3D] 🛑 Fermeture automatique du stream");
        
        // Fermer le stream et l'overlay après 3 secondes
        setTimeout(() => {
          const container = document.getElementById("dice-box-container");
          if (container) {
            container.style.zIndex = "-10";
          }
          hideDiceBox();
        }, 3000);
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return;
      }
      
      // Afficher le résultat de l'autre joueur
      console.log("[DiceBox3D] 👁️ AFFICHAGE du résultat de", data.player, ":", data.result);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      setIsRolling(false);
      setRollResult(data.result);
      setRollPlayer(data.player);
      
      // Afficher la notification pour les spectateurs
      console.log("[DiceBox3D] 📢 Affichage notification pour:", data.player, "avec résultat:", data.result);
      console.log("[DiceBox3D] 📢 Notification spectateur - Notation:", data.notation, "Type:", data.type);
      showNotification({
        type: "dice",
        result: data.result,
        player: data.player,
        details: data.details || [],
        notation: data.notation,  // Ajouter la notation du dé
        diceType: data.type  // Ajouter le type de dé
      });
      
      // Fermer le stream du spectateur après 3 secondes
      setTimeout(() => {
        console.log("[DiceBox3D] 🛑 Fermeture du stream spectateur");
        setIsReceivingStream(false);
        setReceivedStream(null);
        
        const container = document.getElementById("dice-box-container");
        if (container) {
          container.style.zIndex = "-10";
        }
        hideDiceBox();
      }, 3000);
    };

    // Écouter les frames du canvas streamés par un autre joueur
    const handleCanvasFrame = (data) => {
      // Ignorer nos propres frames (même sessionId)
      if (data.sessionId === sessionIdRef.current) {
        return;
      }
      
      // Mise à jour DIRECTE du DOM pour performance maximale (bypass React)
      const streamImg = document.getElementById('dice-stream-img');
      if (streamImg) {
        streamImg.src = data.frame;
        
        // Calculer les dimensions optimales
        const streamRatio = data.aspectRatio || 1;
        const viewportRatio = window.innerWidth / window.innerHeight;
        
        let imgWidth, imgHeight;
        if (streamRatio > viewportRatio) {
          imgWidth = window.innerWidth;
          imgHeight = window.innerWidth / streamRatio;
        } else {
          imgHeight = window.innerHeight;
          imgWidth = window.innerHeight * streamRatio;
        }
        
        streamImg.style.width = `${imgWidth}px`;
        streamImg.style.height = `${imgHeight}px`;
      }
      
      // Mettre à jour l'état React seulement pour les métadonnées (pas la performance critique)
      setReceivedStream({
        imageData: data.frame,
        canvasWidth: data.canvasWidth,
        canvasHeight: data.canvasHeight,
        aspectRatio: data.aspectRatio
      });
    };

    // Écouter la fin du stream
    const handleStreamEnd = (data) => {
      console.log("[DiceBox3D] 🛑 Fin du stream de", data?.player || "joueur inconnu");
      console.log("[DiceBox3D] 📦 Données stream-end:", JSON.stringify(data, null, 2));
      
      // Remettre les états à zéro pour permettre un nouveau lancer
      setIsReceivingStream(false);
      setReceivedStream(null);
      
      // S'assurer que le conteneur local est prêt pour le prochain lancer
      const container = document.getElementById("dice-box-container");
      if (container) {
        container.style.zIndex = "-10";
        console.log("[DiceBox3D] ✅ Conteneur local réinitialisé pour le prochain lancer");
      }
    };

    console.log("[DiceBox3D] Écoute de l'événement 'dice:rolled'");
    socket.on("dice:rolled", handleDiceRoll);
    
    console.log("[DiceBox3D] Écoute de l'événement 'dice:result'");
    socket.on("dice:result", handleDiceResult);
    
    console.log("[DiceBox3D] Écoute de l'événement 'canvas:frame'");
    socket.on("canvas:frame", handleCanvasFrame);
    
    console.log("[DiceBox3D] Écoute de l'événement 'canvas:stream-end'");
    socket.on("canvas:stream-end", handleStreamEnd);

    return () => {
      console.log("[DiceBox3D] Arrêt de l'écoute des événements");
      socket.off("dice:rolled", handleDiceRoll);
      socket.off("dice:result", handleDiceResult);
      socket.off("canvas:frame", handleCanvasFrame);
      socket.off("canvas:stream-end", handleStreamEnd);
    };
  }, [socket, isInitialized, showNotification]);

  // Fonction pour lancer des dés (appelée depuis l'interface)
  const rollDice = (notation) => {
    if (!diceBoxInstance.current || isRolling) return;
    
    console.log("[DiceBox3D] Lancement de dés:", notation);
    setIsRolling(true);
    setIsVisible(true);
    
    // Afficher le conteneur DiceBox
    showDiceBox();
    
    diceBoxInstance.current.roll(notation);
  };

  // Exposer la fonction pour les composants parents
  useEffect(() => {
    window.rollDice = rollDice;
    return () => {
      delete window.rollDice;
    };
  }, [isRolling]);

  console.log("[DiceBox3D] Render - isVisible:", isVisible, "isRolling:", isRolling, "isInitialized:", isInitialized);
  
  // Utiliser isVisible normalement
  const forceVisible = isVisible;
  
  return (
    <>
      {/* Conteneur DiceBox - visible uniquement quand JE lance les dés */}
      <div
        id="dice-box-container"
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          zIndex: isVisible && !isReceivingStream ? 40 : -10000,
          pointerEvents: "none",
          display: isReceivingStream ? "none" : "block",
          visibility: isReceivingStream ? "hidden" : "visible",
          opacity: isReceivingStream ? 0 : 1
        }}
      />
      
      {/* Affichage du stream vidéo reçu - remplace complètement le canvas local */}
      {isReceivingStream && (
        <div
          className="dice-stream-container"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            zIndex: 40,
            background: `
              linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%),
              radial-gradient(ellipse at 30% 20%, rgba(20, 80, 40, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(10, 60, 30, 0.3) 0%, transparent 50%),
              linear-gradient(180deg, #1a4d2e 0%, #0d3520 50%, #0a2618 100%)
            `,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            overflow: "hidden"
          }}
        >
          {receivedStream && receivedStream.imageData ? (
            <img 
              id="dice-stream-img"
              src={receivedStream.imageData} 
              alt="Stream des dés" 
              style={{
                width: "100vw",
                height: "100vh",
                objectFit: "contain",
                objectPosition: "center",
                imageRendering: "auto",
                WebkitFontSmoothing: "subpixel-antialiased",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
                display: "block",
                willChange: "contents", // Optimisation Chrome pour changements fréquents
                filter: "contrast(1.02) brightness(1.02)"
              }}
            />
          ) : (
            <div className="text-white text-xl animate-pulse">
              📹 Réception du stream en cours...
            </div>
          )}
        </div>
      )}
      
      {/* Overlay et contrôles seulement quand visible */}
      {forceVisible && (
        <div className="fixed inset-0 z-50 bg-opacity-30 flex items-center justify-center">
          <div className="relative w-full h-full max-w-6xl max-h-5xl">
            {/* Indicateur de lancer */}
            {isRolling && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
                  🎲 {rollPlayer} lance les dés...
                </div>
              </div>
            )}
            
            {/* Affichage du résultat */}
            {rollResult !== null && !isRolling && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-green-600 text-white px-8 py-4 rounded-lg shadow-lg text-2xl font-bold animate-bounce">
                  🎯 Résultat : {rollResult}
                </div>
              </div>
            )}
            
            {/* Bouton de fermeture */}
            <button
              onClick={hideDiceBox}
              className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
            >
              ✕ Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
