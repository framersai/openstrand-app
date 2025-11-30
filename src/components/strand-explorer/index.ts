/**
 * Strand Explorer Components
 *
 * Components for navigating and organizing strand hierarchies:
 * - StrandExplorer: Full file explorer with drag-and-drop
 * - StrandTreeView: Visual tree representation
 * - StrandBreadcrumb: Navigation breadcrumb
 *
 * @module components/strand-explorer
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

export { StrandExplorer } from './StrandExplorer';
export type {
  StrandExplorerItem,
  ExplorerState,
  ExplorerActions,
  StrandExplorerProps,
} from './StrandExplorer';

export { StrandTreeView, MiniTree } from './StrandTreeView';
export type { TreeNode, StrandTreeViewProps } from './StrandTreeView';

export { StrandBreadcrumb, CompactBreadcrumb } from './StrandBreadcrumb';
export type { BreadcrumbItem, StrandBreadcrumbProps } from './StrandBreadcrumb';

// Re-export hook
export { useCollections } from '@/hooks/use-collections';
export type {
  StrandTreeNode,
  PathElement,
  CollectionChild,
  CollectionWithChildren,
  MoveStrandOptions,
  CopyStrandOptions,
  PropagateOptions,
} from '@/hooks/use-collections';

