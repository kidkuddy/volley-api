"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Loader2, Upload, ClipboardPaste } from "lucide-react";

interface OpenApiImporterProps {
  workspaceId: string;
  onImport: () => void;
  trigger?: React.ReactNode;
}

export function OpenApiImporter({ workspaceId, onImport, trigger }: OpenApiImporterProps) {
  const [open, setOpen] = useState(false);
  const [specText, setSpecText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ folders: number; requests: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(spec: string) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/import-openapi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to import spec");
        return;
      }

      const data = await res.json();
      setResult({ folders: data.foldersCreated, requests: data.requestsCreated });
      onImport();
    } catch {
      setError("Failed to import. Check that the spec is valid.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSpecText(text);
    };
    reader.readAsText(file);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setResult(null); setError(""); } }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-xs">
            <FileUp className="mr-1.5 h-3.5 w-3.5" />
            Import OpenAPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Import OpenAPI Spec</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <FileUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Import successful</p>
              <p className="text-xs text-muted-foreground mt-1">
                Created {result.folders} folder{result.folders !== 1 ? "s" : ""} and {result.requests} request{result.requests !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setOpen(false); setResult(null); setSpecText(""); }}
              className="border-border/30"
            >
              Done
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="paste" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1 text-xs">
                <ClipboardPaste className="mr-1.5 h-3.5 w-3.5" />
                Paste
              </TabsTrigger>
              <TabsTrigger value="file" className="flex-1 text-xs">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3 mt-3">
              <Textarea
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                placeholder='Paste your OpenAPI/Swagger JSON or YAML spec here...'
                className="min-h-[200px] font-mono text-xs bg-surface-2 border-border/30 resize-y"
              />
            </TabsContent>

            <TabsContent value="file" className="space-y-3 mt-3">
              <div
                className="border-2 border-dashed border-border/30 rounded-lg p-8 text-center hover:border-volley/30 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">.json, .yaml, .yml</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
              {specText && (
                <p className="text-xs text-muted-foreground">
                  File loaded ({specText.length.toLocaleString()} chars)
                </p>
              )}
            </TabsContent>

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-volley hover:bg-volley-hover text-white font-medium mt-3"
              onClick={() => handleImport(specText)}
              disabled={loading || !specText.trim()}
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Import Spec
            </Button>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
