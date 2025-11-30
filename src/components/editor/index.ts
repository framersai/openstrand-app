/**
 * Editor Components
 *
 * Full-featured strand editing components including:
 * - WYSIWYG/Markdown editor with live preview
 * - Auto-saving drafts
 * - Publishing to database or GitHub
 * - Template selection
 *
 * @module components/editor
 * @author OpenStrand <team@frame.dev>
 * @since 2.1.0
 */

export { StrandEditor } from './StrandEditor';
export type {
  StrandMetadata,
  EditorDraft,
  PublishTarget,
  EditorMode,
  EditorSyntax,
  SaveStatus,
  StrandEditorProps,
} from './StrandEditor';

export { TemplateSelector, QuickTemplates } from './TemplateSelector';
export type { TemplateSelectorProps } from './TemplateSelector';

// Re-export hook
export { useStrandEditor } from '@/hooks/use-strand-editor';
export type { UseStrandEditorOptions } from '@/hooks/use-strand-editor';

// Re-export GitHub service types
export type { StrandTemplate } from '@/services/github.service';

