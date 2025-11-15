'use client';

/**
 * @module GalleryPage
 * @description Public gallery for browsing flashcards and quizzes
 */

import React from 'react';
import { GalleryView } from '@/components/learning/GalleryView';

export default function GalleryPage() {
  return (
    <div className="min-h-screen">
      <GalleryView />
    </div>
  );
}


