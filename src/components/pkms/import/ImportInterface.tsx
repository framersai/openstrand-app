'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Database,
  Archive,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils';

interface FilePreview {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    type: string;
    extractedTitle?: string;
    contentPreview?: string;
  };
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  if (type.includes('sheet') || type.includes('csv')) return Database;
  if (type.includes('zip') || type.includes('tar')) return Archive;
  return FileText;
};

export function ImportInterface() {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [importOptions, setImportOptions] = useState({
    extractMetadata: true,
    generateRelationships: true,
    autoTag: true,
    preserveFolderStructure: false,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FilePreview[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: 'pending' as const,
      progress: 0,
      metadata: {
        type: file.type || 'unknown',
      }
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const startImport = async () => {
    setIsProcessing(true);
    
    // Simulate import process
    for (const file of files) {
      if (file.status !== 'pending') continue;
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' as const } : f
      ));

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: i } : f
        ));
      }

      // Simulate processing
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const } : f
      ));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate completion (90% success rate)
      const isSuccess = Math.random() > 0.1;
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              status: isSuccess ? 'success' : 'error',
              error: isSuccess ? undefined : 'Failed to process file',
              metadata: isSuccess ? {
                type: f.metadata?.type || 'unknown',
                extractedTitle: `Extracted: ${f.file.name}`,
                contentPreview: 'Lorem ipsum dolor sit amet...'
              } : f.metadata
            } 
          : f
      ));
    }
    
    setIsProcessing(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const selectedCount = selectedFiles.size;
  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Upload area */}
          <Card className="mb-6 overflow-hidden">
            <div
              {...getRootProps()}
              className={cn(
                "relative cursor-pointer border-2 border-dashed border-border/50 p-12 text-center transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                isDragActive && "border-primary bg-primary/10"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Support for documents, images, videos, datasets, and more
              </p>
              <Button className="mt-4" variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Browse Files
              </Button>
            </div>
          </Card>

          {/* Import options */}
          {files.length > 0 && (
            <Card className="mb-6 p-6">
              <h3 className="mb-4 text-lg font-semibold">Import Options</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3">
                  <Checkbox 
                    checked={importOptions.extractMetadata}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, extractMetadata: !!checked }))
                    }
                  />
                  <div>
                    <div className="font-medium">Extract Metadata</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically extract titles, authors, and dates
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3">
                  <Checkbox 
                    checked={importOptions.generateRelationships}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, generateRelationships: !!checked }))
                    }
                  />
                  <div>
                    <div className="font-medium">Generate Relationships</div>
                    <div className="text-xs text-muted-foreground">
                      Use AI to find connections between files
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3">
                  <Checkbox 
                    checked={importOptions.autoTag}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, autoTag: !!checked }))
                    }
                  />
                  <div>
                    <div className="font-medium">Auto-Tag Content</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically add relevant tags and categories
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3">
                  <Checkbox 
                    checked={importOptions.preserveFolderStructure}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, preserveFolderStructure: !!checked }))
                    }
                  />
                  <div>
                    <div className="font-medium">Preserve Folder Structure</div>
                    <div className="text-xs text-muted-foreground">
                      Maintain original folder hierarchy as collections
                    </div>
                  </div>
                </label>
              </div>
            </Card>
          )}

          {/* File list */}
          {files.length > 0 && (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Files to Import</h3>
                  <Badge variant="secondary">
                    {files.length} files • {formatFileSize(totalSize)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleAllFiles}
                  >
                    {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={startImport}
                    disabled={isProcessing || pendingCount === 0}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Import ${pendingCount} Files`
                    )}
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {files.map((file) => {
                    const Icon = getFileIcon(file.file.type);
                    const isSelected = selectedFiles.has(file.id);
                    
                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-all",
                          isSelected ? "border-primary bg-primary/5" : "border-border",
                          file.status === 'error' && "border-destructive bg-destructive/5"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                          disabled={file.status !== 'pending'}
                        />
                        
                        <Icon className="h-8 w-8 text-muted-foreground" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {file.metadata?.extractedTitle || file.file.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {formatFileSize(file.file.size)}
                            </Badge>
                          </div>
                          
                          {file.metadata?.contentPreview && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                              {file.metadata.contentPreview}
                            </p>
                          )}
                          
                          {file.status === 'uploading' && (
                            <Progress value={file.progress} className="mt-2 h-1" />
                          )}
                          
                          {file.error && (
                            <p className="mt-1 text-xs text-destructive">{file.error}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {file.status === 'pending' && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {file.status === 'uploading' && (
                            <Badge className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Uploading
                            </Badge>
                          )}
                          {file.status === 'processing' && (
                            <Badge className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing
                            </Badge>
                          )}
                          {file.status === 'success' && (
                            <Badge variant="outline" className="gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Complete
                            </Badge>
                          )}
                          {file.status === 'error' && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Error
                            </Badge>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
