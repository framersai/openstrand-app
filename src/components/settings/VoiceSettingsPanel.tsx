/**
 * Voice Settings Panel
 * 
 * Comprehensive voice & narration settings UI.
 * Allows users to configure TTS/STT providers, voices, speeds, retention policies.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, Settings2, Download, Trash2, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useParams } from 'next/navigation';
import { getVoiceLanguageForLocale, syncVoiceWithLocale } from '@/lib/voice-i18n';

export interface VoiceSettings {
  id: string;
  ttsProvider: string;
  ttsVoice: string;
  ttsSpeed: number;
  ttsLanguage: string;
  ttsAutoNarrate: boolean;
  sttProvider: string;
  sttLanguage?: string;
  sttSensitivity: number;
  retentionDays: number;
  saveByDefault: boolean;
}

export interface VoiceProviders {
  available: string[];
  tts: string[];
  stt: string[];
}

const OPENAI_VOICES = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British Male)' },
  { value: 'onyx', label: 'Onyx (Deep Male)' },
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'shimmer', label: 'Shimmer (Soft Female)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
];

export function VoiceSettingsPanel() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [providers, setProviders] = useState<VoiceProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [autoSwitchLocale, setAutoSwitchLocale] = useState(true);

  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';
  const { toast } = useToast();
  const { speak } = useTextToSpeech();

  // Load auto-switch preference
  useEffect(() => {
    const saved = localStorage.getItem('voiceAutoSwitchLocale');
    setAutoSwitchLocale(saved === null ? true : saved === 'true');
  }, []);

  useEffect(() => {
    loadSettings();
    loadProviders();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      toast({
        title: 'Failed to load settings',
        description: 'Could not load voice settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/providers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttsProvider: settings.ttsProvider,
          ttsVoice: settings.ttsVoice,
          ttsSpeed: settings.ttsSpeed,
          ttsLanguage: settings.ttsLanguage,
          ttsAutoNarrate: settings.ttsAutoNarrate,
          sttProvider: settings.sttProvider,
          sttLanguage: settings.sttLanguage,
          sttSensitivity: settings.sttSensitivity,
          retentionDays: settings.retentionDays,
          saveByDefault: settings.saveByDefault,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'Your voice preferences have been updated',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save voice settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testVoice = async () => {
    if (!settings) return;

    setTestingVoice(true);
    try {
      await speak('Hello! This is a test of your selected voice and speed settings.', {
        voice: settings.ttsVoice,
        speed: settings.ttsSpeed,
        language: settings.ttsLanguage,
      });
    } catch (error) {
      toast({
        title: 'Voice test failed',
        description: 'Could not play test audio',
        variant: 'destructive',
      });
    } finally {
      setTestingVoice(false);
    }
  };

  if (loading || !settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* TTS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Text-to-Speech (TTS)
          </CardTitle>
          <CardDescription>
            Configure voice narration for flashcards, notes, and documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={settings.ttsProvider}
              onValueChange={(value) => setSettings({ ...settings, ttsProvider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers?.tts.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice */}
          {settings.ttsProvider === 'OPENAI_TTS' && (
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select
                value={settings.ttsVoice}
                onValueChange={(value) => setSettings({ ...settings, ttsVoice: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_VOICES.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Speed</Label>
              <span className="text-sm text-muted-foreground">{settings.ttsSpeed.toFixed(2)}×</span>
            </div>
            <Slider
              value={[settings.ttsSpeed]}
              onValueChange={([value]) => setSettings({ ...settings, ttsSpeed: value })}
              min={0.25}
              max={4.0}
              step={0.25}
              className="w-full"
            />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={settings.ttsLanguage}
              onValueChange={(value) => setSettings({ ...settings, ttsLanguage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-Switch with UI Locale */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-switch with UI language</Label>
              <p className="text-sm text-muted-foreground">
                Automatically change voice language when you change UI locale
              </p>
            </div>
            <Switch
              checked={autoSwitchLocale}
              onCheckedChange={(checked) => {
                setAutoSwitchLocale(checked);
                localStorage.setItem('voiceAutoSwitchLocale', String(checked));
                
                if (checked) {
                  // Sync now
                  const newLang = getVoiceLanguageForLocale(currentLocale);
                  setSettings({ ...settings, ttsLanguage: newLang, sttLanguage: newLang });
                  toast({
                    title: 'Auto-switch enabled',
                    description: `Voice language synced to ${currentLocale}`,
                  });
                }
              }}
            />
          </div>

          {autoSwitchLocale && (
            <div className="p-3 bg-primary/10 rounded-lg text-sm">
              <p className="text-primary font-medium">
                🌐 Voice language auto-synced to UI locale: {currentLocale} → {getVoiceLanguageForLocale(currentLocale)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Change your UI language in the appearance settings to automatically switch voice language
              </p>
            </div>
          )}

          {/* Auto-Narrate */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-narrate flashcards</Label>
              <p className="text-sm text-muted-foreground">
                Automatically read flashcard fronts when flipped
              </p>
            </div>
            <Switch
              checked={settings.ttsAutoNarrate}
              onCheckedChange={(checked) => setSettings({ ...settings, ttsAutoNarrate: checked })}
            />
          </div>

          {/* Test Voice */}
          <Button onClick={testVoice} disabled={testingVoice} className="w-full">
            {testingVoice ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Voice
          </Button>
        </CardContent>
      </Card>

      {/* STT Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Speech-to-Text (STT)
          </CardTitle>
          <CardDescription>
            Configure voice recognition for answering quizzes and dictation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={settings.sttProvider}
              onValueChange={(value) => setSettings({ ...settings, sttProvider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers?.stt.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
                <SelectItem value="BROWSER_STT">
                  Browser (Free) <Badge variant="secondary" className="ml-2">Recommended</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Language (optional)</Label>
            <Select
              value={settings.sttLanguage || 'auto'}
              onValueChange={(value) =>
                setSettings({ ...settings, sttLanguage: value === 'auto' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sensitivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sensitivity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.sttSensitivity * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.sttSensitivity]}
              onValueChange={([value]) => setSettings({ ...settings, sttSensitivity: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lower = fewer false triggers, Higher = more responsive
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Storage & Privacy
          </CardTitle>
          <CardDescription>
            Manage audio recordings and retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Retention Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Auto-delete recordings after</Label>
              <span className="text-sm text-muted-foreground">{settings.retentionDays} days</span>
            </div>
            <Slider
              value={[settings.retentionDays]}
              onValueChange={([value]) => setSettings({ ...settings, retentionDays: value })}
              min={1}
              max={365}
              step={1}
              className="w-full"
            />
          </div>

          {/* Save by Default */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Save recordings by default</Label>
              <p className="text-sm text-muted-foreground">
                Automatically attach voice recordings to content
              </p>
            </div>
            <Switch
              checked={settings.saveByDefault}
              onCheckedChange={(checked) => setSettings({ ...settings, saveByDefault: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={saving} className="w-full" size="lg">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}

