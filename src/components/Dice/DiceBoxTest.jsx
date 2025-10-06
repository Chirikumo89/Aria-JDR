import React, { useEffect, useRef, useState } from 'react';

const DiceBoxTest = () => {
  const diceBoxInstance = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);

  useEffect(() => {
    const initDiceBox = async () => {
      try {
        console.log("[DiceBoxTest] Début de l'initialisation...");
        
        // Import dynamique de la librairie
        const DiceBox = (await import("@3d-dice/dice-box")).default;
        console.log("[DiceBoxTest] Librairie chargée avec succès");
        
        // Créer l'instance DiceBox avec un conteneur visible
        console.log("[DiceBoxTest] Création de l'instance DiceBox...");
        diceBoxInstance.current = new DiceBox("#dice-box-test-container", {
          assetPath: "/assets/dice-box/",
          theme: "default",
          themeColor: "#4a90e2",
          scale: 30,
          gravity: 1,
          mass: 1,
          friction: 0.8,
          restitution: 0.3,
          linearDamping: 0.1,
          angularDamping: 0.1,
          shadowTransparency: 0.1,
          startingHeight: 30,
          throwForce: 20,
          spinForce: 7.5,
          startingPosition: { x: 0, y: 30, z: 0 },
          onRollComplete: (results) => {
            console.log("[DiceBoxTest] Résultat du lancer:", results);
            setIsRolling(false);
            
            // Calculer le total
            const total = results.reduce((sum, die) => sum + die.value, 0);
            setRollResult(total);
            console.log("[DiceBoxTest] Total calculé:", total);
          }
        });

        console.log("[DiceBoxTest] Instance créée, initialisation en cours...");
        
        // Initialiser DiceBox
        await diceBoxInstance.current.init();
        setIsInitialized(true);
        console.log("[DiceBoxTest] DiceBox initialisé avec succès");
        
      } catch (error) {
        console.error("[DiceBoxTest] Erreur lors de l'initialisation:", error);
        console.error("[DiceBoxTest] Détails de l'erreur:", error.message);
        console.error("[DiceBoxTest] Stack trace:", error.stack);
      }
    };

    // Attendre un peu que le DOM soit prêt
    const timer = setTimeout(() => {
      initDiceBox();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (diceBoxInstance.current) {
        diceBoxInstance.current.destroy?.();
      }
    };
  }, []);

  const rollDice = (notation) => {
    if (!diceBoxInstance.current || isRolling) return;
    
    console.log("[DiceBoxTest] Lancement de dés:", notation);
    setIsRolling(true);
    setRollResult(null);
    
    try {
      diceBoxInstance.current.roll(notation);
      console.log("[DiceBoxTest] Commande roll envoyée");
    } catch (error) {
      console.error("[DiceBoxTest] Erreur lors du lancer:", error);
      setIsRolling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full h-full max-h-5xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Test DiceBox 3D</h2>
        
        {/* Conteneur DiceBox - TOUJOURS VISIBLE */}
        <div 
          id="dice-box-test-container" 
          className="w-full h-96 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg mb-4"
          style={{ minHeight: "400px" }}
        />
        
        {/* Contrôles */}
        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={() => rollDice("1d6")}
            disabled={!isInitialized || isRolling}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {isRolling ? "Lancement..." : "Lancer 1D6"}
          </button>
          
          <button
            onClick={() => rollDice("1d20")}
            disabled={!isInitialized || isRolling}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {isRolling ? "Lancement..." : "Lancer 1D20"}
          </button>
          
          <button
            onClick={() => rollDice("2d6")}
            disabled={!isInitialized || isRolling}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {isRolling ? "Lancement..." : "Lancer 2D6"}
          </button>
        </div>
        
        {/* Statut */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Statut: {isInitialized ? "✅ Initialisé" : "⏳ Initialisation..."}
          </p>
          
          {rollResult !== null && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-xl font-bold">
              🎯 Résultat: {rollResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceBoxTest;
