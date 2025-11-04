'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { ReactNode } from 'react';

interface ThreeWrapperProps {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  showGrid?: boolean;
  showAxes?: boolean;
}

export function ThreeWrapper({
  children,
  className = "w-full h-[600px]",
  cameraPosition = [5, 5, 5],
  showGrid = true,
  showAxes = true
}: ThreeWrapperProps) {
  return (
    <div className={`${className} bg-gray-50 dark:bg-gray-900 rounded-lg`}>
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={50}
        />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Grid and axes helpers */}
        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor={'#6f6f6f'}
            sectionSize={5}
            sectionThickness={1}
            sectionColor={'#9d9d9d'}
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid={false}
          />
        )}

        {showAxes && <axesHelper args={[5]} />}

        {/* Render children */}
        {children}
      </Canvas>
    </div>
  );
}