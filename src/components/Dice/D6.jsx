import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture } from "three";

export default function D6({ result = 1, rolling = false, position = [0, 0, 0] }) {
  const meshRef = useRef();
  const rotationTargetRef = useRef([0, 0, 0]);
  const rollingRef = useRef(false);
  const timeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0, z: 0 });
  const positionRef = useRef({ x: 0, y: 0, z: 0 });

  // Créer les textures pour chaque face avec les bons numéros
  const textures = useMemo(() => {
    const createFaceTexture = (number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      
      // Bordure noire
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 252, 252);
      
      // Numéro au centre
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.toString(), 128, 128);
      
      return new CanvasTexture(canvas);
    };

    return {
      // Chaque face a son numéro fixe
      top: createFaceTexture(1),      // Face du haut
      right: createFaceTexture(2),    // Face de droite
      left: createFaceTexture(3),     // Face de gauche
      back: createFaceTexture(4),     // Face arrière
      front: createFaceTexture(5),    // Face avant
      bottom: createFaceTexture(6)    // Face du bas
    };
  }, []);

  // Pas de rotation forcée - le dé tourne naturellement
  // Le résultat sera lu sur la face qui est réellement visible


  useEffect(() => {
    if (!rolling) {
      // Pas de rotation forcée - le dé reste dans sa position naturelle
      rollingRef.current = false;
      timeRef.current = 0;
      // Reset position
      positionRef.current = { x: position[0], y: position[1], z: position[2] };
      velocityRef.current = { x: 0, y: 0, z: 0 };
    } else {
      rollingRef.current = true;
      timeRef.current = 0;
      // Initial velocity for rolling
      velocityRef.current = { 
        x: (Math.random() - 0.5) * 0.3, 
        y: Math.random() * 0.4 + 0.2, 
        z: (Math.random() - 0.5) * 0.3 
      };
      positionRef.current = { x: position[0], y: position[1], z: position[2] };
    }
  }, [result, rolling, position]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;

    if (rollingRef.current) {
      // Animation de roulement avec rebonds réalistes
      const speed = 0.8 + Math.random() * 0.4;
      meshRef.current.rotation.x += speed;
      meshRef.current.rotation.y += speed * 0.9;
      meshRef.current.rotation.z += speed * 0.7;
      
      // Physics simulation réaliste
      const gravity = -1.2;
      const bounce = 0.6;
      const friction = 0.92;
      const airResistance = 0.98;
      
      // Apply gravity
      velocityRef.current.y += gravity * delta;
      
      // Apply air resistance
      velocityRef.current.x *= airResistance;
      velocityRef.current.z *= airResistance;
      
      // Update position
      positionRef.current.x += velocityRef.current.x * delta;
      positionRef.current.y += velocityRef.current.y * delta;
      positionRef.current.z += velocityRef.current.z * delta;
      
      // Ground collision
      if (positionRef.current.y <= -2) {
        positionRef.current.y = -2;
        velocityRef.current.y *= -bounce;
        velocityRef.current.x *= friction;
        velocityRef.current.z *= friction;
        
        // Add random movement after bounce
        if (Math.abs(velocityRef.current.y) < 0.1) {
          velocityRef.current.x += (Math.random() - 0.5) * 0.1;
          velocityRef.current.z += (Math.random() - 0.5) * 0.1;
        }
      }
      
      // Apply position
      meshRef.current.position.x = positionRef.current.x;
      meshRef.current.position.y = positionRef.current.y;
      meshRef.current.position.z = positionRef.current.z;
      
    } else {
      // Stabilisation naturelle - pas de rotation forcée
      // Le dé reste dans sa position naturelle après l'animation
      
      // Return to original position
      const lerpSpeed = 0.12;
      meshRef.current.position.x += (position[0] - meshRef.current.position.x) * lerpSpeed;
      meshRef.current.position.y += (position[1] - meshRef.current.position.y) * lerpSpeed;
      meshRef.current.position.z += (position[2] - meshRef.current.position.z) * lerpSpeed;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh scale={[1.2, 1.2, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.2}
          metalness={0.05}
        />
      </mesh>
      
      {/* Textures sur chaque face du cube */}
      {/* Face du haut (1) */}
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.top} />
      </mesh>
      
      {/* Face de droite (2) */}
      <mesh position={[0.6, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.right} />
      </mesh>
      
      {/* Face de gauche (3) */}
      <mesh position={[-0.6, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.left} />
      </mesh>
      
      {/* Face arrière (4) */}
      <mesh position={[0, 0, -0.6]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.back} />
      </mesh>
      
      {/* Face avant (5) */}
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.front} />
      </mesh>
      
      {/* Face du bas (6) */}
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={textures.bottom} />
      </mesh>
    </group>
  );
}
