/**
 * Strand Explorer Component
 *
 * Hierarchical file explorer for strands and collections with:
 * - Drag and drop reorganization
 * - Expand/collapse folders
 * - Context menus for operations
 * - Breadcrumb navigation
 * - Multi-select support
 * - Keyboard navigation
 *
 * @module components/strand-explorer
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  createContext,
  useContext,
} from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Image,
  Video,
  Music,
  Code,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Move,
  Edit,
  Eye,
  Tag,
  Share2,
  Download,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Strand item in the explorer
 */
export interface StrandExplorerItem {
  id: string;
  title: string;
  slug: string;
  strandType: string;
  isCollection: boolean;
  parentId: string | null;
  tags: string[];
  childCount?: number;
  depth: number;
  summary?: string;
  thumbnailUrl?: string;
  created?: string;
  updated?: string;
}

/**
 * Explorer state
 */
export interface ExplorerState {
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  focusedId: string | null;
  editingId: string | null;
  searchQuery: string;
}

/**
 * Explorer actions
 */
export interface ExplorerActions {
  onSelect?: (item: StrandExplorerItem) => void;
  onOpen?: (item: StrandExplorerItem) => void;
  onMove?: (itemId: string, newParentId: string | null, position: number) => Promise<void>;
  onCopy?: (itemId: string, newParentId?: string | null) => Promise<string>;
  onDelete?: (itemId: string) => Promise<void>;
  onRename?: (itemId: string, newTitle: string) => Promise<void>;
  onCreate?: (parentId: string | null, type: 'document' | 'collection') => Promise<void>;
  onTagsChange?: (itemId: string, tags: string[]) => Promise<void>;
  onExport?: (itemId: string) => Promise<void>;
  onShare?: (itemId: string) => void;
}

/**
 * Explorer props
 */
export interface StrandExplorerProps {
  items: StrandExplorerItem[];
  rootId?: string | null;
  actions?: ExplorerActions;
  className?: string;
  showSearch?: boolean;
  showBreadcrumb?: boolean;
  multiSelect?: boolean;
  defaultExpandedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ExplorerContextValue {
  state: ExplorerState;
  actions: ExplorerActions;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, multi?: boolean) => void;
  setFocused: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

function useExplorer() {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error('useExplorer must be used within StrandExplorer');
  }
  return context;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get icon for strand type
 */
function getStrandIcon(item: StrandExplorerItem, isExpanded: boolean) {
  if (item.isCollection) {
    return isExpanded ? FolderOpen : Folder;
  }

  switch (item.strandType) {
    case 'image':
    case 'media':
      return Image;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    case 'code':
      return Code;
    default:
      return FileText;
  }
}

/**
 * Build tree structure from flat list
 */
function buildTree(
  items: StrandExplorerItem[],
  parentId: string | null = null
): StrandExplorerItem[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Get all descendant IDs
 */
function getDescendantIds(items: StrandExplorerItem[], parentId: string): string[] {
  const descendants: string[] = [];
  const children = items.filter((item) => item.parentId === parentId);

  for (const child of children) {
    descendants.push(child.id);
    if (child.isCollection) {
      descendants.push(...getDescendantIds(items, child.id));
    }
  }

  return descendants;
}

/**
 * Check if item is ancestor of another
 */
function isAncestorOf(
  items: StrandExplorerItem[],
  ancestorId: string,
  descendantId: string
): boolean {
  const descendantIds = getDescendantIds(items, ancestorId);
  return descendantIds.includes(descendantId);
}

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

interface SortableItemProps {
  item: StrandExplorerItem;
  items: StrandExplorerItem[];
  depth?: number;
}

function SortableItem({ item, items, depth = 0 }: SortableItemProps) {
  const { state, actions, toggleExpand, toggleSelect, setFocused, startEditing, stopEditing } =
    useExplorer();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: item.id,
    data: { item },
  });

  const isExpanded = state.expandedIds.has(item.id);
  const isSelected = state.selectedIds.has(item.id);
  const isFocused = state.focusedId === item.id;
  const isEditing = state.editingId === item.id;

