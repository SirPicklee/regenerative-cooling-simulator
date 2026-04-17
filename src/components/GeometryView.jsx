import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D ENGINE GEOMETRY VISUALIZATION
 */
function EngineModel({ geometry, thermalResults }) {
  const meshRef = useRef();
  
  // Rotate slowly
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });
  
  // Generate engine contour points
  const contourPoints = useMemo(() => {
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * geometry.L_total;
      const r = geometry.getRadius(x);
      points.push(new THREE.Vector3(x * 10, r * 10, 0)); // Scale up for visibility
    }
    
    return points;
  }, [geometry]);
  
  // Create revolution geometry (lathe)
  const engineGeometry = useMemo(() => {
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * geometry.L_total;
      const r = geometry.getRadius(x);
      points.push(new THREE.Vector2(x * 10, r * 10));
    }
    
    const latheGeometry = new THREE.LatheGeometry(points, 32);
    latheGeometry.rotateX(Math.PI / 2); // Orient horizontally
    return latheGeometry;
  }, [geometry]);
  
  // Color based on heat flux if available
  const getHeatColor = (x) => {
    if (!thermalResults) return '#444444';
    
    // Find closest thermal result position
    const positions = thermalResults.peakHeatFlux ? [thermalResults.peakHeatFlux.position] : [];
    if (positions.length === 0) return '#444444';
    
    const throatX = geometry.L_chamber + geometry.L_convergent;
    const distance = Math.abs(x - throatX);
    
    // Heat map: red at throat, orange near throat, yellow further, blue far
    if (distance < 0.05) return '#ff0000'; // Red - hottest
    if (distance < 0.1) return '#ff6600';  // Orange
    if (distance < 0.2) return '#ffaa00';  // Yellow-orange
    if (distance < 0.3) return '#ffdd00';  // Yellow
    return '#0088ff'; // Blue - cooler
  };
  
  return (
    <group ref={meshRef}>
      {/* Main engine body */}
      <mesh geometry={engineGeometry}>
        <meshStandardMaterial
          color="#888888"
          metalness={0.8}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Throat marker (red ring) */}
      <mesh position={[(geometry.L_chamber + geometry.L_convergent) * 10, 0, 0]}>
        <torusGeometry args={[geometry.R_throat * 10, 0.1, 16, 32]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Cooling channels visualization (simplified) */}
      <mesh position={[geometry.L_total * 5, 0, 0]}>
        <cylinderGeometry args={[geometry.R_chamber * 10.2, geometry.R_exit * 10.2, geometry.L_total * 10, 32]} />
        <meshStandardMaterial
          color="#00aaff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Main Visualization Component
 */
export default function GeometryVisualization({ geometry, thermalResults }) {
  return (
    <div style={{ width: '100%', height: '400px', background: '#0a0a0a', borderRadius: '8px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [15, 8, 15], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Engine Model */}
        <EngineModel geometry={geometry} thermalResults={thermalResults} />
        
        {/* Controls */}
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        {/* Grid */}
        <gridHelper args={[20, 20, '#333333', '#1a1a1a']} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: '#888',
        fontSize: '0.75rem',
        fontFamily: 'monospace'
      }}>
        🖱️ Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}