'use client';

import { useMemo, useRef, useState } from 'react';
import { ThreeWrapper } from './ThreeWrapper';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value?: number;
  category?: string;
  label?: string;
}

interface Three3DScatterProps {
  data: DataPoint[];
  colorScale?: string[];
  title?: string;
}

function ScatterPoint({ point, color, index }: { point: DataPoint; color: THREE.Color; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate on hover
  useFrame((state, delta) => {
    if (meshRef.current) {
      const scale = hovered ? 1.5 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

      // Gentle rotation
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const size = point.value ? Math.sqrt(point.value) * 0.1 : 0.1;

  return (
    <mesh
      ref={meshRef}
      position={[point.x, point.y, point.z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.5 : 0.1}
        metalness={0.3}
        roughness={0.4}
      />

      {hovered && (
        <Html position={[0, size + 0.5, 0]}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {point.label || `Point ${index}`}
            <br />
            X: {point.x.toFixed(2)}
            <br />
            Y: {point.y.toFixed(2)}
            <br />
            Z: {point.z.toFixed(2)}
            {point.value && (
              <>
                <br />
                Value: {point.value}
              </>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function ScatterPoints({ data, colorScale = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'] }: Three3DScatterProps) {
  const points = useMemo(() => {
    // Get unique categories for color mapping
    const categories = [...new Set(data.map(p => p.category))];
    const categoryColorMap = new Map<string | undefined, THREE.Color>();

    categories.forEach((cat, i) => {
      categoryColorMap.set(cat, new THREE.Color(colorScale[i % colorScale.length]));
    });

    return data.map((point, i) => {
      const color = point.category
        ? categoryColorMap.get(point.category) || new THREE.Color(colorScale[0])
        : new THREE.Color(colorScale[i % colorScale.length]);

      return <ScatterPoint key={i} point={point} color={color} index={i} />;
    });
  }, [data, colorScale]);

  return <>{points}</>;
}

function AxisLabels() {
  return (
    <>
      <Html position={[6, 0, 0]}>
        <div className="text-xs font-semibold">X</div>
      </Html>
      <Html position={[0, 6, 0]}>
        <div className="text-xs font-semibold">Y</div>
      </Html>
      <Html position={[0, 0, 6]}>
        <div className="text-xs font-semibold">Z</div>
      </Html>
    </>
  );
}

export default function Three3DScatter({ data, colorScale, title = "3D Scatter Plot" }: Three3DScatterProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ThreeWrapper cameraPosition={[8, 6, 8]} className="w-full h-[500px]">
        <ScatterPoints data={data} colorScale={colorScale} />
        <AxisLabels />
      </ThreeWrapper>

      {/* Legend */}
      {data.some(p => p.category) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[...new Set(data.map(p => p.category))].filter(Boolean).map((category, i) => (
            <div key={category} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: colorScale?.[i % (colorScale?.length || 1)] || '#000'
                }}
              />
              <span className="text-xs">{category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}