  const [editValue, setEditValue] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const Icon = getStrandIcon(item, isExpanded);
  const children = useMemo(() => buildTree(items, item.id), [items, item.id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSelect(item.id, e.ctrlKey || e.metaKey);
      setFocused(item.id);
    },
    [item.id, toggleSelect, setFocused]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item.isCollection) {
        toggleExpand(item.id);
      } else {
        actions.onOpen?.(item);
      }
    },
    [item, toggleExpand, actions]
  );

  const handleExpandClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpand(item.id);
    },
    [item.id, toggleExpand]
  );

  const handleRenameSubmit = useCallback(async () => {
    if (editValue.trim() && editValue !== item.title) {
      await actions.onRename?.(item.id, editValue.trim());
    }
    stopEditing();
  }, [editValue, item.id, item.title, actions, stopEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) {
        if (e.key === 'Enter') {
          handleRenameSubmit();
        } else if (e.key === 'Escape') {
          setEditValue(item.title);
          stopEditing();
        }
      }
    },
    [isEditing, handleRenameSubmit, item.title, stopEditing]
  );

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer',
          'hover:bg-accent/50 transition-colors',
          isSelected && 'bg-accent',
          isFocused && 'ring-1 ring-ring',
          isDragging && 'opacity-50',
          isOver && item.isCollection && 'bg-primary/10 ring-2 ring-primary'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={item.isCollection ? isExpanded : undefined}
        {...attributes}
        {...listeners}
      >
        {/* Expand/collapse button */}
        {item.isCollection ? (
          <button
            onClick={handleExpandClick}
            className="p-0.5 hover:bg-accent rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon */}
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0',
            item.isCollection ? 'text-amber-500' : 'text-muted-foreground'
          )}
        />

        {/* Title or edit input */}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            className="h-6 py-0 px-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-sm">{item.title}</span>
        )}

        {/* Child count badge */}
        {item.isCollection && item.childCount !== undefined && item.childCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {item.childCount}
          </Badge>
        )}

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <ItemContextMenu item={item} />
        </DropdownMenu>
      </div>

      {/* Children */}
      {item.isCollection && isExpanded && children.length > 0 && (
        <SortableContext
          items={children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {children.map((child) => (
            <SortableItem
              key={child.id}
              item={child}
              items={items}
              depth={depth + 1}
            />
          ))}
        </SortableContext>
      )}

      {/* Empty collection placeholder */}
      {item.isCollection && isExpanded && children.length === 0 && (
        <div
          className="text-xs text-muted-foreground py-2"
          style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
        >
          Empty collection
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONTEXT MENU COMPONENT
// ============================================================================

interface ItemContextMenuProps {
  item: StrandExplorerItem;
}

function ItemContextMenu({ item }: ItemContextMenuProps) {
  const { actions, startEditing } = useExplorer();

  return (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={() => actions.onOpen?.(item)}>
        <Eye className="h-4 w-4 mr-2" />
        Open
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => startEditing(item.id)}>
        <Edit className="h-4 w-4 mr-2" />
        Rename
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {item.isCollection && (
        <>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Plus className="h-4 w-4 mr-2" />
              New
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => actions.onCreate?.(item.id, 'document')}>
                <FileText className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onCreate?.(item.id, 'collection')}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Collection
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
        </>
      )}

      <DropdownMenuItem onClick={() => actions.onCopy?.(item.id)}>
        <Copy className="h-4 w-4 mr-2" />
        Duplicate
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Move className="h-4 w-4 mr-2" />
          Move to
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => actions.onMove?.(item.id, null, 0)}>
            Root level
          </DropdownMenuItem>
          {/* Additional move targets would be populated dynamically */}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={() => actions.onShare?.(item.id)}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => actions.onExport?.(item.id)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => actions.onDelete?.(item.id)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

// ============================================================================
// DRAG OVERLAY COMPONENT
// ============================================================================

interface DragOverlayItemProps {
  item: StrandExplorerItem;
  count?: number;
}

function DragOverlayItem({ item, count = 1 }: DragOverlayItemProps) {
  const Icon = getStrandIcon(item, false);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-lg">
      <Icon
        className={cn(
          'h-4 w-4',
          item.isCollection ? 'text-amber-500' : 'text-muted-foreground'
        )}
      />
      <span className="text-sm font-medium">{item.title}</span>
      {count > 1 && (
        <Badge variant="secondary" className="ml-2">
          +{count - 1}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// BREADCRUMB COMPONENT
// ============================================================================

interface BreadcrumbProps {
  items: StrandExplorerItem[];
  currentId: string | null;
  onNavigate: (id: string | null) => void;
}

function ExplorerBreadcrumb({ items, currentId, onNavigate }: BreadcrumbProps) {
  // Build path to current item
  const path = useMemo(() => {
    const result: StrandExplorerItem[] = [];
    let current = items.find((i) => i.id === currentId);

    while (current) {
      result.unshift(current);
      current = items.find((i) => i.id === current?.parentId);
    }

    return result;
  }, [items, currentId]);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-foreground transition-colors"
      >
        Root
      </button>
      {path.map((item) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => onNavigate(item.id)}
            className={cn(
              'hover:text-foreground transition-colors truncate max-w-32',
              item.id === currentId && 'text-foreground font-medium'
            )}
          >
            {item.title}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

// ============================================================================
// MAIN EXPLORER COMPONENT
// ============================================================================

/**
 * Hierarchical strand explorer with drag-and-drop
 *
 * @example
 * ```tsx
 * <StrandExplorer
 *   items={strands}
 *   actions={{
 *     onMove: async (id, parentId, pos) => await sdk.collections.moveStrand({ ... }),
 *     onCopy: async (id) => await sdk.collections.copyStrand({ strandId: id }),
 *     onDelete: async (id) => await sdk.strands.delete(id),
 *   }}
 *   showSearch
 *   showBreadcrumb
 *   multiSelect
 * />
 * ```
 */
export function StrandExplorer({
  items,
  rootId = null,
  actions = {},
  className,
  showSearch = false,
  showBreadcrumb = false,
  multiSelect = false,
  defaultExpandedIds = [],
  onSelectionChange,
}: StrandExplorerProps) {
  // State
  const [state, setState] = useState<ExplorerState>({
    expandedIds: new Set(defaultExpandedIds),
    selectedIds: new Set(),
    focusedId: null,
    editingId: null,
    searchQuery: '',
  });

  const [currentRootId, setCurrentRootId] = useState<string | null>(rootId);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!state.searchQuery.trim()) return items;

    const query = state.searchQuery.toLowerCase();
    const matchingIds = new Set<string>();

    // Find matching items and their ancestors
    for (const item of items) {
      if (
        item.title.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query))
      ) {
        matchingIds.add(item.id);

        // Add all ancestors
        let parentId = item.parentId;
        while (parentId) {
          matchingIds.add(parentId);
          const parent = items.find((i) => i.id === parentId);
          parentId = parent?.parentId ?? null;
        }
      }
    }

    return items.filter((item) => matchingIds.has(item.id));
  }, [items, state.searchQuery]);

  // Root level items
  const rootItems = useMemo(
    () => buildTree(filteredItems, currentRootId),
    [filteredItems, currentRootId]
  );

  // State actions
  const toggleExpand = useCallback((id: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { ...prev, expandedIds: newExpanded };
    });
  }, []);

  const toggleSelect = useCallback(
    (id: string, multi = false) => {
      setState((prev) => {
        const newSelected = multi ? new Set(prev.selectedIds) : new Set<string>();

        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }

        return { ...prev, selectedIds: newSelected };
      });
    },
    []
  );

  const setFocused = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, focusedId: id }));
  }, []);

  const startEditing = useCallback((id: string) => {
    setState((prev) => ({ ...prev, editingId: id }));
  }, []);

  const stopEditing = useCallback(() => {
    setState((prev) => ({ ...prev, editingId: null }));
  }, []);

  // Notify selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(state.selectedIds));
  }, [state.selectedIds, onSelectionChange]);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverId(null);

      if (!over || active.id === over.id) return;

      const activeItem = items.find((i) => i.id === active.id);
      const overItem = items.find((i) => i.id === over.id);

      if (!activeItem || !overItem) return;

      // Prevent dropping into descendants
      if (isAncestorOf(items, active.id as string, over.id as string)) {
        return;
      }

      // Determine new parent and position
      let newParentId: string | null;
      let position: number;

      if (overItem.isCollection) {
        // Drop into collection
        newParentId = over.id as string;
        position = 0; // Add at beginning
      } else {
        // Drop next to item - same parent
        newParentId = overItem.parentId;
        const siblings = items.filter((i) => i.parentId === newParentId);
        position = siblings.findIndex((i) => i.id === over.id);
      }

      // Call move action
      await actions.onMove?.(active.id as string, newParentId, position);
    },
    [items, actions]
  );

  // Get active item for overlay
  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  // Context value
  const contextValue: ExplorerContextValue = {
    state,
    actions,
    toggleExpand,
    toggleSelect,
    setFocused,
    startEditing,
    stopEditing,
  };

  return (
    <ExplorerContext.Provider value={contextValue}>
      <div className={cn('flex flex-col h-full', className)}>
        {/* Search bar */}
        {showSearch && (
          <div className="p-2 border-b">
            <Input
              placeholder="Search strands..."
              value={state.searchQuery}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="h-8"
            />
          </div>
        )}

        {/* Breadcrumb */}
        {showBreadcrumb && (
          <div className="px-2 py-1.5 border-b">
            <ExplorerBreadcrumb
              items={items}
              currentId={currentRootId}
              onNavigate={setCurrentRootId}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onCreate?.(currentRootId, 'document')}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onCreate?.(currentRootId, 'collection')}
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            Collection
          </Button>
        </div>

        {/* Tree view */}
        <div className="flex-1 overflow-auto p-2" role="tree">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rootItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {rootItems.map((item) => (
                <SortableItem key={item.id} item={item} items={filteredItems} />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeItem && (
                <DragOverlayItem
                  item={activeItem}
                  count={state.selectedIds.size > 1 ? state.selectedIds.size : 1}
                />
              )}
            </DragOverlay>
          </DndContext>

          {/* Empty state */}
          {rootItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Folder className="h-8 w-8 mb-2" />
              <p className="text-sm">
                {state.searchQuery ? 'No matching strands' : 'No strands yet'}
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => actions.onCreate?.(currentRootId, 'document')}
              >
                Create your first strand
              </Button>
            </div>
          )}
        </div>
      </div>
    </ExplorerContext.Provider>
  );
}

export default StrandExplorer;

