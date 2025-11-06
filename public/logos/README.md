# OpenStrand Logo Assets

This directory contains various versions of the OpenStrand logo for different use cases.

## Available Formats

### SVG (Scalable Vector Graphics)
- `openstrand-logo.svg` - Full color logo with weave pattern
- `openstrand-logo-mono.svg` - Monochrome version
- `openstrand-logo-gradient.svg` - Gradient version
- `openstrand-icon.svg` - Simplified icon version

### PNG (Portable Network Graphics)
Generated variants (light + dark) in 1024, 512, 256, 128, 64, 32 px:
- `logo-light-XXXX.png`
- `logo-dark-XXXX.png`
- `logo-mono-XXXX.png`
- `icon-light-XXXX.png`
- `icon-dark-XXXX.png`

### Usage Guidelines

1. **Web**: Use SVG format for best quality and scalability
2. **Print**: Use high-resolution PNG (512px) or SVG
3. **Social Media**: Use PNG format with appropriate size
4. **Favicon**: Use `openstrand-icon-16.png` or generate `.ico` file

## Logo Colors

- Primary Blue: `#3b82f6`
- Secondary Emerald: `#10b981`
- Monochrome: `#000000` (adjust for context)

## Generating New Formats

Use the automated export script which wraps the `OpenStrandLogoExport` helpers:

```bash
npm run brand:export
```

The script will:

1. Regenerate SVG + PNG variants for light/dark/mono/icon sets
2. Produce favicons + touch icons under `public/favicons`
3. Copy `favicon.ico` into `public/`
4. Generate a 1200x630 OG image at `public/images/og-default.png`

If you need to call the helpers manually:

```typescript
import { downloadLogoAsSvg, downloadLogoAsPng } from '@/components/icons/OpenStrandLogoExport';

// Download as SVG
downloadLogoAsSvg('my-logo.svg', { 
  variant: 'gradient',
  background: true,
  padding: 10
});

// Download as PNG
await downloadLogoAsPng('my-logo.png', {
  size: 1024,
  variant: 'default',
  background: true
});
```
