'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Image,
  Database,
  Video,
  Music,
  Code,
  BookOpen,
  Brain,
  Calendar,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const strandTypes = [
  {
    id: 'document',
    name: 'Document',
    icon: FileText,
    description: 'Markdown notes, PDFs, research papers',
    example: {
      title: 'Introduction to Machine Learning',
      content: `# Machine Learning Basics

## What is Machine Learning?
Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

### Key Concepts:
- Supervised Learning
- Unsupervised Learning
- Reinforcement Learning

### Prerequisites:
- Linear Algebra
- Statistics
- Programming (Python)`,
      metadata: {
        difficulty: 'Beginner',
        readingTime: '15 min',
        prerequisites: 3,
        concepts: ['ML', 'AI', 'Algorithms'],
      }
    }
  },
  {
    id: 'dataset',
    name: 'Dataset',
    icon: Database,
    description: 'CSV, JSON, or any structured data',
    example: {
      title: 'Iris Flower Dataset',
      content: `{
  "data": [
    {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "species": "setosa"},
    {"sepal_length": 4.9, "sepal_width": 3.0, "petal_length": 1.4, "species": "setosa"},
    {"sepal_length": 7.0, "sepal_width": 3.2, "petal_length": 4.7, "species": "versicolor"}
  ],
  "columns": ["sepal_length", "sepal_width", "petal_length", "petal_width", "species"],
  "rows": 150
}`,
      metadata: {
        format: 'JSON',
        rows: 150,
        columns: 5,
        size: '8.2 KB',
      }
    }
  },
  {
    id: 'media',
    name: 'Media',
    icon: Image,
    description: 'Images, videos, audio files',
    example: {
      title: 'Neural Network Architecture Diagram',
      content: `📷 Image: neural-network-architecture.png

Alt text: A diagram showing a simple feedforward neural network with:
- Input layer (3 nodes)
- Hidden layer 1 (4 nodes)
- Hidden layer 2 (4 nodes)
- Output layer (2 nodes)

All nodes are fully connected between layers.`,
      metadata: {
        type: 'Image',
        format: 'PNG',
        dimensions: '1200x800',
        size: '245 KB',
      }
    }
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: Music,
    description: 'Voice notes, interviews, ambient audio',
    example: {
      title: 'Interview Clip with Summary',
      content: `🎤 Audio: product-interview-snippet.webm

Transcript snippet:
- Focus on collaborative features for remote teams
- Pain point: merging handwritten notes with digital strands
- Follow-up needed for beta access requests

Metadata:
Duration: 02:45
Language: English (US)
Speakers detected: 2`,
      metadata: {
        format: 'WEBM',
        duration: '2m 45s',
        transcript: 'Available',
        sentiment: 'Positive leaning',
      },
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: Code,
    description: 'Source code, notebooks, scripts',
    example: {
      title: 'Simple Neural Network Implementation',
      content: `import numpy as np
import tensorflow as tf
from tensorflow import keras

# Define the model
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation='softmax')
])

# Compile the model
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)`,
      metadata: {
        language: 'Python',
        framework: 'TensorFlow',
        lines: 15,
        dependencies: ['numpy', 'tensorflow'],
      }
    }
  },
];

export function StrandExamples() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Any Content Becomes a Strand
          </h2>
          <p className="text-lg text-muted-foreground">
            Import any type of content and transform it into interconnected knowledge. 
            Each strand carries metadata, relationships, and learning context.
          </p>
        </div>

        <Tabs defaultValue="document" className="mx-auto max-w-5xl">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {strandTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger
                  key={type.id}
                  value={type.id}
                  className={cn(
                    'gap-2 text-xs sm:text-sm',
                    'data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{type.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {strandTypes.map((type) => (
            <TabsContent key={type.id} value={type.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <type.icon className="h-5 w-5 text-primary" />
                        {type.example.title}
                      </CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Strand</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Content preview */}
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {type.example.content}
                    </pre>
                  </div>

                  {/* Metadata */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Metadata</h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Object.entries(type.example.metadata).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-border/50 bg-background p-3">
                          <div className="text-xs text-muted-foreground">{key}</div>
                          <div className="mt-1 text-sm font-medium">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relationships preview */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">Automatic Relationships:</span>
                      <span className="text-muted-foreground">
                        Connected to 5 related strands • Part of 2 collections • Referenced by 3 other strands
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Additional content types */}
        <div className="mt-12 rounded-2xl bg-muted/30 p-8">
          <h3 className="mb-6 text-center text-xl font-semibold">More Strand Types Coming Soon</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Brain, name: 'Quiz', description: 'Interactive assessments' },
              { icon: Calendar, name: 'Event', description: 'Time-based content' },
              { icon: Video, name: 'Course', description: 'Structured learning paths' },
              { icon: BookOpen, name: 'Reference', description: 'External resources' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/60 p-4"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
