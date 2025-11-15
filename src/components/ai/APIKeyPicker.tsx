'use client';

/**
 * @module APIKeyPicker
 * @description Component for selecting and configuring AI provider API keys
 * 
 * Features:
 * - List system and user (BYOK) providers
 * - Add/remove user API keys
 * - Show usage limits per provider
 * - Secure key input
 */

import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Shield, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Provider {
  name: string;
  type: 'system' | 'user';
  models: string[];
}

interface APIKeyPickerProps {
  value?: string; // Selected provider
  onChange?: (provider: string) => void;
  className?: string;
}

export function APIKeyPicker({ value, onChange, className }: APIKeyPickerProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newProvider, setNewProvider] = useState('openai');
  const [newApiKey, setNewApiKey] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(false);
      
      // TODO: Implement actual API call when backend endpoint is ready
      // For now, mock data
      setProviders([
        {
          name: 'openai',
          type: 'system',
          models: ['gpt-4', 'gpt-3.5-turbo', 'dall-e-3'],
        },
        {
          name: 'anthropic',
          type: 'system',
          models: ['claude-3-opus', 'claude-3-sonnet'],
        },
        {
          name: 'ollama',
          type: 'system',
          models: ['llama2', 'mistral'],
        },
      ]);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUserKey = async () => {
    if (!newApiKey.trim()) return;

    try {
      setAdding(true);

      // TODO: Call API to set user key
      const response = await fetch('/api/v1/ai/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          provider: newProvider,
          apiKey: newApiKey,
        }),
      });

      if (response.ok) {
        await loadProviders();
        setShowAddKey(false);
        setNewApiKey('');
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
    } finally {
      setAdding(false);
    }
  };

  const removeUserKey = async (provider: string) => {
    try {
      await fetch(`/api/v1/ai/keys/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      await loadProviders();
    } catch (error) {
      console.error('Failed to remove API key:', error);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label>AI Provider</Label>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.name} value={provider.name}>
              <div className="flex items-center gap-2">
                <span className="capitalize">{provider.name}</span>
                {provider.type === 'system' ? (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                ) : (
                  <Badge variant="default" className="text-xs">Your Key</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Provider Details */}
      {value && (
        <Card>
          <CardContent className="p-4 space-y-2">
            {providers.find((p) => p.name === value)?.type === 'system' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Using system-provided API key</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Using your own API key</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUserKey(value)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Models: {providers.find((p) => p.name === value)?.models.slice(0, 3).join(', ')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Key */}
      <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Your Own API Key (BYOK)
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={newProvider} onValueChange={setNewProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is encrypted and stored securely.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddKey(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={addUserKey}
                disabled={!newApiKey.trim() || adding}
                className="flex-1"
              >
                {adding ? 'Adding...' : 'Add Key'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

