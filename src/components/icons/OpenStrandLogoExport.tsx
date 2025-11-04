/**
 * OpenStrand Logo Export Component
 * Provides exportable versions of the OpenStrand logo in various formats
 * Can be used to generate PNG, SVG, and other formats
 */

import { OpenStrandLogo, OpenStrandIcon } from './OpenStrandLogo';

interface LogoExportProps {
  format?: 'svg' | 'component';
  variant?: 'default' | 'mono' | 'gradient' | 'icon';
  size?: number;
  background?: boolean;
  padding?: number;
}

/**
 * Exportable OpenStrand Logo
 * Returns SVG string or React component based on format
 */
export function OpenStrandLogoExport({ 
  format = 'svg',
  variant = 'default',
  size = 512,
  background = false,
  padding = 0
}: LogoExportProps) {
  const viewBoxSize = 100 + (padding * 2);
  const logoOffset = padding;
  
  // SVG content for different variants
  const getSvgContent = () => {
    const bgColor = background ? '#ffffff' : 'none';
    const primaryColor = '#3b82f6'; // Blue
    const secondaryColor = '#10b981'; // Emerald
    const strokeColor = variant === 'mono' ? '#000000' : primaryColor;
    
    if (variant === 'icon') {
      // Simplified icon version
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          ${background ? `<rect width="24" height="24" fill="${bgColor}"/>` : ''}
          <g stroke="${strokeColor}" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M6,6 Q12,9 18,6 Q18,12 12,12 Q6,12 6,18 Q12,15 18,18" />
            <path d="M4,9 Q12,12 20,9" opacity="0.5" />
            <path d="M4,15 Q12,12 20,15" opacity="0.5" />
          </g>
          <g fill="${strokeColor}">
            <circle cx="6" cy="6" r="1.5" />
            <circle cx="18" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="6" cy="18" r="1.5" />
            <circle cx="18" cy="18" r="1.5" />
          </g>
        </svg>
      `;
    }
    
    // Full logo version
    const gradientDef = variant === 'gradient' ? `
      <defs>
        <linearGradient id="export-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="${primaryColor}" />
          <stop offset="100%" stopColor="${secondaryColor}" />
        </linearGradient>
      </defs>
    ` : '';
    
    const strokeAttr = variant === 'gradient' ? 'url(#export-gradient)' : strokeColor;
    const fillAttr = variant === 'gradient' ? 'url(#export-gradient)' : strokeColor;
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" xmlns="http://www.w3.org/2000/svg">
        ${gradientDef}
        ${background ? `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${bgColor}"/>` : ''}
        <g transform="translate(${logoOffset}, ${logoOffset})">
          <g fill="none" stroke="${strokeAttr}" strokeWidth="3" strokeLinecap="round">
            <path d="M30,25 Q50,35 70,25 Q70,50 50,50 Q30,50 30,75 Q50,65 70,75" />
            <path d="M25,35 Q50,45 75,35" opacity="0.6" />
            <path d="M25,65 Q50,55 75,65" opacity="0.6" />
          </g>
          <g fill="${fillAttr}">
            <circle cx="30" cy="25" r="4" />
            <circle cx="70" cy="25" r="4" />
            <circle cx="50" cy="50" r="5" />
            <circle cx="30" cy="75" r="4" />
            <circle cx="70" cy="75" r="4" />
          </g>
        </g>
      </svg>
    `;
  };
  
  if (format === 'svg') {
    return getSvgContent();
  }
  
  // Return as component
  if (variant === 'icon') {
    return <OpenStrandIcon size={size} />;
  }
  
  return <OpenStrandLogo size="xl" variant={variant as any} />;
}

/**
 * Utility function to download logo as SVG
 */
export function downloadLogoAsSvg(
  filename: string = 'openstrand-logo.svg',
  options: Omit<LogoExportProps, 'format'> = {}
) {
  const svgContent = OpenStrandLogoExport({ ...options, format: 'svg' }) as string;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Utility function to convert logo to PNG (requires canvas)
 */
export async function downloadLogoAsPng(
  filename: string = 'openstrand-logo.png',
  options: Omit<LogoExportProps, 'format'> = {}
) {
  const svgContent = OpenStrandLogoExport({ ...options, format: 'svg' }) as string;
  const size = options.size || 512;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;
  
  // Create image from SVG
  const img = new Image();
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
        resolve(undefined);
      }, 'image/png');
    };
    img.src = url;
  });
}

/**
 * Get logo as data URL for embedding
 */
export function getLogoDataUrl(options: Omit<LogoExportProps, 'format'> = {}): string {
  const svgContent = OpenStrandLogoExport({ ...options, format: 'svg' }) as string;
  const encoded = btoa(svgContent);
  return `data:image/svg+xml;base64,${encoded}`;
}
