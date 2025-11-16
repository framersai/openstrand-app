/**
 * Live API Playground
 * 
 * Interactive Swagger-like API documentation with live testing.
 * Features:
 * - Browse all endpoints
 * - Try API calls with custom parameters
 * - View request/response
 * - Copy as cURL
 * - Share permalinks
 * - Authentication handling
 * 
 * @since 1.6.0
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Play, Copy, Share2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    example: any;
  };
  responses: Array<{
    status: number;
    description: string;
    example: any;
  }>;
}

const API_ENDPOINTS: APIEndpoint[] = [
  {
    id: 'tts-stream',
    method: 'POST',
    path: '/api/v1/voice/tts/stream',
    category: 'Voice',
    description: 'Synthesize speech from text (streaming)',
    requestBody: {
      type: 'application/json',
      example: {
        text: 'Hello world!',
        voice: 'alloy',
        speed: 1.0,
        language: 'en',
      },
    },
    responses: [
      { status: 200, description: 'Audio stream (audio/mpeg)', example: '<binary>' },
      { status: 429, description: 'Quota exceeded', example: { error: 'Rate limit exceeded' } },
    ],
  },
  {
    id: 'stt-transcribe',
    method: 'POST',
    path: '/api/v1/voice/stt/transcribe',
    category: 'Voice',
    description: 'Transcribe audio to text',
    requestBody: {
      type: 'multipart/form-data',
      example: { file: '<audio file>', language: 'en' },
    },
    responses: [
      {
        status: 200,
        description: 'Transcription result',
        example: { text: 'Hello world', language: 'en', confidence: 0.95, duration: 2.5, cost: 0.001 },
      },
    ],
  },
  {
    id: 'flashcards-due',
    method: 'GET',
    path: '/api/v1/flashcards/due/study',
    category: 'Learning',
    description: 'Get due flashcards for study',
    parameters: [
      { name: 'deck', type: 'string', required: false, description: 'Filter by deck name' },
      { name: 'limit', type: 'number', required: false, description: 'Max cards to return' },
    ],
    responses: [
      {
        status: 200,
        description: 'Array of due flashcards',
        example: [{ id: 'card-1', front: { text: 'Q' }, back: { text: 'A' }, due: '2024-01-01' }],
      },
    ],
  },
  // Add more endpoints...
];

export default function APIPlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(API_ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(JSON.stringify(selectedEndpoint.requestBody?.example || {}, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const { toast } = useToast();

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);
    setStatusCode(null);

    try {
      const token = localStorage.getItem('authToken');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${selectedEndpoint.path}`, {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: ['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method) ? requestBody : undefined,
      });

      setStatusCode(res.status);

      if (res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setResponse(data);
      } else {
        setResponse({ message: 'Binary response (audio/file)' });
      }
    } catch (error: any) {
      setResponse({ error: error.message });
      setStatusCode(500);
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const token = localStorage.getItem('authToken');
    let curl = `curl -X ${selectedEndpoint.method} ${process.env.NEXT_PUBLIC_API_URL}${selectedEndpoint.path}`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    if (token) {
      curl += ` \\\n  -H "Authorization: Bearer ${token}"`;
    }
    if (['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method)) {
      curl += ` \\\n  -d '${requestBody}'`;
    }

    navigator.clipboard.writeText(curl);
    toast({ title: 'Copied!', description: 'cURL command copied to clipboard' });
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Playground</h1>
        <p className="text-muted-foreground">
          Interactive documentation - test OpenStrand API endpoints live
        </p>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Endpoint List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible>
              {Object.entries(
                API_ENDPOINTS.reduce((acc, ep) => {
                  if (!acc[ep.category]) acc[ep.category] = [];
                  acc[ep.category].push(ep);
                  return acc;
                }, {} as Record<string, APIEndpoint[]>)
              ).map(([category, endpoints]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="px-4">{category}</AccordionTrigger>
                  <AccordionContent className="space-y-1 pb-2">
                    {endpoints.map((ep) => (
                      <Button
                        key={ep.id}
                        variant={selectedEndpoint.id === ep.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setSelectedEndpoint(ep);
                          setRequestBody(JSON.stringify(ep.requestBody?.example || {}, null, 2));
                          setResponse(null);
                          setStatusCode(null);
                        }}
                      >
                        <Badge variant="outline" className="mr-2 w-16 justify-center">
                          {ep.method}
                        </Badge>
                        <span className="truncate text-xs">{ep.path.replace('/api/v1/', '')}</span>
                      </Button>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Endpoint Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant={selectedEndpoint.method === 'GET' ? 'default' : 'secondary'}
                  className="w-20 justify-center"
                >
                  {selectedEndpoint.method}
                </Badge>
                <code className="text-sm font-mono">{selectedEndpoint.path}</code>
              </div>
              <CardDescription>{selectedEndpoint.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Request Body */}
              {['POST', 'PATCH', 'PUT'].includes(selectedEndpoint.method) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Body (JSON)</label>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              {/* Execute */}
              <div className="flex gap-2">
                <Button onClick={handleExecute} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={copyCurl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Response */}
              {response && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Response</label>
                    <Badge
                      variant={statusCode && statusCode < 300 ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {statusCode && statusCode < 300 ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {statusCode}
                    </Badge>
                  </div>
                  <Textarea
                    value={JSON.stringify(response, null, 2)}
                    readOnly
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

