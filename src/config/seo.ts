import marketingRoutesConfig from './marketing-routes.json';

export interface RouteMetadata {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  structuredData?: Array<Record<string, unknown>>;
}

export const siteMetadata = {
  siteName: 'OpenStrand',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://openstrand.ai',
  defaultAuthor: 'Frame.dev (Manic Agency LLC)',
  defaultTwitterHandle: '@framersai',
  defaultImage: '/images/og-default.png',
};

export const marketingRoutes: RouteMetadata[] = marketingRoutesConfig;

export function getRouteMetadata(pathname: string): RouteMetadata | null {
  return marketingRoutes.find((route) => route.path === pathname) ?? null;
}
