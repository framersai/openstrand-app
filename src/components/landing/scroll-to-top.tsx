'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg transition-all hover:from-cyan-700 hover:to-teal-700 hover:shadow-xl',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-10 opacity-0'
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}