'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, RotateCw, Pause, Play, Layers3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  type: 'strand' | 'weave' | 'concept';
  x: number;
  y: number;
  z: number;
  connections: string[];
  color: string;
  size: number;
  velocity: { x: number; y: number; z: number };
}

interface WeaveGraphProps {
  className?: string;
  nodes?: Node[];
  autoRotate?: boolean;
  particleCount?: number;
}

export function WeaveGraph({
  className,
  nodes: initialNodes,
  autoRotate = true,
  particleCount = 50,
}: WeaveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  /**
   * Tracks the current rotation applied to the canvas projection without forcing component re-renders each frame.
   */
  const rotationRef = useRef({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(autoRotate);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [particles, setParticles] = useState<{ x: number; y: number; z: number; speed: number }[]>([]);

  // Initialize nodes and particles
  useEffect(() => {
    // Generate demo nodes if none provided
    if (!initialNodes || initialNodes.length === 0) {
      const demoNodes: Node[] = [];
      const nodeCount = 15;
      
      for (let i = 0; i < nodeCount; i++) {
        const type = i < 5 ? 'strand' : i < 10 ? 'weave' : 'concept';
        const node: Node = {
          id: `node-${i}`,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i}`,
          type,
          x: (Math.random() - 0.5) * 300,
          y: (Math.random() - 0.5) * 300,
          z: (Math.random() - 0.5) * 300,
          connections: [],
          color: type === 'strand' ? '#3b82f6' : type === 'weave' ? '#8b5cf6' : '#10b981',
          size: type === 'strand' ? 8 : type === 'weave' ? 12 : 6,
          velocity: {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5,
            z: (Math.random() - 0.5) * 0.5,
          },
        };
        demoNodes.push(node);
      }
      
      // Create connections
      demoNodes.forEach((node, i) => {
        const connectionCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < connectionCount; j++) {
          const targetIndex = Math.floor(Math.random() * demoNodes.length);
          if (targetIndex !== i) {
            node.connections.push(demoNodes[targetIndex].id);
          }
        }
      });
      
      setNodes(demoNodes);
    } else {
      setNodes(initialNodes);
    }
    
    // Initialize particles
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 400,
        speed: Math.random() * 0.5 + 0.1,
      });
    }
    setParticles(newParticles);
  }, [initialNodes, particleCount]);

  // 3D projection function
  const project3D = (x: number, y: number, z: number, rotation: { x: number; y: number }) => {
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    
    // Rotate around X axis
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    
    // Rotate around Y axis
    const x1 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;
    
    // Perspective projection
    const perspective = 500;
    const scale = perspective / (perspective + z2);
    
    return {
      x: x1 * scale,
      y: y1 * scale,
      scale,
      z: z2,
    };
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Update rotation
      if (isPlaying) {
        rotationRef.current.x += 0.002;
        rotationRef.current.y += 0.003;
      }
      
      // Sort nodes by z-depth for proper rendering
      const rotation = rotationRef.current;
      const sortedNodes = [...nodes].sort((a, b) => {
        const projA = project3D(a.x, a.y, a.z, rotation);
        const projB = project3D(b.x, b.y, b.z, rotation);
        return projA.z - projB.z;
      });
      
      // Draw connections
      sortedNodes.forEach((node) => {
        node.connections.forEach((targetId) => {
          const target = nodes.find((n) => n.id === targetId);
          if (!target) return;
          
          const proj1 = project3D(node.x, node.y, node.z, rotation);
          const proj2 = project3D(target.x, target.y, target.z, rotation);
          
          ctx.beginPath();
          ctx.moveTo(centerX + proj1.x, centerY + proj1.y);
          ctx.lineTo(centerX + proj2.x, centerY + proj2.y);
          
          const gradient = ctx.createLinearGradient(
            centerX + proj1.x, centerY + proj1.y,
            centerX + proj2.x, centerY + proj2.y
          );
          gradient.addColorStop(0, node.color + '40');
          gradient.addColorStop(1, target.color + '40');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1 * Math.min(proj1.scale, proj2.scale);
          ctx.stroke();
        });
      });
      
      // Draw particles
      particles.forEach((particle) => {
        const proj = project3D(particle.x, particle.y, particle.z, rotation);
        
        ctx.beginPath();
        ctx.arc(
          centerX + proj.x,
          centerY + proj.y,
          2 * proj.scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(217, 91%, 60%, ${0.3 * proj.scale})`;
        ctx.fill();
        
        // Update particle position
        particle.z -= particle.speed;
        if (particle.z < -200) {
          particle.z = 200;
        }
      });
      
      // Draw nodes
      sortedNodes.forEach((node) => {
        const proj = project3D(node.x, node.y, node.z, rotation);
        
        // Node glow
        const glowGradient = ctx.createRadialGradient(
          centerX + proj.x, centerY + proj.y, 0,
          centerX + proj.x, centerY + proj.y, node.size * 3 * proj.scale
        );
        glowGradient.addColorStop(0, node.color + '60');
        glowGradient.addColorStop(1, node.color + '00');
        
        ctx.beginPath();
        ctx.arc(
          centerX + proj.x,
          centerY + proj.y,
          node.size * 3 * proj.scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Node core
        ctx.beginPath();
        ctx.arc(
          centerX + proj.x,
          centerY + proj.y,
          node.size * proj.scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // Node label
        ctx.fillStyle = '#ffffff' + Math.floor(255 * proj.scale).toString(16).padStart(2, '0');
        ctx.font = `${12 * proj.scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          node.label,
          centerX + proj.x,
          centerY + proj.y - (node.size + 10) * proj.scale
        );
        
        // Update node position (slight floating motion)
        if (isPlaying) {
          node.x += node.velocity.x;
          node.y += node.velocity.y;
          node.z += node.velocity.z;
          
          // Boundary checks
          ['x', 'y', 'z'].forEach((axis) => {
            const coord = node[axis as 'x' | 'y' | 'z'];
            if (typeof coord === 'number' && Math.abs(coord) > 150) {
              node.velocity[axis as 'x' | 'y' | 'z'] *= -1;
            }
          });
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes, particles, isPlaying]);

  const handleReset = () => {
    rotationRef.current = { x: 0, y: 0 };
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className={cn("glass-card relative overflow-hidden", className)}>
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />
      </div>
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlayPause}
          className="glass-card"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="glass-card"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="glass-card"
        >
          <Layers3 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="glass-card"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 z-10 glass-card px-3 py-2 rounded-lg">
        <p className="text-xs text-muted-foreground">
          {nodes.length} nodes • {particles.length} particles
        </p>
      </div>
    </Card>
  );
}
