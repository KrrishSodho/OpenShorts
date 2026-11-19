import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const SpinningMesh: React.FC<{ frame: number }> = ({ frame }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = frame * 0.03;
      meshRef.current.rotation.y = frame * 0.05;
      meshRef.current.position.y = Math.sin(frame * 0.08) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial
        color="#00F0FF"
        emissive="#7000FF"
        emissiveIntensity={0.6}
        roughness={0.1}
        metalness={0.9}
        wireframe={false}
      />
    </mesh>
  );
};

export const Floating3DObject: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div className="absolute top-[12%] right-[10%] w-48 h-48 pointer-events-none z-25">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00F0FF" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#FF2A54" />
        <SpinningMesh frame={frame} />
      </Canvas>
    </div>
  );
};
