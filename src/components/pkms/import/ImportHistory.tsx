'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Image, 
  Database, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatRelativeTime, formatFileSize } from '@/lib/utils';

interface ImportRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'success' | 'partial' | 'failed';
  importedAt: string;
  strandCount: number;
  errors?: string[];
  metadata?: {
    extractedTitle?: string;
    concepts?: string[];
    relationships?: number;
  };
}

// Mock data for demonstration
const mockImportHistory: ImportRecord[] = [
  {
    id: '1',
    fileName: 'machine-learning-notes.md',
    fileType: 'text/markdown',
    fileSize: 45678,
    status: 'success',
    importedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    strandCount: 12,
    metadata: {
      extractedTitle: 'Machine Learning Fundamentals',
      concepts: ['neural networks', 'supervised learning', 'deep learning'],
      relationships: 8
    }
  },
  {
    id: '2',
    fileName: 'research-papers.zip',
    fileType: 'application/zip',
    fileSize: 15234567,
    status: 'partial',
    importedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    strandCount: 45,
    errors: ['3 PDFs could not be parsed', '1 file was corrupted'],
    metadata: {
      relationships: 23
    }
  },
  {
    id: '3',
    fileName: 'dataset-analysis.ipynb',
    fileType: 'application/x-ipynb+json',
    fileSize: 234567,
    status: 'success',
    importedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    strandCount: 5,
    metadata: {
      extractedTitle: 'Customer Segmentation Analysis',
      concepts: ['k-means', 'clustering', 'data visualization'],
      relationships: 12
    }
  },
  {
    id: '4',
    fileName: 'project-documentation.pdf',
    fileType: 'application/pdf',
    fileSize: 3456789,
    status: 'failed',
    importedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    strandCount: 0,
    errors: ['PDF is password protected'],
  },
];

const getFileIcon = (type: string) => {
  if (type.includes('image')) return Image;
  if (type.includes('data') || type.includes('csv') || type.includes('json')) return Database;
  return FileText;
};

const getStatusConfig = (status: ImportRecord['status']) => {
  switch (status) {
    case 'success':
      return { 
        icon: CheckCircle, 
        color: 'text-green-600 dark:text-green-400', 
        bgColor: 'bg-green-100 dark:bg-green-500/20',
        label: 'Success' 
      };
    case 'partial':
      return { 
        icon: AlertCircle, 
        color: 'text-amber-600 dark:text-amber-400', 
        bgColor: 'bg-amber-100 dark:bg-amber-500/20',
        label: 'Partial' 
      };
    case 'failed':
      return { 
        icon: XCircle, 
        color: 'text-red-600 dark:text-red-400', 
        bgColor: 'bg-red-100 dark:bg-red-500/20',
        label: 'Failed' 
      };
  }
};

export function ImportHistory() {
  const [filter, setFilter] = useState<'all' | 'success' | 'partial' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = mockImportHistory.filter(record => {
    if (filter !== 'all' && record.status !== filter) return false;
    if (searchQuery && !record.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="border-t border-border/40 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Import History</CardTitle>
                  <CardDescription>
                    Review your previously imported files and their processing status
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'success' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('success')}
                    className="gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </Button>
                  <Button
                    variant={filter === 'partial' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('partial')}
                    className="gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Partial
                  </Button>
                  <Button
                    variant={filter === 'failed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('failed')}
                    className="gap-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Failed
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="h-9 rounded-md border border-input bg-background px-9 py-1 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Import records */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredRecords.map((record) => {
                    const FileIcon = getFileIcon(record.fileType);
                    const statusConfig = getStatusConfig(record.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div
                        key={record.id}
                        className="rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30"
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-muted p-2">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {record.metadata?.extractedTitle || record.fileName}
                                </h4>
                                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{formatFileSize(record.fileSize)}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatRelativeTime(record.importedAt)}
                                  </span>
                                  {record.strandCount > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{record.strandCount} strands created</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <Badge
                                variant="outline"
                                className={`gap-1 ${statusConfig.color} ${statusConfig.bgColor} border-current`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            {/* Metadata */}
                            {record.metadata && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {record.metadata.concepts?.map((concept) => (
                                  <Badge key={concept} variant="secondary" className="text-xs">
                                    {concept}
                                  </Badge>
                                ))}
                                {record.metadata.relationships && (
                                  <Badge variant="outline" className="text-xs">
                                    {record.metadata.relationships} relationships
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {/* Errors */}
                            {record.errors && record.errors.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {record.errors.map((error, index) => (
                                  <p key={index} className="text-xs text-destructive">
                                    • {error}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredRecords.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      No import records found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
