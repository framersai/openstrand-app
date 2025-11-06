/**
 * @module TeamOnlyFeatures
 * @description Example components showing how to implement team-only features
 * 
 * These components are only visible in the team edition of OpenStrand
 * and are completely hidden in the personal edition.
 */

import React from 'react';
import { Users, BarChart3, Building2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureFlag, useFeatureFlags, getFeatureStatus } from '@/lib/feature-flags';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Team workspace switcher - only shown in team edition
 */
export function TeamWorkspaceSwitcher() {
  const t = useTranslations('team');
  
  return (
    <FeatureFlag feature="teamWorkspaces">
      <div className="flex items-center gap-2 border-l pl-4">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <select className="bg-transparent text-sm font-medium">
          <option>Personal Workspace</option>
          <option>Marketing Team</option>
          <option>Engineering Team</option>
        </select>
      </div>
    </FeatureFlag>
  );
}

/**
 * Collaboration indicator - shows who's online
 */
export function CollaborationPresence() {
  const { features } = useFeatureFlags();
  
  if (!features.collaboration) return null;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium">
          JD
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/30 border-2 border-background flex items-center justify-center text-xs font-medium">
          AB
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/40 border-2 border-background flex items-center justify-center text-xs font-medium">
          +3
        </div>
      </div>
      <span className="text-xs text-muted-foreground">5 team members online</span>
    </div>
  );
}

/**
 * Team analytics dashboard - premium feature
 */
export function TeamAnalyticsDashboard() {
  const { features } = useFeatureFlags();
  const status = getFeatureStatus('teamAnalytics', features);
  
  if (status === 'unavailable') return null;
  
  if (status === 'upgrade') {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Team Analytics
          </CardTitle>
          <CardDescription>
            Unlock powerful insights about your team's knowledge management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>• Track team learning progress</li>
                <li>• Identify knowledge gaps</li>
                <li>• Measure content engagement</li>
                <li>• Export detailed reports</li>
              </ul>
            </div>
            <Button className="w-full">
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Team Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Actual analytics implementation */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-xs text-muted-foreground">Total Strands</div>
            </div>
            <div>
              <div className="text-2xl font-bold">89%</div>
              <div className="text-xs text-muted-foreground">Team Engagement</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4.7</div>
              <div className="text-xs text-muted-foreground">Avg. Quality</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SSO configuration - enterprise only
 */
export function SSOConfiguration() {
  const { features } = useFeatureFlags();
  const status = getFeatureStatus('sso', features);
  
  return (
    <FeatureFlag 
      feature="sso"
      fallback={
        status === 'upgrade' ? (
          <Card className="border-dashed opacity-75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Single Sign-On (SSO)
              </CardTitle>
              <CardDescription>
                Enterprise feature - Contact sales
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Single Sign-On (SSO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* SSO configuration UI */}
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <img src="/okta.svg" alt="Okta" className="h-4 w-4 mr-2" />
              Configure Okta
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <img src="/azure.svg" alt="Azure" className="h-4 w-4 mr-2" />
              Configure Azure AD
            </Button>
          </div>
        </CardContent>
      </Card>
    </FeatureFlag>
  );
}

/**
 * Activity feed - team edition only
 */
export function TeamActivityFeed() {
  return (
    <FeatureFlag feature="activityFeed">
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Activity
        </h3>
        <div className="space-y-2">
          <ActivityItem
            user="Jane Doe"
            action="created"
            target="Machine Learning Basics"
            time="2 minutes ago"
          />
          <ActivityItem
            user="John Smith"
            action="commented on"
            target="API Documentation"
            time="15 minutes ago"
          />
          <ActivityItem
            user="Sarah Johnson"
            action="shared"
            target="Q4 Planning"
            time="1 hour ago"
          />
        </div>
      </div>
    </FeatureFlag>
  );
}

function ActivityItem({ 
  user, 
  action, 
  target, 
  time 
}: { 
  user: string; 
  action: string; 
  target: string; 
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium shrink-0">
        {user.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 space-y-1">
        <div>
          <span className="font-medium">{user}</span>
          {' '}
          <span className="text-muted-foreground">{action}</span>
          {' '}
          <span className="font-medium">{target}</span>
        </div>
        <div className="text-xs text-muted-foreground">{time}</div>
      </div>
    </div>
  );
}

/**
 * Shared knowledge bases - team edition
 */
export function SharedKnowledgeBases() {
  const { features } = useFeatureFlags();
  
  if (!features.sharedKnowledgeBases) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Shared Knowledge Bases</h3>
        <Button size="sm" variant="outline">
          Create New
        </Button>
      </div>
      <div className="grid gap-2">
        <KnowledgeBaseItem
          name="Engineering Wiki"
          members={12}
          strands={234}
          updated="2 hours ago"
        />
        <KnowledgeBaseItem
          name="Product Documentation"
          members={8}
          strands={156}
          updated="Yesterday"
        />
        <KnowledgeBaseItem
          name="Company Handbook"
          members={45}
          strands={89}
          updated="3 days ago"
        />
      </div>
    </div>
  );
}

function KnowledgeBaseItem({ 
  name, 
  members, 
  strands, 
  updated 
}: { 
  name: string; 
  members: number; 
  strands: number; 
  updated: string;
}) {
  return (
    <div className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-sm">{name}</h4>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {members} members
            </span>
            <span>{strands} strands</span>
            <span>Updated {updated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
