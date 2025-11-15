'use client';

/**
 * @module ProductivityPage
 * @description Productivity analytics and tracking dashboard
 */

import React from 'react';
import { ProductivityDashboard } from '@/components/productivity/ProductivityDashboard';

export default function ProductivityPage() {
  return (
    <div className="min-h-screen bg-background">
      <ProductivityDashboard />
    </div>
  );
}


