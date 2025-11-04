'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Play, Pause, Maximize2, RotateCw } from 'lucide-react';
import { WeavePattern } from '@/components/icons/WeavePattern';
import Link from 'next/link';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

// Demo data for the weave visualization
const demoNodes = [
  { id: '1', label: 'Machine Learning Basics', type: 'document', x: 200, y: 200 },
  { id: '2', label: 'Neural Networks', type: 'document', x: 400, y: 150 },
  { id: '3', label: 'Python Tutorial', type: 'document', x: 300, y: 350 },
  { id: '4', label: 'TensorFlow Dataset', type: 'dataset', x: 500, y: 250 },
  { id: '5', label: 'Model Training Results', type: 'visualization', x: 600, y: 350 },
  { id: '6', label: 'Deep Learning Course', type: 'collection', x: 350, y: 250 },
];

const demoEdges = [
  { source: '1', target: '2', type: 'prerequisite' },
  { source: '1', target: '3', type: 'related' },
  { source: '2', target: '4', type: 'uses' },
  { source: '4', target: '5', type: 'visualizes' },
  { source: '2', target: '6', type: 'part-of' },
  { source: '3', target: '6', type: 'part-of' },
];

const nodeColors = {
  document: '#3B82F6',
  dataset: '#10B981',
  visualization: '#8B5CF6',
  collection: '#F59E0B',
};

export function WeaveShowcase() {
  const localizePath = useLocalizedPath();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Animation variables
    let time = 0;

    const animate = () => {
      if (!isPlaying) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw edges
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 2;
      demoEdges.forEach(edge => {
        const source = demoNodes.find(n => n.id === edge.source);
        const target = demoNodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          
          // Add slight curve
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 + Math.sin(time * 0.001) * 20;
          ctx.quadraticCurveTo(midX, midY, target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      demoNodes.forEach((node, i) => {
        const x = node.x + Math.sin(time * 0.001 + i) * 10;
        const y = node.y + Math.cos(time * 0.001 + i) * 10;
        
        // Node circle
        ctx.fillStyle = nodeColors[node.type as keyof typeof nodeColors];
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Node label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + 25);
      });

      time += 16;
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-24">
      <div className="absolute inset-0 -z-10">
        <WeavePattern variant="hero" className="h-full w-full opacity-5" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left content */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-4">Interactive Demo</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Visualize Your Knowledge Graph
              </h2>
              <p className="text-lg text-muted-foreground">
                See how your strands connect in a living, breathing knowledge graph. 
                Discover patterns, find learning paths, and understand relationships at a glance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Automatic Relationship Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    AI analyzes your content to find and suggest connections between strands
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Interactive Exploration</h3>
                  <p className="text-sm text-muted-foreground">
                    Click, drag, zoom, and filter to explore your knowledge from any angle
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">3</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">Learning Path Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Find the optimal path between concepts based on prerequisites and difficulty
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href={localizePath('/weave')}>
                  Try Live Demo
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={localizePath('/docs/weave')}>
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          {/* Right visualization */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-background to-primary/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Knowledge Graph Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative h-[400px] w-full rounded-lg border border-border/50 bg-white/50 dark:bg-gray-900/50">
              <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{ width: '100%', height: '100%' }}
              />
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 space-y-1 rounded-lg bg-background/80 p-3 text-xs backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Document</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Dataset</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span>Visualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Collection</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
