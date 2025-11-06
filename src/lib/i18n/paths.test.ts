import { describe, expect, it } from 'vitest';

import { buildLocalePath, replaceLocaleInPathname } from './paths';

describe('i18n path helpers', () => {
  it('builds locale-prefixed paths', () => {
    expect(buildLocalePath('en', '/')).toBe('/en');
    expect(buildLocalePath('fr', '/datasets')).toBe('/fr/datasets');
  });

  it('strips existing locale segments before rebuilding', () => {
    expect(buildLocalePath('es', '/en/billing')).toBe('/es/billing');
    expect(buildLocalePath('ja', '/fr/catalog/items?id=12#section')).toBe('/ja/catalog/items?id=12#section');
  });

  it('keeps external or special paths untouched', () => {
    expect(buildLocalePath('de', 'https://example.com')).toBe('https://example.com');
    expect(buildLocalePath('de', 'mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(buildLocalePath('de', '/api/datasets')).toBe('/api/datasets');
  });

  it('replaces locales inside existing pathnames', () => {
    expect(replaceLocaleInPathname('/en/datasets', 'pt')).toBe('/pt/datasets');
    expect(replaceLocaleInPathname('/datasets', 'fr')).toBe('/fr/datasets');
    expect(replaceLocaleInPathname('/', 'es')).toBe('/es');
  });
});
