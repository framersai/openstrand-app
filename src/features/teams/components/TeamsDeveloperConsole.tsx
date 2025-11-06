import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Shield, Terminal, Link as LinkIcon, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TeamApiTokenManager } from './TeamApiTokenManager';
import { openstrandAPI } from '@/services/openstrand.api';

const FALLBACK_DEVELOPER_INFO = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, ''),
  swaggerUrl: process.env.NEXT_PUBLIC_API_DOCS_URL
    ? `${process.env.NEXT_PUBLIC_API_DOCS_URL.replace(/\/$/, '')}/docs`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1$/, '/docs'),
  sdkDocsUrl:
    process.env.NEXT_PUBLIC_SDK_DOCS_URL ||
    'https://github.com/framersai/openstrand/tree/main/docs/generated',
  frameSiteUrl: 'https://frame.dev',
  teamPortalUrl: 'https://frame.dev/contact',
};

export function TeamsDeveloperConsole() {
  const [developerInfo, setDeveloperInfo] = useState(FALLBACK_DEVELOPER_INFO);
  const baseUrl = developerInfo.apiBaseUrl;

  useEffect(() => {
    let isMounted = true;
    void openstrandAPI.meta
      .developer()
      .then((data) => {
        if (!isMounted || !data) return;
        setDeveloperInfo({
          apiBaseUrl: (data.apiBaseUrl ?? FALLBACK_DEVELOPER_INFO.apiBaseUrl).replace(/\/$/, ''),
          swaggerUrl: data.swaggerUrl ?? FALLBACK_DEVELOPER_INFO.swaggerUrl,
          sdkDocsUrl: data.sdkDocsUrl ?? FALLBACK_DEVELOPER_INFO.sdkDocsUrl,
          frameSiteUrl: data.frameSiteUrl ?? FALLBACK_DEVELOPER_INFO.frameSiteUrl,
          teamPortalUrl: data.teamPortalUrl ?? FALLBACK_DEVELOPER_INFO.teamPortalUrl,
        });
      })
      .catch(() => {
        // keep fallback values silently
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sampleRequest = useMemo(
    () => `fetch('${baseUrl}/strands', {
  headers: {
    'Authorization': 'Bearer <team token>',
    'Content-Type': 'application/json'
  }
})
  .then((response) => response.json())
  .then(console.log);
`,
    [baseUrl],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-6 rounded-3xl border border-border/70 bg-card/80 p-8 shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Shield className="h-3.5 w-3.5" /> Team & Enterprise exclusive
          </div>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Production-ready API gateway for your OpenStrand workspace
          </h1>
          <p className="text-base text-muted-foreground">
            Query strands, publish weaves, orchestrate AI pipelines, and audit activity — all from the same endpoint your team already uses. Every request is rate limited, cached, and backed by token-level audit logs.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">Base URL</Badge>
            <code className="rounded-full bg-muted/60 px-3 py-1 font-mono text-xs text-foreground/80">
              {baseUrl}
            </code>
            <Badge variant="outline" className="gap-2">
              <Terminal className="h-3 w-3" /> 100% OpenAPI, auto-generated nightly
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="sm" className="gap-2">
              <Link href={developerInfo.swaggerUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> View live OpenAPI explorer
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/docs/API_REFERENCE" target="_blank" rel="noreferrer">
                <LinkIcon className="h-4 w-4" /> Markdown reference
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2 text-foreground/80">
              <Link href={developerInfo.frameSiteUrl} target="_blank" rel="noreferrer">
                <ArrowRight className="h-4 w-4" /> Explore Frame.dev
              </Link>
            </Button>
          </div>
        </div>
        <Card className="border-border/70 bg-background/90">
          <CardHeader>
            <CardTitle className="text-lg">Quick start</CardTitle>
            <CardDescription>Authenticate with a team token or your session JWT.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-2xl bg-muted/70 p-4 text-xs text-muted-foreground">
              <code>{sampleRequest}</code>
            </pre>
            <Separator className="my-4" />
            <Alert variant="info">
              <AlertTitle>DX defaults</AlertTitle>
              <AlertDescription className="space-y-1 text-xs">
                <p>
                  • SDK typings ship in{' '}
                  <a className="text-primary hover:underline" href={developerInfo.sdkDocsUrl} target="_blank" rel="noreferrer">
                    docs/generated
                  </a>{' '}
                  after each build.
                </p>
                <p>• Requests from the in-app explorer include the current session automatically.</p>
                <p>• Add <code className="rounded bg-muted/50 px-1 py-0.5">X-API-Token</code> to switch to a scoped team token.</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      <TeamApiTokenManager />

      <section className="grid gap-6 rounded-3xl border border-border/70 bg-card/50 p-8 shadow-xl lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Live API playground</h2>
          <p className="text-sm text-muted-foreground">
            Explore every endpoint in real-time. Team tokens automatically populate the <code className="rounded bg-muted/50 px-1 py-0.5">Authorization</code> header so you can iterate faster without copying secrets around.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Full-text strand search and semantic embeddings</li>
            <li>Knowledge graph traversal, clustering, and ToC automation</li>
            <li>AI Artisan visualizations with cost tracking metadata</li>
            <li>Webhook templates (coming soon) for publishing back into CMSes</li>
          </ul>
        </div>
        <div className="h-[420px] overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-inner">
          <iframe
            title="OpenStrand API Explorer"
            src={developerInfo.swaggerUrl}
            className="h-full w-full"
            loading="lazy"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10 p-6 text-sm text-primary-foreground shadow-lg">
        <div className="flex flex-col gap-3 text-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Need integration support?</h3>
            <p className="text-sm text-foreground/80">
              The Frame.dev team offers optional installation and architecture sessions for every Team license.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2 border-primary/60 text-primary">
            <Link href={developerInfo.teamPortalUrl} target="_blank" rel="noreferrer">
              Talk to Frame.dev <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

