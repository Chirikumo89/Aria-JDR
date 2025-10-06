import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import D10 from "./D10";

export default function D100({ tens = 0, units = 0, rolling = false }) {
  const groupRef = useRef();
  const total = tens + units;
  
  // Calculer les valeurs pour chaque dé (0-9 pour les dizaines, 0-9 pour les unités)
  const tensValue = Math.floor(tens / 10); // 0-9
  const unitsValue = units; // 0-9

  useFrame((state, delta) => {
    if (!rolling) return;
    if (groupRef.current) {
      // Animation de roulement pour le groupe
      const speed = 0.3;
      groupRef.current.rotation.x += speed;
      groupRef.current.rotation.y += speed * 0.8;
      groupRef.current.rotation.z += speed * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dé des dizaines */}
      <D10 
        result={tensValue + 1} 
        rolling={rolling} 
        position={[-1.8, 0, 0]} 
      />
      
      {/* Dé des unités */}
      <D10 
        result={unitsValue + 1} 
        rolling={rolling} 
        position={[1.8, 0, 0]} 
      />
      
      {/* Labels pour identifier les dés */}
      {!rolling && (
        <>
          <mesh position={[-1.8, -1.5, 0]}>
            <planeGeometry args={[1, 0.3]} />
            <meshBasicMaterial color="#34495e" transparent opacity={0.8} />
          </mesh>
          <mesh position={[1.8, -1.5, 0]}>
            <planeGeometry args={[1, 0.3]} />
            <meshBasicMaterial color="#34495e" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}
