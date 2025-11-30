/**
 * Strand Tree View Component
 *
 * Visual tree representation of strand hierarchy with:
 * - Animated expand/collapse
 * - Connection lines between nodes
 * - Drag indicators
 * - Selection highlighting
 *
 * @module components/strand-explorer/StrandTreeView
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES
// ============================================================================

export interface TreeNode {
  id: string;
  title: string;
  slug?: string;
  strandType: string;
  isCollection: boolean;
  depth: number;
  children: TreeNode[];
  tags?: string[];
  childCount?: number;
}

export interface StrandTreeViewProps {
  data: TreeNode;
  selectedId?: string | null;
  expandedIds?: Set<string>;
  onSelect?: (node: TreeNode) => void;
  onExpand?: (nodeId: string) => void;
  onCollapse?: (nodeId: string) => void;
  onDragStart?: (node: TreeNode) => void;
  onDragEnd?: (node: TreeNode, targetId: string | null) => void;
  showLines?: boolean;
  showTags?: boolean;
  showChildCount?: boolean;
  className?: string;
  maxDepth?: number;
}

interface TreeNodeProps {
  node: TreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  isLast: boolean;
  parentPath: boolean[];
  onToggle: () => void;
  onSelect: () => void;
  onDragStart?: () => void;
  showLines: boolean;
  showTags: boolean;
  showChildCount: boolean;
  renderChildren: () => React.ReactNode;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get icon for node type
 */
