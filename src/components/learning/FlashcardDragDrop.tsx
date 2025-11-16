'use client';

/**
 * @module FlashcardDragDrop
 * @description Drag-and-drop reordering for flashcard decks
 * 
 * Features:
 * - @dnd-kit/core for smooth drag interactions
 * - Visual feedback during drag
 * - Keyboard accessibility
 * - Bulk selection support
 */

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface FlashcardContent {
  text: string;
  images?: string[];
  latex?: string;
}

interface Flashcard {
  id: string;
  front: FlashcardContent;
  back: FlashcardContent;
  deck: string;
  tags: string[];
  reviews: number;
  ease: number;
  due: Date;
}

interface FlashcardDragDropProps {
  flashcards: Flashcard[];
  onReorder: (reordered: Flashcard[]) => void;
  onEdit?: (flashcard: Flashcard) => void;
  onDelete?: (ids: string[]) => void;
  enableBulkActions?: boolean;
}

interface SortableFlashcardProps {
  flashcard: Flashcard;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit?: (flashcard: Flashcard) => void;
  enableBulkActions?: boolean;
}

function SortableFlashcard({
  flashcard,
  isSelected,
  onSelect,
  onEdit,
  enableBulkActions,
}: SortableFlashcardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flashcard.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-50'
      )}
    >
      <Card
        className={cn(
          'transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Selection Checkbox */}
            {enableBulkActions && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(flashcard.id, checked as boolean)}
                className="mt-1"
              />
            )}

            {/* Card Content */}
            <div className="flex-1 space-y-2">
              <div className="font-medium text-sm">
                {flashcard.front.text}
              </div>
              <div className="text-xs text-muted-foreground">
                {flashcard.tags.length > 0 && (
                  <span>Tags: {flashcard.tags.join(', ')}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{flashcard.reviews} reviews</span>
                <span>•</span>
                <span>Ease: {flashcard.ease.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(flashcard)}
                aria-label="Edit flashcard"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FlashcardDragDrop({
  flashcards,
  onReorder,
  onEdit,
  onDelete,
  enableBulkActions = true,
}: FlashcardDragDropProps) {
  const [items, setItems] = useState(flashcards);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);
      onReorder(reordered);
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {enableBulkActions && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

      {/* Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((flashcard) => (
              <SortableFlashcard
                key={flashcard.id}
                flashcard={flashcard}
                isSelected={selectedIds.has(flashcard.id)}
                onSelect={handleSelect}
                onEdit={onEdit}
                enableBulkActions={enableBulkActions}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}


