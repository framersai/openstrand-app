'use client';

/**
 * @module composer/wizard/TreeNavigator
 * @description Tree navigation for selecting where to place the new strand
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Home,
  Plus,
  Search,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TreeNode } from './types';

interface TreeNavigatorProps {
  selectedPath: string[];
  selectedId: string | null;
  onSelect: (id: string | null, path: string[]) => void;
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>;
}

// Mock data - in real implementation, this would come from API
const MOCK_TREE: TreeNode[] = [
  {
    id: 'root',
    title: 'My Knowledge Base',
    type: 'weave',
    path: [],
    depth: 0,
    isExpanded: true,
    children: [
      {
        id: 'loom-1',
        title: 'Work',
        type: 'loom',
        path: ['Work'],
        depth: 1,
        strandCount: 12,
        children: [
          {
            id: 'folder-1',
            title: 'Projects',
            type: 'folder',
            path: ['Work', 'Projects'],
            depth: 2,
            strandCount: 5,
            children: [],
          },
          {
            id: 'folder-2',
            title: 'Notes',
            type: 'folder',
            path: ['Work', 'Notes'],
            depth: 2,
            strandCount: 7,
            children: [],
          },
        ],
      },
      {
        id: 'loom-2',
        title: 'Personal',
        type: 'loom',
        path: ['Personal'],
        depth: 1,
        strandCount: 8,
        children: [
          {
            id: 'folder-3',
            title: 'Learning',
            type: 'folder',
            path: ['Personal', 'Learning'],
            depth: 2,
            strandCount: 3,
            children: [],
          },
        ],
      },
      {
        id: 'loom-3',
        title: 'Research',
        type: 'loom',
        path: ['Research'],
        depth: 1,
        strandCount: 15,
        children: [],
      },
    ],
  },
];

interface TreeItemProps {
  node: TreeNode;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string, path: string[]) => void;
  onToggle: (id: string) => void;
  searchQuery: string;
}

function TreeItem({ 
  node, 
  selectedId, 
  expandedIds, 
  onSelect, 
  onToggle,
  searchQuery 
}: TreeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  
  // Filter by search
  const matchesSearch = !searchQuery || 
    node.title.toLowerCase().includes(searchQuery.toLowerCase());
  
  const childrenMatchSearch = node.children?.some(child => 
    child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.children?.some(grandchild => 
      grandchild.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (!matchesSearch && !childrenMatchSearch) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id, node.path)}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${(node.depth * 16) + 8}px` }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {node.type === 'folder' || node.type === 'loom' ? (
          isExpanded ? (
            <FolderOpen className={cn(
              "h-4 w-4 flex-shrink-0",
              node.type === 'loom' ? "text-amber-500" : "text-blue-500"
            )} />
          ) : (
            <Folder className={cn(
              "h-4 w-4 flex-shrink-0",
              node.type === 'loom' ? "text-amber-500" : "text-blue-500"
            )} />
          )
        ) : node.type === 'weave' ? (
          <Home className="h-4 w-4 flex-shrink-0 text-purple-500" />
        ) : (
          <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}

        {/* Title */}
        <span className={cn(
          "flex-1 truncate text-sm",
          isSelected && "font-medium"
        )}>
          {node.title}
        </span>

        {/* Count */}
        {node.strandCount !== undefined && node.strandCount > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {node.strandCount}
          </Badge>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeNavigator({
  selectedPath,
  selectedId,
  onSelect,
  onCreateFolder,
}: TreeNavigatorProps) {
  const [tree, setTree] = useState<TreeNode[]>(MOCK_TREE);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // In real implementation, fetch tree from API
  useEffect(() => {
    // fetchTree();
  }, []);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((id: string, path: string[]) => {
    onSelect(id === 'root' ? null : id, path);
  }, [onSelect]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim() || !onCreateFolder) return;
    
    setCreatingFolder(true);
    try {
      await onCreateFolder(selectedId, newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
      // Refresh tree
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, selectedId, onCreateFolder]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Choose location
        </label>
        <p className="text-xs text-muted-foreground">
          Select where to save your new strand in your knowledge base
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search folders..."
          className="pl-9"
        />
      </div>

      {/* Tree */}
      <div className="border border-border rounded-lg bg-card max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-2">
            {tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={handleSelect}
                onToggle={handleToggle}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Path */}
      {selectedPath.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Location:</span>
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            {selectedPath.map((segment, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <span className={i === selectedPath.length - 1 ? "text-foreground font-medium" : ""}>
                  {segment}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create New Folder */}
      {onCreateFolder && (
        <div className="space-y-2">
          {showNewFolder ? (
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creatingFolder}
              >
                {creatingFolder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Create'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolder(true)}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Create new folder{selectedId ? ' here' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

