/**
 * @module composer/wizard/types
 * @description Type definitions for the Strand Creation Wizard
 */

export type CreationType = 'strand' | 'folder';

export type SourceType = 'blank' | 'file' | 'url' | 'media' | 'markdown';

export type WizardStep = 
  | 'source'      // Choose source type
  | 'input'       // Input based on source (URL, file upload, markdown editor)
  | 'location'    // Tree navigation for where to place
  | 'metadata'    // Tags, categorization
  | 'analysis'    // AI analysis, deduplication
  | 'review';     // Final review

export interface StrandCreationData {
  type: CreationType;
  sourceType: SourceType;
  title: string;
  summary: string;
  content: string;
  difficulty: string;
  tags: string[];
  prerequisites: string[];
  estimatedTime: number;
  visibility: 'private' | 'public' | 'unlisted' | 'team';
  parentId: string | null;
  parentPath: string[];
  // Source-specific data
  sourceUrl?: string;
  sourceMetadata?: UrlMetadata;
  mediaFiles?: MediaFile[];
  markdownTemplate?: string;
}

export interface UrlMetadata {
  url: string;
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  siteName?: string;
  type?: string;
  author?: string;
  publishedDate?: string;
  content?: string;
  extractedText?: string;
}

export interface MediaFile {
  id: string;
  file: File;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  size: number;
  preview?: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress?: number;
  error?: string;
}

export interface TreeNode {
  id: string;
  title: string;
  type: 'folder' | 'strand' | 'loom' | 'weave';
  children?: TreeNode[];
  path: string[];
  depth: number;
  isExpanded?: boolean;
  strandCount?: number;
}

export interface DuplicateMatch {
  id: string;
  title: string;
  similarity: number;
  matchType: 'exact' | 'similar' | 'related';
  path: string[];
}

export interface AIAnalysis {
  suggestedTags: Array<{ tag: string; confidence: number }>;
  suggestedDifficulty: { level: string; reason: string };
  suggestedPrerequisites: Array<{ id: string; title: string; confidence: number }>;
  suggestedLocation: { id: string; path: string[]; reason: string } | null;
  duplicates: DuplicateMatch[];
  contentSummary?: string;
  estimatedReadTime?: number;
  keyTopics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface WizardStepConfig {
  id: WizardStep;
  title: string;
  description: string;
  icon: string;
  optional?: boolean;
  condition?: (data: Partial<StrandCreationData>) => boolean;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  { 
    id: 'source', 
    title: 'Source', 
    description: 'Choose how to create your strand',
    icon: 'Plus'
  },
  { 
    id: 'input', 
    title: 'Content', 
    description: 'Add your content',
    icon: 'FileText'
  },
  { 
    id: 'location', 
    title: 'Location', 
    description: 'Choose where to save',
    icon: 'FolderTree'
  },
  { 
    id: 'metadata', 
    title: 'Details', 
    description: 'Tags and categorization',
    icon: 'Tags'
  },
  { 
    id: 'analysis', 
    title: 'Analysis', 
    description: 'AI insights & deduplication',
    icon: 'Brain',
    optional: true
  },
  { 
    id: 'review', 
    title: 'Review', 
    description: 'Confirm and create',
    icon: 'CheckCircle'
  },
];

export const SOURCE_OPTIONS: Array<{
  type: SourceType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'blank',
    title: 'Blank Strand',
    description: 'Start with an empty strand or folder',
    icon: 'FileText',
  },
  {
    type: 'markdown',
    title: 'Markdown Template',
    description: 'Start with a rich markdown template',
    icon: 'FileCode',
  },
  {
    type: 'file',
    title: 'Upload File',
    description: 'CSV, JSON, PDF, or any document',
    icon: 'Upload',
  },
  {
    type: 'url',
    title: 'Import from URL',
    description: 'Scrape and import from any webpage',
    icon: 'Link',
  },
  {
    type: 'media',
    title: 'Media Upload',
    description: 'Images, videos, audio files',
    icon: 'Image',
  },
];

export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'No prior knowledge required', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some foundational knowledge needed', color: 'yellow' },
  { value: 'advanced', label: 'Advanced', description: 'Significant prior knowledge required', color: 'orange' },
  { value: 'expert', label: 'Expert', description: 'Deep expertise assumed', color: 'red' },
];

export const MARKDOWN_TEMPLATES = [
  {
    id: 'note',
    title: 'Quick Note',
    description: 'Simple note with title and content',
    template: `# {{title}}

{{summary}}

## Notes

Write your notes here...

## References

- 
`,
  },
  {
    id: 'article',
    title: 'Article',
    description: 'Structured article with sections',
    template: `# {{title}}

> {{summary}}

## Introduction

Start with an introduction...

## Main Content

### Section 1

Content here...

### Section 2

More content...

## Conclusion

Wrap up your article...

## References

1. 
`,
  },
  {
    id: 'tutorial',
    title: 'Tutorial',
    description: 'Step-by-step learning guide',
    template: `# {{title}}

**Difficulty:** {{difficulty}}
**Estimated Time:** {{estimatedTime}} minutes

## Overview

{{summary}}

## Prerequisites

- List prerequisites here

## Steps

### Step 1: Getting Started

Description...

### Step 2: Next Step

Description...

### Step 3: Final Step

Description...

## Summary

What you learned...

## Next Steps

- What to learn next
`,
  },
  {
    id: 'research',
    title: 'Research Notes',
    description: 'Academic-style research notes',
    template: `# {{title}}

## Abstract

{{summary}}

## Background

Context and prior work...

## Methodology

Approach taken...

## Findings

Key discoveries...

## Discussion

Analysis and implications...

## Conclusion

Summary of contributions...

## References

1. 
`,
  },
  {
    id: 'meeting',
    title: 'Meeting Notes',
    description: 'Meeting agenda and notes',
    template: `# {{title}}

**Date:** {{date}}
**Attendees:** 

## Agenda

1. 
2. 
3. 

## Discussion

### Topic 1

Notes...

### Topic 2

Notes...

## Action Items

- [ ] Task 1 - @assignee
- [ ] Task 2 - @assignee

## Next Meeting

Date and topics...
`,
  },
];

