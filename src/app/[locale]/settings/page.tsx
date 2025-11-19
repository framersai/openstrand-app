/**
 * Settings Page
 * 
 * User profile and preferences management.
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceSettingsPanel } from '@/components/settings/VoiceSettingsPanel';
import { User, Volume2, Bell, Shield, Palette, Puzzle } from 'lucide-react';
import { PluginManager } from '@/components/plugins/PluginManager';
import { PluginLibrary } from '@/components/plugins/PluginLibrary';

export const metadata: Metadata = {
  title: 'Settings | OpenStrand',
  description: 'Manage your preferences and account settings',
};

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Volume2 className="h-4 w-4 mr-2" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="plugins">
            <Puzzle className="h-4 w-4 mr-2" />
            Plugins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Profile settings coming soon
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <VoiceSettingsPanel />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Notification settings coming soon
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Privacy settings coming soon
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Appearance settings coming soon
          </div>
        </TabsContent>

        <TabsContent value="plugins" className="mt-6 space-y-8">
          <PluginManager />
          <PluginLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}

