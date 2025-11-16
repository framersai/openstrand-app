'use client';

/**
 * @module BulkTagEditor
 * @description Bulk tag editing for flashcards and quizzes
 * 
 * Features:
 * - Multi-select with checkboxes
 * - Add tags to all selected items
 * - Remove tags from all selected items
 * - Tag suggestions from existing tags
 * - Chip-based UI for easy management
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BulkTagEditorProps {
  /** Items to edit (with id and tags) */
  items: Array<{ id: string; tags: string[]; title?: string }>;
  
  /** Selected item IDs */
  selectedIds: string[];
  
  /** Callback when tags are updated */
  onUpdate: (itemId: string, newTags: string[]) => void;
  
  /** Optional: Existing tags in the system for suggestions */
  existingTags?: string[];
  
  /** Trigger button content */
  trigger?: React.ReactNode;
}

export function BulkTagEditor({
  items,
  selectedIds,
  onUpdate,
  existingTags = [],
  trigger,
}: BulkTagEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [commonTags, setCommonTags] = useState<string[]>([]);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  // Calculate common tags across selected items
  useEffect(() => {
    if (selectedItems.length === 0) {
      setCommonTags([]);
      return;
    }

    const tagCounts = new Map<string, number>();
    selectedItems.forEach((item) => {
      item.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Tags present in ALL selected items
    const common = Array.from(tagCounts.entries())
      .filter(([_, count]) => count === selectedItems.length)
      .map(([tag]) => tag);

    setCommonTags(common);
  }, [selectedItems]);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tagsToAdd.includes(trimmed)) {
      setTagsToAdd([...tagsToAdd, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveFromAdd = (tag: string) => {
    setTagsToAdd(tagsToAdd.filter((t) => t !== tag));
  };

  const handleToggleRemove = (tag: string) => {
    if (tagsToRemove.includes(tag)) {
      setTagsToRemove(tagsToRemove.filter((t) => t !== tag));
    } else {
      setTagsToRemove([...tagsToRemove, tag]);
    }
  };

  const handleApply = () => {
    selectedItems.forEach((item) => {
      let newTags = [...item.tags];

      // Add new tags
      tagsToAdd.forEach((tag) => {
        if (!newTags.includes(tag)) {
          newTags.push(tag);
        }
      });

      // Remove tags
      newTags = newTags.filter((tag) => !tagsToRemove.includes(tag));

      onUpdate(item.id, newTags);
    });

    // Reset state
    setTagsToAdd([]);
    setTagsToRemove([]);
    setIsOpen(false);
  };

  const suggestedTags = existingTags.filter(
    (tag) => !tagsToAdd.includes(tag) && !commonTags.includes(tag)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" disabled={selectedIds.length === 0}>
            <Tag className="h-4 w-4 mr-2" />
            Edit Tags ({selectedIds.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit Tags</DialogTitle>
          <DialogDescription>
            Editing tags for {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Tags Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Add Tags</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag and press Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button onClick={handleAddTag} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags to Add */}
            {tagsToAdd.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tagsToAdd.map((tag) => (
                  <Badge key={tag} variant="default" className="gap-1">
                    <Plus className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveFromAdd(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setTagsToAdd([...tagsToAdd, tag])}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Remove Tags Section */}
          {commonTags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">
                Remove Common Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => {
                  const isMarkedForRemoval = tagsToRemove.includes(tag);
                  return (
                    <div
                      key={tag}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer transition-colors',
                        isMarkedForRemoval
                          ? 'bg-destructive/10 border-destructive'
                          : 'hover:bg-accent'
                      )}
                      onClick={() => handleToggleRemove(tag)}
                    >
                      <Checkbox checked={isMarkedForRemoval} />
                      <span className="text-sm">{tag}</span>
                      {isMarkedForRemoval && (
                        <X className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Preview</h4>
            <div className="text-sm text-muted-foreground">
              {tagsToAdd.length > 0 && (
                <p>✓ Will add: {tagsToAdd.join(', ')}</p>
              )}
              {tagsToRemove.length > 0 && (
                <p>✗ Will remove: {tagsToRemove.join(', ')}</p>
              )}
              {tagsToAdd.length === 0 && tagsToRemove.length === 0 && (
                <p>No changes yet</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={tagsToAdd.length === 0 && tagsToRemove.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

