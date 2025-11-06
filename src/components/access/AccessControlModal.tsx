'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Globe, Lock, Link, Users, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '@/services/api';

interface AccessControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: string;
  resourceId: string;
  resourceTitle?: string;
}

export function AccessControlModal({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceTitle,
}: AccessControlModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [password, setPassword] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePublicToggle = async () => {
    try {
      setLoading(true);
      await api.post('/access/public', {
        resource_type: resourceType,
        resource_id: resourceId,
        is_public: !isPublic,
      });
      setIsPublic(!isPublic);
      toast.success(
        isPublic ? 'Resource is now private' : 'Resource is now public'
      );
    } catch (error) {
      toast.error('Failed to update access');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordProtect = async () => {
    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    try {
      setLoading(true);
      await api.post('/access/password', {
        resource_type: resourceType,
        resource_id: resourceId,
        password,
      });
      toast.success('Password protection enabled');
      setPassword('');
    } catch (error) {
      toast.error('Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async (expiresInDays?: number) => {
    try {
      setLoading(true);
      const response = await api.post('/access/share', {
        resource_type: resourceType,
        resource_id: resourceId,
        expires_in_days: expiresInDays,
      });
      setShareLink(response.data.share_url);
      toast.success('Share link created');
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share & Access Control</DialogTitle>
          <DialogDescription>
            {resourceTitle ? `Manage access to "${resourceTitle}"` : 'Manage access to this resource'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="public" className="gap-2">
              <Globe className="h-4 w-4" />
              Public
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link className="h-4 w-4" />
              Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Access</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can view this resource
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handlePublicToggle}
                disabled={loading}
              />
            </div>
            {isPublic && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                <p className="font-medium">This resource is publicly accessible</p>
                <p>Anyone with the URL can view this resource</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Set Password</Label>
              <p className="text-sm text-muted-foreground">
                Require a password to access this resource
              </p>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  onClick={handlePasswordProtect}
                  disabled={loading || !password}
                >
                  Set
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <p className="text-sm text-muted-foreground">
                Create a shareable link with optional expiry
              </p>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCreateShareLink()}
                  disabled={loading}
                >
                  Create permanent link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreateShareLink(7)}
                  disabled={loading}
                >
                  Create 7-day link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreateShareLink(30)}
                  disabled={loading}
                >
                  Create 30-day link
                </Button>
              </div>

              {shareLink && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={shareLink} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
