'use client';

/**
 * @module composer/wizard/MediaUploader
 * @description Multi-file media upload with preview and categorization
 */

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MediaFile } from './types';

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
};

const TYPE_ICONS: Record<MediaFile['type'], React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  other: File,
};

interface MediaUploaderProps {
  files: MediaFile[];
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function MediaUploader({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMb = 50,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileType = useCallback((mimeType: string): MediaFile['type'] => {
    for (const [type, mimes] of Object.entries(ACCEPTED_TYPES)) {
      if (mimes.includes(mimeType)) {
        return type as MediaFile['type'];
      }
    }
    return 'other';
  }, []);

  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(undefined);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: MediaFile[] = [];
    const filesToProcess = Array.from(fileList).slice(0, maxFiles - files.length);

    for (const file of filesToProcess) {
      // Check size
      if (file.size > maxSizeMb * 1024 * 1024) {
        continue;
      }

      const preview = await createPreview(file);
      
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        type: getFileType(file.type),
        size: file.size,
        preview,
        status: 'pending',
      });
    }

    onFilesChange([...files, ...newFiles]);
  }, [files, maxFiles, maxSizeMb, createPreview, getFileType, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  const clearAll = useCallback(() => {
    onFilesChange([]);
  }, [onFilesChange]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border bg-muted/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={Object.values(ACCEPTED_TYPES).flat().join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className={cn(
            "p-3 rounded-full transition-colors",
            isDragging ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-6 w-6",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="font-medium">
              {isDragging ? 'Drop files here' : 'Drag & drop files'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <ImageIcon className="h-3 w-3" />
              Images
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <Video className="h-3 w-3" />
              Videos
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <Music className="h-3 w-3" />
              Audio
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              Documents
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Max {maxSizeMb}MB per file · Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>

          <div className="grid gap-2">
            {files.map((file) => {
              const Icon = TYPE_ICONS[file.type];
              
              return (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card",
                    file.status === 'error' && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  {/* Preview/Icon */}
                  {file.preview ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                      file.type === 'image' && "bg-blue-500/10",
                      file.type === 'video' && "bg-purple-500/10",
                      file.type === 'audio' && "bg-green-500/10",
                      file.type === 'document' && "bg-orange-500/10",
                      file.type === 'other' && "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        file.type === 'image' && "text-blue-500",
                        file.type === 'video' && "text-purple-500",
                        file.type === 'audio' && "text-green-500",
                        file.type === 'document' && "text-orange-500",
                        file.type === 'other' && "text-muted-foreground"
                      )} />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatSize(file.size)}</span>
                      <span>·</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {file.type}
                      </Badge>
                    </div>
                    
                    {/* Progress */}
                    {file.status === 'uploading' && typeof file.progress === 'number' && (
                      <Progress value={file.progress} className="h-1 mt-2" />
                    )}
                    
                    {/* Error */}
                    {file.status === 'error' && file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>

                  {/* Status/Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {file.status === 'uploaded' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add More */}
          {files.length < maxFiles && (
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add more files
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

