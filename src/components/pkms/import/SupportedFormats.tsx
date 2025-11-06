'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  Film, 
  Music, 
  Database, 
  Code, 
  Archive,
  BookOpen,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';

const formats = [
  {
    category: 'Documents',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    formats: [
      { ext: '.md', name: 'Markdown', firstClass: true },
      { ext: '.pdf', name: 'PDF', firstClass: true },
      { ext: '.txt', name: 'Plain Text', firstClass: true },
      { ext: '.docx', name: 'Word Document' },
      { ext: '.rtf', name: 'Rich Text' },
      { ext: '.odt', name: 'OpenDocument Text' },
    ]
  },
  {
    category: 'Data',
    icon: Database,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-500/20',
    formats: [
      { ext: '.csv', name: 'CSV', firstClass: true },
      { ext: '.json', name: 'JSON', firstClass: true },
      { ext: '.xlsx', name: 'Excel', firstClass: true },
      { ext: '.xml', name: 'XML' },
      { ext: '.tsv', name: 'Tab-separated' },
      { ext: '.sql', name: 'SQL Database' },
    ]
  },
  {
    category: 'Code',
    icon: Code,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-500/20',
    formats: [
      { ext: '.ipynb', name: 'Jupyter Notebook', firstClass: true },
      { ext: '.py', name: 'Python', firstClass: true },
      { ext: '.js', name: 'JavaScript' },
      { ext: '.ts', name: 'TypeScript' },
      { ext: '.r', name: 'R Script' },
      { ext: '.html', name: 'HTML' },
    ]
  },
  {
    category: 'Media',
    icon: Image,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-500/20',
    formats: [
      { ext: '.jpg', name: 'JPEG Image', firstClass: true },
      { ext: '.png', name: 'PNG Image', firstClass: true },
      { ext: '.mp4', name: 'Video', firstClass: true },
      { ext: '.mp3', name: 'Audio', firstClass: true },
      { ext: '.svg', name: 'SVG Vector' },
      { ext: '.gif', name: 'GIF Animation' },
    ]
  },
  {
    category: 'Notes',
    icon: BookOpen,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
    formats: [
      { ext: '.obsidian', name: 'Obsidian Vault', firstClass: true },
      { ext: '.notion', name: 'Notion Export' },
      { ext: '.roam', name: 'Roam Export' },
      { ext: '.org', name: 'Org Mode' },
      { ext: '.opml', name: 'OPML Outline' },
      { ext: '.enex', name: 'Evernote' },
    ]
  },
  {
    category: 'Archives',
    icon: Archive,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-500/20',
    formats: [
      { ext: '.zip', name: 'ZIP Archive', firstClass: true },
      { ext: '.tar', name: 'TAR Archive' },
      { ext: '.gz', name: 'GZip' },
      { ext: '.folder', name: 'Folder Import' },
    ]
  },
];

export function SupportedFormats() {
  return (
    <section className="border-t border-border/40 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">Supported File Formats</h2>
            <p className="text-muted-foreground">
              Import virtually any type of content. First-class formats have enhanced metadata extraction and analysis.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {formats.map((category) => {
              const Icon = category.icon;
              
              return (
                <Card key={category.category} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className={`rounded-lg ${category.bgColor} p-2`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.formats.map((format) => (
                        <div
                          key={format.ext}
                          className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono">{format.ext}</code>
                            <span className="text-sm">{format.name}</span>
                          </div>
                          {format.firstClass && (
                            <Badge variant="secondary" className="text-xs">
                              First-class
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional info */}
          <div className="mt-8 rounded-lg bg-muted/30 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold">Don't see your format?</h3>
            <p className="text-sm text-muted-foreground">
              OpenStrand can handle most text-based formats. Try importing it anyway - we'll do our best to extract meaningful content.
              For binary formats, we'll store the file and extract available metadata.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
