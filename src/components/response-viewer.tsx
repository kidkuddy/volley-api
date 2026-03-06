"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResponseData } from "@/types";

function statusClass(status: number) {
  if (status < 300) return "status-2xx";
  if (status < 400) return "status-3xx";
  if (status < 500) return "status-4xx";
  return "status-5xx";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tryFormatJson(text: string): { formatted: string; isJson: boolean } {
  try {
    const parsed = JSON.parse(text);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: text, isJson: false };
  }
}

interface ResponseViewerProps {
  response: ResponseData;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const { formatted, isJson } = tryFormatJson(response.body);

  return (
    <div className="flex flex-col border-t border-border/50">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-border/30 bg-surface-1/50">
        <Badge className={`font-mono text-[11px] border ${statusClass(response.status)}`}>
          {response.status} {response.statusText}
        </Badge>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{response.time}ms</span>
          <span>{formatSize(response.size)}</span>
        </div>
      </div>

      <Tabs defaultValue="body" className="flex-1">
        <TabsList className="h-8 bg-transparent border-b border-border/30 rounded-none w-full justify-start px-3 gap-0">
          <TabsTrigger value="body" className="text-[11px] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-volley rounded-none px-3">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-[11px] data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-volley rounded-none px-3">
            Headers ({Object.keys(response.headers).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="mt-0 flex-1">
          <ScrollArea className="h-[300px]">
            <pre className="p-3 text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all text-foreground/90">
              {isJson ? <code>{formatted}</code> : formatted}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="mt-0">
          <ScrollArea className="h-[300px]">
            <div className="p-3 space-y-0.5">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 py-1 text-[11px] font-mono">
                  <span className="text-volley shrink-0">{key}:</span>
                  <span className="text-foreground/80 break-all">{value}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
