'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { useRouter } from 'next/navigation';

interface MinimalUploadProps {
  onFileUpload?: (file: File) => void;
  className?: string;
  variant?: 'inline' | 'card';
}

export function MinimalUpload({ 
  onFileUpload,
  className,
  variant = 'inline'
}: MinimalUploadProps) {
  const router = useRouter();
  const buildPath = useLocalizedPath();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (onFileUpload) {
      onFileUpload(file);
    } else {
      // Redirect to full import page with file
      const formData = new FormData();
      formData.append('file', file);
      // Store in sessionStorage to pass to import page
      sessionStorage.setItem('pendingFile', file.name);
      router.push(buildPath('/pkms/import'));
    }
  }, [onFileUpload, router, buildPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    noClick: variant === 'inline',
  });

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div {...getRootProps()} className="relative">
          <input {...getInputProps()} />
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "gap-2 transition-all",
              isDragActive && "border-primary bg-primary/5"
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Quick Upload
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">or</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(buildPath('/pkms/import'))}
          className="gap-2"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Full Import
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all",
        "hover:border-primary/50 hover:bg-primary/5",
        isDragActive && "border-primary bg-primary/10",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full bg-primary/10 p-3 transition-transform group-hover:scale-110">
          <Plus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isDragActive ? 'Drop to upload' : 'Upload Dataset'}
          </p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or click
          </p>
        </div>
      </div>
    </div>
  );
}
