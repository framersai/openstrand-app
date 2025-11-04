/**
 * Logo Showcase Component
 * Demonstrates all logo variants and provides download functionality
 * This can be used in a settings page or brand assets page
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  OpenStrandLogo, 
  OpenStrandIcon,
  downloadLogoAsSvg,
  downloadLogoAsPng 
} from '@/components/icons';
import { Download } from 'lucide-react';

export function LogoShowcase() {
  const variants = [
    { key: 'default', label: 'Default', description: 'Primary brand colors' },
    { key: 'mono', label: 'Monochrome', description: 'Single color for print' },
    { key: 'gradient', label: 'Gradient', description: 'Premium feel' },
  ] as const;

  const handleDownloadSvg = (variant: string) => {
    downloadLogoAsSvg(`openstrand-logo-${variant}.svg`, {
      variant: variant as any,
      size: 512,
      background: false
    });
  };

  const handleDownloadPng = async (variant: string, size: number = 512) => {
    await downloadLogoAsPng(`openstrand-logo-${variant}-${size}.png`, {
      variant: variant as any,
      size,
      background: true,
      padding: 10
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">OpenStrand Logo Assets</h2>
        <p className="text-muted-foreground">
          Download official OpenStrand logos in various formats for your needs.
        </p>
      </div>

      {/* Logo Variants */}
      <div className="grid gap-6 md:grid-cols-3">
        {variants.map((variant) => (
          <Card key={variant.key}>
            <CardHeader>
              <CardTitle className="text-lg">{variant.label}</CardTitle>
              <CardDescription>{variant.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center py-8 bg-muted/30 rounded-lg">
                <OpenStrandLogo size="xl" variant={variant.key as any} />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadSvg(variant.key)}
                  className="w-full"
                >
                  <Download className="mr-2 h-3 w-3" />
                  Download SVG
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPng(variant.key, 512)}
                  >
                    PNG 512px
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPng(variant.key, 256)}
                  >
                    PNG 256px
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Icon Version */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Icon Version</CardTitle>
          <CardDescription>Simplified icon for small sizes and favicons</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-8 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-muted/30 rounded">
                <OpenStrandIcon size={16} />
              </div>
              <span className="text-xs text-muted-foreground">16px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-muted/30 rounded">
                <OpenStrandIcon size={24} />
              </div>
              <span className="text-xs text-muted-foreground">24px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-muted/30 rounded">
                <OpenStrandIcon size={32} />
              </div>
              <span className="text-xs text-muted-foreground">32px</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-muted/30 rounded">
                <OpenStrandIcon size={48} />
              </div>
              <span className="text-xs text-muted-foreground">48px</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadLogoAsSvg('openstrand-icon.svg', {
                variant: 'icon',
                size: 24
              })}
            >
              <Download className="mr-2 h-3 w-3" />
              Download Icon SVG
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadLogoAsPng('openstrand-icon-32.png', {
                variant: 'icon',
                size: 32,
                background: true
              })}
            >
              <Download className="mr-2 h-3 w-3" />
              Download Icon PNG
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <ul>
            <li>Use the full logo when space permits</li>
            <li>Use the icon version for sizes below 48px</li>
            <li>Maintain clear space around the logo equal to the height of one node</li>
            <li>Don't distort, rotate, or modify the logo</li>
            <li>Use monochrome version for single-color printing</li>
            <li>Gradient version is preferred for digital premium contexts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
