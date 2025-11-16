'use client';

/**
 * @module QRShareModal
 * @description Modal for sharing content with QR codes
 * 
 * Features:
 * - Generate QR code for any shareable content
 * - Copy share link
 * - Download QR code as PNG
 * - Set expiration date
 * - Toggle cloning permission
 * - View analytics (views, clones)
 */

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Download, Check, Calendar, Lock, Unlock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface QRShareModalProps {
  /** Content to share */
  contentId: string;
  contentType: 'flashcard_deck' | 'quiz' | 'strand' | 'loom';
  
  /** Content title for display */
  contentTitle: string;
  
  /** Trigger button (optional) */
  trigger?: React.ReactNode;
  
  /** Called when share is created */
  onShareCreated?: (shareCode: string, shareUrl: string) => void;
}

export function QRShareModal({
  contentId,
  contentType,
  contentTitle,
  trigger,
  onShareCreated,
}: QRShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [allowClone, setAllowClone] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [cloneCount, setCloneCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCreateShare = async () => {
    try {
      const response = await fetch('/api/v1/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          contentId,
          contentType,
          isPublic,
          allowClone,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const share = result.data;
        
        setShareUrl(share.shareUrl);
        setShareCode(share.shareCode);
        setViewCount(share.viewCount);
        setCloneCount(share.cloneCount);

        onShareCreated?.(share.shareCode, share.shareUrl);

        toast({
          title: 'Share Created',
          description: 'Your content is now shareable!',
        });
      } else {
        throw new Error('Failed to create share');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${shareCode}.png`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'Downloaded',
          description: 'QR code saved as PNG',
        });
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share {contentTitle}</DialogTitle>
          <DialogDescription>
            Create a shareable link and QR code for easy access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!shareUrl ? (
            // Share Creation Form
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public">Public Access</Label>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="clone">Allow Cloning</Label>
                <Switch
                  id="clone"
                  checked={allowClone}
                  onCheckedChange={setAllowClone}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires At (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateShare} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          ) : (
            // Share Details & QR Code
            <div className="space-y-6">
              {/* QR Code */}
              <Card>
                <CardContent className="p-6 flex justify-center bg-white">
                  <div ref={qrRef}>
                    <QRCodeSVG
                      value={shareUrl}
                      size={256}
                      level="M"
                      includeMargin
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Share Link */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Short Code */}
              <div className="space-y-2">
                <Label>Short Code</Label>
                <Input
                  value={shareCode}
                  readOnly
                  className="font-mono text-lg font-bold text-center"
                />
              </div>

              {/* Settings Display */}
              <div className="flex gap-3">
                <Badge variant={isPublic ? 'default' : 'secondary'}>
                  {isPublic ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {isPublic ? 'Public' : 'Private'}
                </Badge>
                <Badge variant="outline">
                  {allowClone ? 'Cloning Allowed' : 'No Cloning'}
                </Badge>
                {expiresAt && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Expires {new Date(expiresAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              {/* Analytics */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">Analytics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="text-2xl font-bold">{viewCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clones</p>
                      <p className="text-2xl font-bold">{cloneCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadQR} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
                <Button variant="outline" onClick={handleCopy} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

