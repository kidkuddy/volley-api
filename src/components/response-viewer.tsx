"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResponseData } from "@/types";

function statusColor(status: number) {
  if (status < 300) return "bg-green-600/20 text-green-400 border-green-600/30";
  if (status < 400) return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
  if (status < 500) return "bg-orange-600/20 text-orange-400 border-orange-600/30";
  return "bg-red-600/20 text-red-400 border-red-600/30";
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
    <div className="flex flex-col border-t border-border">
      <div className="flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-2 border-b border-border bg-muted/30">
        <Badge className={`font-mono text-xs ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {response.time} ms
        </span>
        <span className="text-xs text-muted-foreground">
          {formatSize(response.size)}
        </span>
      </div>

      <Tabs defaultValue="body" className="flex-1">
        <TabsList className="h-9 bg-transparent border-b border-border rounded-none w-full justify-start px-4">
          <TabsTrigger value="body" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs data-[state=active]:bg-muted rounded-sm">
            Headers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="mt-0 flex-1">
          <ScrollArea className="h-[300px]">
            <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all text-foreground">
              {isJson ? (
                <code>{formatted}</code>
              ) : (
                formatted
              )}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="mt-0">
          <ScrollArea className="h-[300px]">
            {/* Table layout for md+ screens */}
            <table className="hidden md:table w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Header</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key} className="border-b border-border/50">
                    <td className="px-4 py-1.5 font-mono text-[#FF6B35]">{key}</td>
                    <td className="px-4 py-1.5 font-mono text-foreground break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Stacked card layout for mobile */}
            <div className="md:hidden space-y-2 p-3">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="rounded-md border border-border/50 p-2">
                  <div className="text-xs font-mono font-medium text-[#FF6B35] mb-0.5">{key}</div>
                  <div className="text-xs font-mono text-foreground break-all">{value}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
