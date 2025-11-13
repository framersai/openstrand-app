'use client';

import { useState } from 'react';
import { Upload, GitBranch, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFeatureFlags } from '@/lib/feature-flags';

export function ProjectImportWizard() {
  const { isTeamEdition } = useFeatureFlags();
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [projectName, setProjectName] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasSavedToken, setHasSavedToken] = useState<boolean>(false);
  const [savedTokenUpdatedAt, setSavedTokenUpdatedAt] = useState<string | null>(null);
  const [useSavedToken, setUseSavedToken] = useState<boolean>(true);
  const [savingToken, setSavingToken] = useState<boolean>(false);
  const [zipBusy, setZipBusy] = useState(false);

  const refreshSavedToken = async () => {
    try {
      const res = await fetch('/api/v1/integrations/github/token');
      if (!res.ok) return;
      const body = await res.json();
      setHasSavedToken(!!body?.data?.hasToken);
      setSavedTokenUpdatedAt(body?.data?.updatedAt ?? null);
    } catch {}
  };

  // Load token presence
  React.useEffect(() => {
    refreshSavedToken();
  }, []);

  const submitRepo = async () => {
    try {
      setBusy(true);
      setMessage(null);
      const payload: any = { repoUrl, branch: branch || undefined, projectName: projectName || undefined };
      if (isTeamEdition && authToken.trim() && !useSavedToken) {
        payload.authToken = authToken.trim();
      }
      const res = await fetch('/api/v1/submissions/import-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setMessage(body?.message || 'Import accepted');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveToken = async () => {
    try {
      setSavingToken(true);
      setMessage(null);
      if (!isTeamEdition) {
        throw new Error('Teams/Enterprise feature');
      }
      if (!authToken.trim()) {
        throw new Error('Enter a token to save');
      }
      const res = await fetch('/api/v1/integrations/github/token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: authToken.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setMessage('Token saved');
      setAuthToken('');
      await refreshSavedToken();
      setUseSavedToken(true);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSavingToken(false);
    }
  };

  const clearToken = async () => {
    try {
      setSavingToken(true);
      setMessage(null);
      const res = await fetch('/api/v1/integrations/github/token', { method: 'DELETE' });
      await res.json().catch(() => ({}));
      await refreshSavedToken();
      setUseSavedToken(false);
      setMessage('Token cleared');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSavingToken(false);
    }
  };

  const submitObsidianZip = async (file: File | null) => {
    if (!file) return;
    try {
      setZipBusy(true);
      setMessage(null);
      const fd = new FormData();
      fd.append('file', file, file.name);
      const res = await fetch('/api/v1/submissions/import-obsidian', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setMessage(body?.message || 'Obsidian import accepted');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setZipBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Import Obsidian vault (zip)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload a zipped Obsidian vault to map notes and attachments into strands. Folder hierarchy and frontmatter are preserved.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".zip"
              onChange={(e) => submitObsidianZip(e.target.files?.[0] ?? null)}
              disabled={zipBusy}
            />
            <Button variant="outline" size="sm" disabled>
              {zipBusy ? 'Uploading…' : 'Choose zip'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Import repository (URL)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Repository URL</Label>
            <Input placeholder="https://github.com/org/repo.git" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Branch (optional)</Label>
              <Input placeholder="main" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Project name (optional)</Label>
              <Input placeholder="Knowledge Base" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Personal Access Token (Teams/Enterprise)
            </Label>
            <Input
              type="password"
              placeholder={isTeamEdition ? 'ghp_… (saved encrypted; optional per-repo override)' : 'Available in Teams/Enterprise'}
              disabled={!isTeamEdition || (useSavedToken && hasSavedToken)}
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Token is masked and never shown in responses. For Community Edition, public repos only.
            </p>
            {isTeamEdition ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={useSavedToken && hasSavedToken}
                    onChange={(e) => setUseSavedToken(e.target.checked && hasSavedToken)}
                  />
                  Use saved GitHub token {hasSavedToken ? `(updated ${savedTokenUpdatedAt ? new Date(savedTokenUpdatedAt).toLocaleString() : ''})` : '(not set)'}
                </label>
                <Button size="xs" variant="outline" onClick={saveToken} disabled={savingToken || !authToken.trim()}>
                  Save token
                </Button>
                <Button size="xs" variant="ghost" onClick={clearToken} disabled={savingToken || !hasSavedToken}>
                  Clear saved
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={submitRepo} disabled={busy || !repoUrl.trim()}>
              {busy ? 'Submitting…' : 'Queue import'}
            </Button>
            {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


