/**
 * Template Selector Tests
 * 
 * @module components/onboarding/TemplateSelector.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateSelector } from './TemplateSelector';

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('TemplateSelector', () => {
  const mockOnNext = vi.fn();
  const mockOnSkip = vi.fn();
  const mockUpdateWizardData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
  });

  it('should render loading state', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{}}
        updateWizardData={mockUpdateWizardData}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should load and display templates', async () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Storytelling',
        slug: 'storytelling',
        description: 'For narrative projects',
        category: 'STORYTELLING',
        tags: ['beginner', 'creative'],
        icon: 'book',
        usageCount: 42,
      },
      {
        id: '2',
        name: 'CRM',
        slug: 'crm',
        description: 'Customer relationship management',
        category: 'CRM',
        tags: ['business'],
        icon: 'users',
        usageCount: 28,
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplates,
    });

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{}}
        updateWizardData={mockUpdateWizardData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Storytelling')).toBeInTheDocument();
      expect(screen.getByText('CRM')).toBeInTheDocument();
    });

    expect(screen.getByText('For narrative projects')).toBeInTheDocument();
    expect(screen.getByText('Used 42 times')).toBeInTheDocument();
  });

  it('should select template on click', async () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Storytelling',
        category: 'STORYTELLING',
        tags: [],
        usageCount: 10,
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplates,
    });

    const user = userEvent.setup();

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{}}
        updateWizardData={mockUpdateWizardData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Storytelling')).toBeInTheDocument();
    });

    // Click template
    await user.click(screen.getByText('Storytelling'));

    // Apply button should be enabled
    const applyButton = screen.getByRole('button', { name: /apply template/i });
    expect(applyButton).toBeEnabled();
  });

  it('should filter templates by search', async () => {
    const mockTemplates = [
      { id: '1', name: 'Storytelling', category: 'STORYTELLING', tags: [], usageCount: 10 },
      { id: '2', name: 'CRM', category: 'CRM', tags: [], usageCount: 5 },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplates,
    });

    const user = userEvent.setup();

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{}}
        updateWizardData={mockUpdateWizardData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Storytelling')).toBeInTheDocument();
    });

    // Search for "story"
    const searchInput = screen.getByPlaceholderText(/search templates/i);
    await user.type(searchInput, 'story');

    // Should show only Storytelling
    expect(screen.getByText('Storytelling')).toBeInTheDocument();
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });

  it('should apply template', async () => {
    const mockTemplates = [
      { id: '1', name: 'Storytelling', category: 'STORYTELLING', tags: [], usageCount: 10 },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rootStrandId: 'strand-123', message: 'Success' }),
      });

    const user = userEvent.setup();

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{}}
        updateWizardData={mockUpdateWizardData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Storytelling')).toBeInTheDocument();
    });

    // Select and apply
    await user.click(screen.getByText('Storytelling'));
    await user.click(screen.getByRole('button', { name: /apply template/i }));

    await waitFor(() => {
      expect(mockUpdateWizardData).toHaveBeenCalledWith({
        templateId: '1',
        rootStrandId: 'strand-123',
      });
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  it('should skip when no template selected', async () => {
    const mockTemplates = [
      { id: '1', name: 'Storytelling', category: 'STORYTELLING', tags: [], usageCount: 10 },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplates,
    });

    const user = userEvent.setup();

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{}}
        updateWizardData={mockUpdateWizardData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Storytelling')).toBeInTheDocument();
    });

    // Click skip
    await user.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should restore selected template from wizardData', async () => {
    const mockTemplates = [
      { id: '1', name: 'Storytelling', category: 'STORYTELLING', tags: [], usageCount: 10 },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemplates,
    });

    render(
      <TemplateSelector
        onNext={mockOnNext}
        onSkip={mockOnSkip}
        wizardData={{ templateId: '1' }}
        updateWizardData={mockUpdateWizardData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Storytelling')).toBeInTheDocument();
    });

    // Apply button should be enabled (template already selected)
    const applyButton = screen.getByRole('button', { name: /apply template/i });
    expect(applyButton).toBeEnabled();
  });
});