function getNodeIcon(node: TreeNode, isExpanded: boolean) {
  if (node.isCollection) {
    return isExpanded ? FolderOpen : Folder;
  }

  switch (node.strandType) {
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
 * Get node color based on type
 */
function getNodeColor(node: TreeNode) {
  if (node.isCollection) return 'text-amber-500';

  switch (node.strandType) {
    case 'image':
    case 'media':
      return 'text-purple-500';
    case 'video':
      return 'text-red-500';
    case 'audio':
      return 'text-green-500';
    case 'code':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
}

// ============================================================================
// TREE NODE COMPONENT
// ============================================================================

function TreeNodeComponent({
  node,
  isExpanded,
  isSelected,
  isLast,
  parentPath,
  onToggle,
  onSelect,
  onDragStart,
  showLines,
  showTags,
  showChildCount,
  renderChildren,
}: TreeNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const Icon = getNodeIcon(node, isExpanded);
  const iconColor = getNodeColor(node);
  const hasChildren = node.isCollection && node.children.length > 0;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart?.();
    },
    [node.id, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="relative">
      {/* Connection lines */}
      {showLines && parentPath.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {parentPath.map((showLine, index) => (
            <div
              key={index}
              className="w-5 flex-shrink-0 relative"
            >
              {showLine && (
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />
              )}
            </div>
          ))}
          {/* Horizontal connector */}
          <div className="w-5 flex-shrink-0 relative">
            <div
              className={cn(
                'absolute left-[9px] w-[11px] h-px bg-border',
                isLast ? 'top-[11px]' : 'top-[11px]'
              )}
            />
            {!isLast && (
              <div className="absolute left-[9px] top-[11px] bottom-0 w-px bg-border" />
            )}
          </div>
        </div>
      )}

      {/* Node content */}
      <div
        className={cn(
          'group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent',
          isDragging && 'opacity-50'
        )}
        style={{ marginLeft: showLines ? `${parentPath.length * 20 + 20}px` : `${node.depth * 20}px` }}
        onClick={onSelect}
        onDoubleClick={() => node.isCollection && onToggle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Drag handle */}
        {isHovered && (
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        )}

        {/* Expand/collapse button */}
        {node.isCollection ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon */}
        <Icon className={cn('h-4 w-4 flex-shrink-0', iconColor)} />

        {/* Title */}
        <span className="flex-1 truncate text-sm">{node.title}</span>

        {/* Child count badge */}
        {showChildCount && node.isCollection && node.children.length > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {node.children.length}
          </Badge>
        )}

        {/* Tags */}
        {showTags && node.tags && node.tags.length > 0 && (
          <div className="flex gap-1 ml-2 opacity-60">
            {node.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="h-4 px-1 text-xs">
                {tag}
              </Badge>
            ))}
            {node.tags.length > 2 && (
              <Badge variant="outline" className="h-4 px-1 text-xs">
                +{node.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {renderChildren()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN TREE VIEW COMPONENT
// ============================================================================

/**
 * Visual tree view for strand hierarchy
 *
 * @example
 * ```tsx
 * <StrandTreeView
 *   data={treeData}
 *   selectedId={selectedStrandId}
 *   onSelect={(node) => setSelectedStrandId(node.id)}
 *   showLines
 *   showTags
 *   showChildCount
 * />
 * ```
 */
export function StrandTreeView({
  data,
  selectedId,
  expandedIds: controlledExpandedIds,
  onSelect,
  onExpand,
  onCollapse,
  onDragStart,
  onDragEnd,
  showLines = true,
  showTags = false,
  showChildCount = true,
  className,
  maxDepth = 10,
}: StrandTreeViewProps) {
  // Internal state for expanded nodes if not controlled
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
    new Set([data.id]) // Expand root by default
  );

  const expandedIds = controlledExpandedIds ?? internalExpandedIds;

  const toggleNode = useCallback(
    (nodeId: string) => {
      if (controlledExpandedIds) {
        if (expandedIds.has(nodeId)) {
          onCollapse?.(nodeId);
        } else {
          onExpand?.(nodeId);
        }
      } else {
        setInternalExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(nodeId)) {
            next.delete(nodeId);
          } else {
            next.add(nodeId);
          }
          return next;
        });
      }
    },
    [controlledExpandedIds, expandedIds, onExpand, onCollapse]
  );

  const renderNode = useCallback(
    (node: TreeNode, isLast: boolean, parentPath: boolean[]): React.ReactNode => {
      if (node.depth > maxDepth) return null;

      const isExpanded = expandedIds.has(node.id);
      const isSelected = selectedId === node.id;

      return (
        <TreeNodeComponent
          key={node.id}
          node={node}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isLast={isLast}
          parentPath={parentPath}
          onToggle={() => toggleNode(node.id)}
          onSelect={() => onSelect?.(node)}
          onDragStart={() => onDragStart?.(node)}
          showLines={showLines}
          showTags={showTags}
          showChildCount={showChildCount}
          renderChildren={() =>
            node.children.map((child, index) =>
              renderNode(
                child,
                index === node.children.length - 1,
                [...parentPath, !isLast]
              )
            )
          }
        />
      );
    },
    [
      expandedIds,
      selectedId,
      maxDepth,
      showLines,
      showTags,
      showChildCount,
      toggleNode,
      onSelect,
      onDragStart,
    ]
  );

  return (
    <div className={cn('overflow-auto', className)} role="tree">
      {renderNode(data, true, [])}
    </div>
  );
}

// ============================================================================
// MINI TREE (COMPACT VERSION)
// ============================================================================

interface MiniTreeProps {
  data: TreeNode;
  selectedId?: string | null;
  onSelect?: (node: TreeNode) => void;
  maxItems?: number;
  className?: string;
}

/**
 * Compact tree view for space-constrained UIs
 */
export function MiniTree({
  data,
  selectedId,
  onSelect,
  maxItems = 10,
  className,
}: MiniTreeProps) {
  // Flatten tree to first N items
  const items = useMemo(() => {
    const result: TreeNode[] = [];
    const stack: TreeNode[] = [data];

    while (stack.length > 0 && result.length < maxItems) {
      const node = stack.shift()!;
      result.push(node);

      if (node.isCollection) {
        stack.unshift(...node.children);
      }
    }

    return result;
  }, [data, maxItems]);

  return (
    <div className={cn('space-y-0.5', className)}>
      {items.map((node) => {
        const Icon = getNodeIcon(node, false);
        const isSelected = selectedId === node.id;

        return (
          <button
            key={node.id}
            onClick={() => onSelect?.(node)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-left',
              'hover:bg-accent/50 transition-colors',
              isSelected && 'bg-accent'
            )}
            style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
          >
            <Icon className={cn('h-3.5 w-3.5', getNodeColor(node))} />
            <span className="truncate">{node.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export default StrandTreeView;

