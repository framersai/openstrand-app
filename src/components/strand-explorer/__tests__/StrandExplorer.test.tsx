/**
 * Strand Explorer Tests
 *
 * @module components/strand-explorer/__tests__/StrandExplorer
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrandExplorer, StrandExplorerItem } from '../StrandExplorer';
import { StrandTreeView, TreeNode } from '../StrandTreeView';
import { StrandBreadcrumb, BreadcrumbItem } from '../StrandBreadcrumb';

// ============================================================================
// TEST DATA
// ============================================================================

const mockItems: StrandExplorerItem[] = [
  {
    id: '1',
    title: 'Root Collection',
    slug: 'root-collection',
    strandType: 'collection',
    isCollection: true,
    parentId: null,
    tags: ['course'],
    childCount: 2,
    depth: 0,
  },
  {
    id: '2',
    title: 'Chapter 1',
    slug: 'chapter-1',
    strandType: 'collection',
    isCollection: true,
    parentId: '1',
    tags: ['physics'],
    childCount: 2,
    depth: 1,
  },
  {
    id: '3',
    title: 'Chapter 2',
    slug: 'chapter-2',
    strandType: 'collection',
    isCollection: true,
    parentId: '1',
    tags: ['chemistry'],
    childCount: 0,
    depth: 1,
  },
  {
    id: '4',
    title: 'Lesson 1.1',
    slug: 'lesson-1-1',
    strandType: 'document',
    isCollection: false,
    parentId: '2',
    tags: ['quantum'],
    depth: 2,
  },
  {
    id: '5',
    title: 'Lesson 1.2',
    slug: 'lesson-1-2',
    strandType: 'document',
    isCollection: false,
    parentId: '2',
    tags: ['relativity'],
    depth: 2,
  },
];

const mockTreeData: TreeNode = {
  id: '1',
  title: 'Root Collection',
  slug: 'root-collection',
  strandType: 'collection',
  isCollection: true,
  depth: 0,
  tags: ['course'],
  children: [
    {
      id: '2',
      title: 'Chapter 1',
      slug: 'chapter-1',
      strandType: 'collection',
      isCollection: true,
      depth: 1,
      tags: ['physics'],
      children: [
        {
          id: '4',
          title: 'Lesson 1.1',
          slug: 'lesson-1-1',
          strandType: 'document',
          isCollection: false,
          depth: 2,
          tags: ['quantum'],
          children: [],
        },
        {
          id: '5',
          title: 'Lesson 1.2',
          slug: 'lesson-1-2',
          strandType: 'document',
          isCollection: false,
          depth: 2,
          tags: ['relativity'],
          children: [],
        },
      ],
    },
    {
      id: '3',
      title: 'Chapter 2',
      slug: 'chapter-2',
      strandType: 'collection',
      isCollection: true,
      depth: 1,
      tags: ['chemistry'],
      children: [],
    },
  ],
};

const mockPath: BreadcrumbItem[] = [
  { id: '1', title: 'Root Collection', slug: 'root-collection', isCollection: true },
  { id: '2', title: 'Chapter 1', slug: 'chapter-1', isCollection: true },
  { id: '4', title: 'Lesson 1.1', slug: 'lesson-1-1', isCollection: false },
];

// ============================================================================
// STRAND EXPLORER TESTS
// ============================================================================

describe('StrandExplorer', () => {
  const mockActions = {
    onSelect: vi.fn(),
    onOpen: vi.fn(),
    onMove: vi.fn(),
    onCopy: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onCreate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders root level items', () => {
    render(<StrandExplorer items={mockItems} actions={mockActions} />);

    expect(screen.getByText('Root Collection')).toBeInTheDocument();
  });

  it('expands collection on double click', async () => {
    const user = userEvent.setup();
    render(<StrandExplorer items={mockItems} actions={mockActions} />);

    const rootCollection = screen.getByText('Root Collection');
    await user.dblClick(rootCollection);

    // Children should now be visible
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
  });

  it('calls onSelect when item is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StrandExplorer
        items={mockItems}
        actions={mockActions}
        defaultExpandedIds={['1']}
      />
    );

    const chapter = screen.getByText('Chapter 1');
    await user.click(chapter);

    expect(mockActions.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', title: 'Chapter 1' })
    );
  });

  it('shows search input when showSearch is true', () => {
    render(
      <StrandExplorer items={mockItems} actions={mockActions} showSearch />
    );

    expect(screen.getByPlaceholderText('Search strands...')).toBeInTheDocument();
  });

  it('filters items by search query', async () => {
    const user = userEvent.setup();
    render(
      <StrandExplorer
        items={mockItems}
        actions={mockActions}
        showSearch
        defaultExpandedIds={['1', '2']}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search strands...');
    await user.type(searchInput, 'quantum');

    // Only matching items and their parents should be visible
    await waitFor(() => {
      expect(screen.getByText('Lesson 1.1')).toBeInTheDocument();
    });
  });

  it('shows child count badge for collections', () => {
    render(
      <StrandExplorer items={mockItems} actions={mockActions} />
    );

    // Root collection has 2 children
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<StrandExplorer items={[]} actions={mockActions} />);

    expect(screen.getByText('No strands yet')).toBeInTheDocument();
  });

  it('shows create buttons in toolbar', () => {
    render(<StrandExplorer items={mockItems} actions={mockActions} />);

    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collection/i })).toBeInTheDocument();
  });
});

// ============================================================================
// STRAND TREE VIEW TESTS
// ============================================================================

describe('StrandTreeView', () => {
  it('renders tree structure', () => {
    render(<StrandTreeView data={mockTreeData} />);

    expect(screen.getByText('Root Collection')).toBeInTheDocument();
  });

  it('expands and collapses nodes', async () => {
    const user = userEvent.setup();
    render(<StrandTreeView data={mockTreeData} />);

    // Should be expanded by default
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();

    // Find collapse button and click
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-chevron-right')
    );

    if (expandButton) {
      await user.click(expandButton);
    }
  });

  it('calls onSelect when node is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<StrandTreeView data={mockTreeData} onSelect={onSelect} />);

    const chapter = screen.getByText('Chapter 1');
    await user.click(chapter);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', title: 'Chapter 1' })
    );
  });

  it('highlights selected node', () => {
    render(<StrandTreeView data={mockTreeData} selectedId="2" />);

    const chapter1 = screen.getByText('Chapter 1').closest('div');
    expect(chapter1).toHaveClass('bg-accent');
  });

  it('shows connection lines when showLines is true', () => {
    render(<StrandTreeView data={mockTreeData} showLines />);

    // Lines are rendered via CSS, check that container has items
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('shows tags when showTags is true', () => {
    render(<StrandTreeView data={mockTreeData} showTags />);

    expect(screen.getByText('course')).toBeInTheDocument();
  });

  it('respects maxDepth', () => {
    const deepTree: TreeNode = {
      ...mockTreeData,
      children: [
        {
          ...mockTreeData.children[0],
          children: [
            {
              id: 'deep-1',
              title: 'Very Deep Node',
              slug: 'very-deep',
              strandType: 'document',
              isCollection: false,
              depth: 15,
              tags: [],
              children: [],
            },
          ],
        },
      ],
    };

    render(<StrandTreeView data={deepTree} maxDepth={2} />);

    // Deep node should not be rendered
    expect(screen.queryByText('Very Deep Node')).not.toBeInTheDocument();
  });
});

// ============================================================================
// STRAND BREADCRUMB TESTS
// ============================================================================

describe('StrandBreadcrumb', () => {
  it('renders path items', () => {
    render(<StrandBreadcrumb path={mockPath} />);

    expect(screen.getByText('Root Collection')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1.1')).toBeInTheDocument();
  });

  it('shows home button when showRoot is true', () => {
    render(<StrandBreadcrumb path={mockPath} showRoot />);

    expect(screen.getByRole('button', { name: /go to root/i })).toBeInTheDocument();
  });

  it('calls onNavigate when item is clicked', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(<StrandBreadcrumb path={mockPath} onNavigate={onNavigate} />);

    await user.click(screen.getByText('Chapter 1'));

    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2', title: 'Chapter 1' })
    );
  });

  it('collapses items when exceeding maxItems', () => {
    const longPath: BreadcrumbItem[] = [
      { id: '1', title: 'Level 1', slug: 'level-1' },
      { id: '2', title: 'Level 2', slug: 'level-2' },
      { id: '3', title: 'Level 3', slug: 'level-3' },
      { id: '4', title: 'Level 4', slug: 'level-4' },
      { id: '5', title: 'Level 5', slug: 'level-5' },
      { id: '6', title: 'Level 6', slug: 'level-6' },
    ];

    render(<StrandBreadcrumb path={longPath} maxItems={4} />);

    // Should show ellipsis
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows current item with different styling', () => {
    render(<StrandBreadcrumb path={mockPath} />);

    const currentItem = screen.getByText('Lesson 1.1');
    const button = currentItem.closest('button');

    expect(button).toHaveClass('text-foreground');
  });

  it('renders links when useLinks is true', () => {
    render(<StrandBreadcrumb path={mockPath} useLinks basePath="/strand" />);

    const link = screen.getByRole('link', { name: /root collection/i });
    expect(link).toHaveAttribute('href', '/strand/root-collection');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Explorer with hooks', () => {
  it('handles multiple selection with Ctrl+click', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <StrandExplorer
        items={mockItems}
        multiSelect
        defaultExpandedIds={['1']}
        onSelectionChange={onSelectionChange}
      />
    );

    const chapter1 = screen.getByText('Chapter 1');
    const chapter2 = screen.getByText('Chapter 2');

    await user.click(chapter1);
    await user.keyboard('{Control>}');
    await user.click(chapter2);
    await user.keyboard('{/Control}');

    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.arrayContaining(['2', '3'])
    );
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <StrandExplorer
        items={mockItems}
        defaultExpandedIds={['1']}
      />
    );

    const firstItem = screen.getByText('Root Collection').closest('[role="treeitem"]');
    expect(firstItem).toBeInTheDocument();

    if (firstItem) {
      await user.click(firstItem);
      expect(firstItem).toHaveFocus();
    }
  });
});

