'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import {
  Github,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
  ChevronRight,
  Globe,
  Shield,
  BookOpen,
  Users,
  Briefcase,
  Code2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { Newsletter } from '@/components/footer/newsletter';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAppMode } from '@/hooks/useAppMode';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';
import { GitHubStats } from '@/components/github/GitHubStats';
import { Badge } from '@/components/ui/badge';

type FooterSectionKey = 'product' | 'company' | 'resources' | 'support' | 'legal';

const footerSections: Array<{
  key: FooterSectionKey;
  icon: React.ComponentType<{ className?: string }>;
  links: Array<{
    key: string;
    href: string;
    external?: boolean;
    badge?: string;
  }>;
}> = [
  {
    key: 'product',
    icon: Code2,
    links: [
      { key: 'features', href: '#features' },
      { key: 'pricing', href: '#pricing' },
      { key: 'api', href: 'https://github.com/framersai/openstrand-sdk', external: true },
      { key: 'changelog', href: '/changelog' },
    ],
  },
  {
    key: 'resources',
    icon: BookOpen,
    links: [
      { key: 'docs', href: '/docs', badge: 'Open' },
      { key: 'github', href: 'https://github.com/framersai/openstrand', external: true },
      { key: 'guides', href: '/guides' },
      { key: 'blog', href: '/blog' },
      { key: 'community', href: 'https://discord.gg/framersai', external: true },
    ],
  },
  {
    key: 'company',
    icon: Briefcase,
    links: [
      { key: 'about', href: '/about' },
      { key: 'team', href: '/team' },
      { key: 'careers', href: '/careers' },
      { key: 'contact', href: '/contact' },
    ],
  },
  {
    key: 'support',
    icon: Users,
    links: [
      { key: 'help', href: '/help' },
      { key: 'faq', href: '/faq' },
      { key: 'status', href: 'https://status.openstrand.ai', external: true },
      { key: 'security', href: '/security' },
    ],
  },
  {
    key: 'legal',
    icon: Shield,
    links: [
      { key: 'privacy', href: '/privacy' },
      { key: 'terms', href: '/terms' },
      { key: 'cookies', href: '/cookies' },
      { key: 'license', href: '/license' },
    ],
  },
];

const socialLinks = [
  { key: 'github', href: 'https://github.com/framersai/openstrand', icon: Github },
  { key: 'discord', href: 'https://discord.gg/framersai', icon: MessageCircle },
  { key: 'twitter', href: 'https://twitter.com/framersai', icon: Twitter },
  { key: 'linkedin', href: 'https://linkedin.com/company/framersai', icon: Linkedin },
  { key: 'youtube', href: 'https://youtube.com/@framersai', icon: Youtube },
] as const;

// Certifications for future compliance badges
// const _certifications = [
//   { key: 'soc2', image: '/images/certs/soc2.png' },
//   { key: 'gdpr', image: '/images/certs/gdpr.png' },
//   { key: 'iso27001', image: '/images/certs/iso27001.png' },
//   { key: 'hipaa', image: '/images/certs/hipaa.png' },
// ] as const;

// Section accent classes for future gradient customization
// const _sectionAccentClasses = [
//   'from-primary/20 to-primary/0',
//   'from-emerald/20 to-emerald/0',
//   'from-purple/20 to-purple/0',
//   'from-blue/20 to-blue/0',
//   'from-amber/20 to-amber/0',
// ] as const;

