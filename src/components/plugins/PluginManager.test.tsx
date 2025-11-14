/**
 * Plugin Manager Tests
 * 
 * @module components/plugins/PluginManager.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PluginManager } from './PluginManager';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/feature-flags', () => ({
  useFeatureFlags: () => ({
    isTeamEdition: false,
  }),
}));

describe('PluginManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
    localStorage.setItem('auth_token', 'test-token');
  });

  it('should render loading state', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PluginManager />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display plugins', async () => {
    const mockPlugins = [
      {
        id: '1',
        name: 'csv-export',
        version: '1.0.0',
        displayName: 'CSV Exporter',
        description: 'Export strands as CSV',
        enabled: true,
        isSigned: false,
        loadOrder: 1,
        permissions: ['filesystem'],
        installed: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPlugins })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ conflicts: [] }) });

    render(<PluginManager />);

    await waitFor(() => {
      expect(screen.getByText('CSV Exporter')).toBeInTheDocument();
      expect(screen.getByText('Export strands as CSV')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });

  it('should show empty state when no plugins', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ conflicts: [] }) });

    render(<PluginManager />);

    await waitFor(() => {
      expect(screen.getByText('No plugins installed')).toBeInTheDocument();
    });
  });

  it('should toggle plugin enabled status', async () => {
    const mockPlugins = [
      {
        id: '1',
        name: 'csv-export',
        version: '1.0.0',
        displayName: 'CSV Exporter',
        enabled: true,
        isSigned: false,
        loadOrder: 1,
        permissions: [],
        installed: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPlugins })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ conflicts: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Plugin updated' }) });

    const user = userEvent.setup();

    render(<PluginManager />);

    await waitFor(() => {
      expect(screen.getByText('CSV Exporter')).toBeInTheDocument();
    });

    // Find and toggle switch
    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/plugins/csv-export',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ enabled: false }),
        })
      );
    });
  });

  it('should display conflict banner', async () => {
    const mockPlugins = [
      {
        id: '1',
        name: 'csv-export',
        version: '1.0.0',
        enabled: true,
        isSigned: false,
        loadOrder: 1,
        permissions: [],
        installed: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'data-exporter',
        version: '1.0.0',
        enabled: true,
        isSigned: false,
        loadOrder: 2,
        permissions: [],
        installed: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    ];

    const mockConflicts = {
      conflicts: [
        {
          selector: 'export.csv',
          type: 'command',
          plugins: ['csv-export', 'data-exporter'],
        },
      ],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPlugins })
      .mockResolvedValueOnce({ ok: true, json: async () => mockConflicts });

    render(<PluginManager />);

    await waitFor(() => {
      expect(screen.getByText(/1 plugin conflict detected/i)).toBeInTheDocument();
      expect(screen.getByText(/conflicts with: data-exporter/i)).toBeInTheDocument();
    });
  });

  it('should show signed badge for verified plugins', async () => {
    const mockPlugins = [
      {
        id: '1',
        name: 'signed-plugin',
        version: '1.0.0',
        displayName: 'Signed Plugin',
        enabled: true,
        isSigned: true,
        signedBy: 'OpenStrand Team',
        loadOrder: 1,
        permissions: [],
        installed: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPlugins })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ conflicts: [] }) });

    render(<PluginManager />);

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });
});

