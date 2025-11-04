import type { Metadata } from 'next';

import { TeamsDeveloperConsole } from '@/features/teams/components/TeamsDeveloperConsole';

export const metadata: Metadata = {
  title: 'Team developer console',
  description:
    'Manage API tokens, explore the OpenStrand OpenAPI schema, and wire secure integrations for your Team or Enterprise workspace.',
};

export default function TeamsPage() {
  return <TeamsDeveloperConsole />;
}

