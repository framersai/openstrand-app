'use client';

/**
 * @module components/data-uploader
 * @description File upload component with drag-and-drop support for CSV files.
 * Handles file validation and preview generation.
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface DataUploaderProps {
  /** Callback when file is uploaded */
  onFileUpload: (file: File) => Promise<void>;
  /** Whether upload is in progress */
  isProcessing?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Accepted file types */
  acceptedTypes?: string[];
}

/**
 * DataUploader component for handling CSV file uploads
 */
export const DataUploader: React.FC<DataUploaderProps> = ({
  onFileUpload,
  isProcessing = false,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['.csv', '.tsv', 'text/csv', 'text/tab-separated-values'],
}) => {
  const tUpload = useTranslations('datasets.upload');
  const tErrors = useTranslations('datasets.errors');
  const tCommon = useTranslations('common');
  const maxSizeMb = Math.round(maxSize / (1024 * 1024));

  /**
   * Handle file drop/selection
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }
      
      const file = acceptedFiles[0];
      
      // Validate file size
      if (file.size > maxSize) {
        toast.error(tErrors('sizeLimitExceeded', { size: maxSizeMb }));
        return;
      }
      
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['csv', 'tsv'].includes(fileExtension)) {
        toast.error(tErrors('invalidFileType'));
        return;
      }
      
      try {
        await onFileUpload(file);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(tErrors('processingFailed'));
      }
    },
    [maxSize, maxSizeMb, onFileUpload, tErrors]
  );
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });
  
  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer',
        'hover:border-primary/50 hover:bg-muted/50',
        isDragActive && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        isProcessing && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-3">
        {isProcessing ? (
          <>
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-muted animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{tUpload('dropzone.processing')}</p>
              <p className="text-xs text-muted-foreground">{tCommon('status.loading')}</p>
            </div>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-12 w-12 text-primary animate-bounce" />
            <p className="text-sm font-medium text-primary">{tUpload('dropzone.active')}</p>
          </>
        ) : isDragReject ? (
          <>
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm font-medium text-destructive">{tErrors('invalidFileType')}</p>
            <p className="text-xs text-muted-foreground">{tErrors('invalidFileType')}</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{tUpload('dropzone.idle')}</p>
              <p className="text-xs text-muted-foreground">{tUpload('dropzone.or')}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {tUpload('dropzone.supports', { maxSize: maxSizeMb })}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {acceptedTypes.filter((type) => type.startsWith('.')).join(', ') || '.CSV, .TSV'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
