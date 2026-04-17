import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SIMPLE ROCKET ENGINE CROSS-SECTION
 */
function SimpleEngineModel({ geometry }) {
  // Chamber (cylinder)
  const chamberRadius = geometry.R_chamber * 10;
  const chamberLength = geometry.L_chamber * 10;
  
  // Throat (smaller cylinder)
  const throatRadius = geometry.R_throat * 10;
  const throatLength = geometry.L_throat * 10;
  
  // Nozzle (cone)
  const exitRadius = geometry.R_exit * 10;
  const nozzleLength = geometry.L_divergent * 10;
  
  return (
    <group>
      {/* CHAMBER - Orange */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[chamberRadius, chamberRadius, chamberLength, 32]} />
        <meshStandardMaterial color="#ff8800" metalness={0.3} roughness={0.7} />
      </mesh>
      <Text position={[0, chamberRadius + 1, 0]} fontSize={0.8} color="#ff8800">
        CHAMBER
      </Text>
      
      {/* THROAT - Red (critical point) */}
      <mesh position={[0, 0, chamberLength/2 + throatLength/2]}>
        <cylinderGeometry args={[throatRadius, throatRadius, throatLength, 32]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, throatRadius + 1, chamberLength/2 + throatLength/2]} fontSize={0.8} color="#ff0000">
        THROAT
      </Text>
      
      {/* NOZZLE - Blue (expansion) */}
      <mesh position={[0, 0, chamberLength/2 + throatLength + nozzleLength/2]}>
        <cylinderGeometry args={[exitRadius, throatRadius, nozzleLength, 32]} />
        <meshStandardMaterial color="#0088ff" metalness={0.5} roughness={0.5} />
      </mesh>
      <Text position={[0, exitRadius + 1, chamberLength/2 + throatLength + nozzleLength/2]} fontSize={0.8} color="#0088ff">
        NOZZLE
      </Text>
      
      {/* COOLING CHANNELS (transparent outer shell) */}
      <mesh position={[0, 0, chamberLength/4]}>
        <cylinderGeometry args={[chamberRadius + 0.5, chamberRadius + 0.5, chamberLength/2, 32]} />
        <meshStandardMaterial 
          color="#00ffff" 
          transparent 
          opacity={0.2} 
          wireframe={false}
        />
      </mesh>
      
      {/* Measurements */}
      <Text position={[-chamberRadius - 2, 0, 0]} fontSize={0.5} color="#888888">
        ⌀ {(geometry.R_chamber * 2 * 1000).toFixed(0)}mm
      </Text>
      <Text position={[-throatRadius - 2, 0, chamberLength/2 + throatLength/2]} fontSize={0.5} color="#888888">
        ⌀ {(geometry.R_throat * 2 * 1000).toFixed(0)}mm
      </Text>
      
      {/* Grid reference */}
      <gridHelper args={[40, 40, '#333333', '#1a1a1a']} position={[0, -chamberRadius - 2, 0]} />
    </group>
  );
}

/**
 * Main Visualization Component
 */
export default function GeometryVisualization({ geometry, thermalResults }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '500px', 
      background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Canvas camera={{ position: [20, 15, 20], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[20, 20, 20]} intensity={1} />
        <pointLight position={[-20, 10, -20]} intensity={0.5} color="#0088ff" />
        <spotLight position={[0, 30, 0]} intensity={0.8} angle={0.3} penumbra={1} color="#ff8800" />
        
        {/* Engine Model */}
        <SimpleEngineModel geometry={geometry} thermalResults={thermalResults} />
        
        {/* Controls */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={50}
        />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '0.75rem',
        fontFamily: 'monospace'
      }}>
        <div>🟠 CHAMBER - Combustion zone</div>
        <div>🔴 THROAT - Critical flow (Mach 1)</div>
        <div>🔵 NOZZLE - Supersonic expansion</div>
        <div style={{ marginTop: '8px', opacity: 0.7 }}>🖱️ Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  );
}