const bottomLinks = [
  { key: 'privacy', href: '/privacy' },
  { key: 'terms', href: '/terms' },
  { key: 'cookies', href: '/cookies' },
  { key: 'sitemap', href: '/sitemap.xml', external: true },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  const tFooter = useTranslations('footer');
  const localizePath = useLocalizedPath();
  const { mode } = useAppMode();

  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-background to-background/95">
      <div className="border-b border-border/30">
        <Newsletter />
      </div>

      <div className="border-b border-border/20 bg-primary/5">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-6 text-sm text-primary/90 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" />
            <span>
              Built by{' '}
              <a className="font-semibold underline-offset-4 hover:underline" href="https://frame.dev" target="_blank" rel="noreferrer">
                Frame.dev
              </a>{' '}
              — full-service AI + visualization studio.
            </span>
          </div>
          <Link
            href="https://frame.dev/contact"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-primary/50 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            Talk to the Frame team <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Main footer grid */}
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Company info - takes 1 column */}
          <div className="lg:col-span-1">
            <Link href={localizePath('/')} className="mb-6 flex items-center gap-3">
              <OpenStrandLogo size="lg" />
              <div>
                <h3 className="text-xl font-bold tracking-tight">OpenStrand</h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Free • Open Source</p>
                  <Badge variant="outline" className="h-5 border-emerald-400/50 bg-emerald-50/50 px-1.5 text-[10px] text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                    MIT
                  </Badge>
                </div>
              </div>
            </Link>

            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Build your personal knowledge management system with AI-enhanced features.
              100% open source, works offline, and respects your privacy.
            </p>

            <div className="mb-6">
              <GitHubStats showLabels />
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/10"
                  aria-label={tFooter(`social.${link.key}`)}
                >
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg opacity-0 transition-opacity group-hover:opacity-100" />
                  <link.icon className="relative h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <ThemeSwitcher buttonVariant="ghost" buttonSize="icon" tooltip="Select theme palette" />
              <LanguageSwitcher variant="compact" showName={false} />
            </div>
          </div>

          {/* Links sections - takes 3 columns */}
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:col-span-3 lg:grid-cols-5">
            {footerSections.map((section) => (
              <div key={section.key} className="space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                <section.icon className="h-4 w-4 text-primary" />
                {tFooter(`sections.${section.key}.title`)}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const isExternal = Boolean(link.external || link.href.startsWith('http'));
                  const href = isExternal ? link.href : localizePath(link.href);

                  return (
                    <li key={link.key}>
                      <Link
                        href={href}
                        className="group flex items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                      >
                        <ChevronRight className="h-3 w-3 -ml-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100" />
                        {tFooter(`sections.${section.key}.links.${link.key}`)}
                        {link.badge && (
                          <Badge variant="secondary" className="ml-2 h-4 px-1 py-0 text-[9px]">
                            {link.badge}
                          </Badge>
                        )}
                        {isExternal && <Globe className="ml-1 h-3 w-3 opacity-50" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          </div>
        </div>

        <div className="mb-8 border-t border-border/30 pt-8">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold">
              <Code2 className="h-5 w-5 text-primary" />
              Open Source Stack
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a 
                href="https://github.com/framersai/openstrand" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
              >
                <Github className="h-4 w-4" />
                <span>openstrand-app</span>
                <Badge variant="outline" className="ml-1">MIT</Badge>
              </a>
              <a 
                href="https://github.com/framersai/openstrand-sdk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
              >
                <Github className="h-4 w-4" />
                <span>openstrand-sdk</span>
                <Badge variant="outline" className="ml-1">MIT</Badge>
              </a>
              <a 
                href="https://github.com/framersai/openstrand-backend" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
              >
                <Github className="h-4 w-4" />
                <span>openstrand-backend</span>
                <Badge variant="outline" className="ml-1">MIT</Badge>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground md:flex-row">
            <div className="flex items-center gap-1">
              <span>&copy; {year}</span>
              <span>Frame.dev / OpenStrand.</span>
              <span>{tFooter('bottom.rights')}</span>
              <span className="ml-2 text-emerald-600">• Free Forever</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {bottomLinks.map((link) => {
                const isExternal = Boolean(('external' in link && link.external) || link.href.startsWith('http'));
                const href = isExternal ? link.href : localizePath(link.href);
                return (
                  <Link
                    key={link.key}
                    href={href}
                    className="hover:text-primary"
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                  >
                    {tFooter(`bottom.${link.key}`)}
                  </Link>
                );
              })}
            </div>
            <div className="text-center text-xs text-muted-foreground md:text-right">
              {tFooter('bottom.teamAttribution')}
            </div>
          </div>
        </div>
      </div>

      {mode === 'offline' ? (
        <div className="border-t border-border/20 bg-background/50 py-2">
          <div className="container mx-auto px-4">
            <p className="text-center text-xs text-muted-foreground">
              {tFooter('newsletterOfflineCta')}
            </p>
          </div>
        </div>
      ) : null}
    </footer>
  );
}


