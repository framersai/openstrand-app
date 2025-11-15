'use client';

import { useEffect, useRef, useState } from 'react';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI, ExcalidrawElement } from '@excalidraw/excalidraw/types/types';
import { Card } from '@/components/ui/card';

interface DoodlePadProps {
  initialData?: any;
  onChange?: (data: any) => void;
  height?: number;
}

export default function DoodlePad({ initialData, onChange, height = 400 }: DoodlePadProps) {
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (initialData && excalidrawRef.current) {
      try {
        excalidrawRef.current.updateScene({
          elements: initialData.elements || [],
          appState: initialData.appState || {},
        });
      } catch (error) {
        console.error('Failed to load doodle data:', error);
      }
    }
  }, [initialData]);

  const handleChange = (elements: readonly ExcalidrawElement[], appState: any) => {
    if (onChange) {
      onChange({
        elements: elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
          currentItemFillStyle: appState.currentItemFillStyle,
          currentItemStrokeWidth: appState.currentItemStrokeWidth,
          currentItemRoughness: appState.currentItemRoughness,
          currentItemOpacity: appState.currentItemOpacity,
        },
      });
    }
  };

  if (!isClient) {
    return (
      <Card className="flex items-center justify-center bg-muted" style={{ height }}>
        <p className="text-muted-foreground">Loading doodle pad...</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" style={{ height }}>
      <Excalidraw
        ref={excalidrawRef}
        onChange={handleChange}
        initialData={initialData}
        theme="light"
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: { saveFileToDisk: true },
            toggleTheme: true,
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.HelpHint />
        </WelcomeScreen>
      </Excalidraw>
    </Card>
  );
}

