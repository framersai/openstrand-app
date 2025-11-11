import { useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

// Comprehensive breakpoints for all device types
export const breakpoints = {
  xs: 320,    // Small phones (iPhone SE, etc)
  sm: 375,    // Standard phones
  md: 640,    // Large phones / small tablets portrait
  lg: 768,    // Tablets portrait / small laptops
  xl: 1024,   // Tablets landscape / laptops
  '2xl': 1280, // Desktop
  '3xl': 1536, // Large desktop
  '4xl': 1920, // Full HD
  '5xl': 2560  // 4K and ultra-wide
} as const;

// Device-specific presets
export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveConfig {
  deviceType: DeviceType;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
  isTouch: boolean;
  pixelRatio: number;
}

export interface ResponsiveLayoutConfig {
  gridColumns: number;
  sidebarWidth: string;
  sidebarBehavior: 'overlay' | 'push' | 'fixed';
  headerHeight: string;
  spacing: 'compact' | 'normal' | 'relaxed';
  fontSize: 'small' | 'normal' | 'large';
  touchTargetSize: 'small' | 'normal' | 'large';
}

// Intelligent layout configurations per device type
const deviceLayouts: Record<DeviceType, ResponsiveLayoutConfig> = {
  phone: {
    gridColumns: 1,
    sidebarWidth: '100%',
    sidebarBehavior: 'overlay',
    headerHeight: '3.5rem',
    spacing: 'compact',
    fontSize: 'small',
    touchTargetSize: 'large'
  },
  tablet: {
    gridColumns: 2,
    sidebarWidth: '320px',
    sidebarBehavior: 'overlay',
    headerHeight: '4rem',
    spacing: 'normal',
    fontSize: 'normal',
    touchTargetSize: 'large'
  },
  laptop: {
    gridColumns: 2,
    sidebarWidth: '320px',
    sidebarBehavior: 'push',
    headerHeight: '4rem',
    spacing: 'normal',
    fontSize: 'normal',
    touchTargetSize: 'normal'
  },
  desktop: {
    gridColumns: 3,
    sidebarWidth: '384px',
    sidebarBehavior: 'fixed',
    headerHeight: '4rem',
    spacing: 'normal',
    fontSize: 'normal',
    touchTargetSize: 'small'
  },
  ultrawide: {
    gridColumns: 4,
    sidebarWidth: '448px',
    sidebarBehavior: 'fixed',
    headerHeight: '4.5rem',
    spacing: 'relaxed',
    fontSize: 'large',
    touchTargetSize: 'small'
  }
};

// Adaptive grid column calculations
function getAdaptiveGridColumns(width: number, baseColumns: number): number {
  if (width < breakpoints.sm) return 1;
  if (width < breakpoints.md) return Math.min(2, baseColumns);
  if (width < breakpoints.lg) return Math.min(2, baseColumns);
  if (width < breakpoints.xl) return Math.min(3, baseColumns);
  if (width < breakpoints['2xl']) return Math.min(3, baseColumns);
  return baseColumns;
}

export function useResponsiveLayout() {
  const [config, setConfig] = useState<ResponsiveConfig>({
    deviceType: 'desktop',
    orientation: 'landscape',
    screenWidth: 1920,
    screenHeight: 1080,
    isTouch: false,
    pixelRatio: 1
  });

  // Media queries for all breakpoints
  const isXs = useMediaQuery(`(max-width: ${breakpoints.xs}px)`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.xs}px) and (max-width: ${breakpoints.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints['2xl']}px)`);
  const is3xl = useMediaQuery(`(min-width: ${breakpoints['2xl']}px) and (max-width: ${breakpoints['3xl']}px)`);
  const is4xl = useMediaQuery(`(min-width: ${breakpoints['3xl']}px) and (max-width: ${breakpoints['4xl']}px)`);
  const is5xl = useMediaQuery(`(min-width: ${breakpoints['4xl']}px)`);

  // Orientation detection
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  // Touch detection
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');

  // High DPI detection
  const isHighDPI = useMediaQuery('(min-resolution: 2dppx)');

  // Device-specific queries
  const isIPhone = useMediaQuery('(max-device-width: 428px) and (-webkit-min-device-pixel-ratio: 2)');
  const isIPad = useMediaQuery('(min-device-width: 768px) and (max-device-width: 1366px) and (-webkit-min-device-pixel-ratio: 2)');
  const isAndroidPhone = useMediaQuery('(max-device-width: 640px) and (min-resolution: 2dppx)');
  const isAndroidTablet = useMediaQuery('(min-device-width: 600px) and (max-device-width: 1280px) and (min-resolution: 1.5dppx)');

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation: Orientation = width > height ? 'landscape' : 'portrait';
      
      // Determine device type intelligently
      let deviceType: DeviceType;
      if (width < breakpoints.md) {
        deviceType = 'phone';
      } else if (width < breakpoints.xl) {
        deviceType = orientation === 'portrait' ? 'tablet' : 'laptop';
      } else if (width < breakpoints['3xl']) {
        deviceType = 'desktop';
      } else {
        deviceType = 'ultrawide';
      }

      // Special handling for tablets
      if ((isIPad || isAndroidTablet) && width >= breakpoints.md) {
        deviceType = 'tablet';
      }

      setConfig({
        deviceType,
        orientation,
        screenWidth: width,
        screenHeight: height,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    updateConfig();
    window.addEventListener('resize', updateConfig);
    window.addEventListener('orientationchange', updateConfig);

    return () => {
      window.removeEventListener('resize', updateConfig);
      window.removeEventListener('orientationchange', updateConfig);
    };
  }, [isIPad, isAndroidTablet]);

  // Get responsive layout configuration
  const getResponsiveLayout = (customColumns?: number): ResponsiveLayoutConfig => {
    const baseLayout = deviceLayouts[config.deviceType];
    
    return {
      ...baseLayout,
      gridColumns: customColumns 
        ? getAdaptiveGridColumns(config.screenWidth, customColumns)
        : baseLayout.gridColumns
    };
  };

  // Responsive utilities
  const utils = {
    // Responsive spacing
    spacing: (base: number) => {
      const multipliers = {
        phone: 0.75,
        tablet: 0.875,
        laptop: 1,
        desktop: 1,
        ultrawide: 1.125
      };
      return Math.round(base * multipliers[config.deviceType]);
    },

    // Responsive font size
    fontSize: (base: number) => {
      const multipliers = {
        phone: 0.875,
        tablet: 0.9375,
        laptop: 1,
        desktop: 1,
        ultrawide: 1.125
      };
      return Math.round(base * multipliers[config.deviceType]);
    },

    // Touch target sizing
    touchTarget: () => {
      const sizes = {
        small: '32px',
        normal: '44px',
        large: '48px'
      };
      const layout = getResponsiveLayout();
      return sizes[layout.touchTargetSize];
    },

    // Container padding
    containerPadding: () => {
      const paddings = {
        phone: '1rem',
        tablet: '1.5rem',
        laptop: '2rem',
        desktop: '2rem',
        ultrawide: '3rem'
      };
      return paddings[config.deviceType];
    }
  };

  return {
    config,
    breakpoints: {
      isXs,
      isSm,
      isMd,
      isLg,
      isXl,
      is2xl,
      is3xl,
      is4xl,
      is5xl
    },
    device: {
      isPhone: config.deviceType === 'phone',
      isTablet: config.deviceType === 'tablet',
      isLaptop: config.deviceType === 'laptop',
      isDesktop: config.deviceType === 'desktop',
      isUltrawide: config.deviceType === 'ultrawide'
    },
    orientation: {
      isPortrait,
      isLandscape
    },
    features: {
      isTouch,
      isHighDPI,
      isIPhone,
      isIPad,
      isAndroidPhone,
      isAndroidTablet
    },
    getResponsiveLayout,
    utils
  };
}
