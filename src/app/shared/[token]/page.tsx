'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lock, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { OpenStrandLogo } from '@/components/icons/OpenStrandLogo';

interface SharedResource {
  resource_type: string;
  resource_id: string;
  requires_password: boolean;
}

export default function SharedPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<SharedResource | null>(null);
  const [password, setPassword] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [resourceData, setResourceData] = useState<any>(null);

  const loadResource = useCallback(async (type: string, id: string) => {
    try {
      if (type === 'strand') {
        const response = await api.get(`/strands/${id}`);
        setResourceData(response.data);
      }
    } catch (err) {
      setError('Failed to load resource data');
    }
  }, []);

  const checkAccess = useCallback(async (withPassword?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get resource info
      const infoResponse = await api.get(`/access/shared/${token}`);
      setResource(infoResponse.data);
      
      // Check access
      const accessResponse = await fetch(`${api['baseUrl'] ?? ''}/access/${infoResponse.data.resource_type}/${infoResponse.data.resource_id}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Share-Token': token,
        },
        body: JSON.stringify({ password: withPassword }),
      }).then(res => res.json());
      
      if (accessResponse?.data?.has_access || accessResponse?.has_access) {
        setHasAccess(true);
        await loadResource(infoResponse.data.resource_type, infoResponse.data.resource_id);
      } else if (accessResponse?.data?.requires_password || accessResponse?.requires_password) {
        setHasAccess(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Invalid share link');
      } else if (err.response?.status === 410) {
        setError('This share link has expired');
      } else if (err.response?.status === 401) {
        setError('Incorrect password');
      } else {
        setError('Failed to load resource');
      }
    } finally {
      setLoading(false);
    }
  }, [loadResource, token]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void checkAccess(password);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <OpenStrandLogo size="lg" />
            </div>
            <CardTitle className="text-center text-destructive">
              <AlertCircle className="mx-auto mb-2 h-8 w-8" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resource?.requires_password && !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <OpenStrandLogo size="lg" />
            </div>
            <CardTitle className="text-center">
              <Lock className="mx-auto mb-2 h-8 w-8" />
              Password Required
            </CardTitle>
            <CardDescription className="text-center">
              This content is password protected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!password}>
                Access Content
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasAccess && resourceData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <OpenStrandLogo size="sm" />
              <span className="font-semibold">OpenStrand</span>
              <Badge variant="outline">Shared</Badge>
            </div>
            <Button asChild variant="outline">
              <a href="https://openstrand.com" target="_blank" rel="noopener noreferrer">
                Learn More
              </a>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto p-4 py-8">
          {resource.resource_type === 'strand' && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{resourceData.title}</CardTitle>
                    <CardDescription>
                      {resourceData.type} • Created {new Date(resourceData.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert">
                  {resourceData.content_preview || resourceData.content}
                </div>
                
                {resourceData.tags && resourceData.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resourceData.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

  return null;
}
