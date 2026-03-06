"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KeyValuePair } from "@/types";
import { Trash2, Plus } from "lucide-react";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (id: string, updates: Partial<KeyValuePair>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function KeyValueEditor({ items, onChange, onAdd, onRemove }: KeyValueEditorProps) {
  return (
    <div className="space-y-1">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[32px_1fr_1fr_32px] gap-2 px-1 text-xs font-medium text-muted-foreground">
        <span />
        <span>Key</span>
        <span>Value</span>
        <span />
      </div>
      {items.map((item) => (
        <div key={item.id}>
          {/* Desktop layout: 4-column grid */}
          <div className="hidden md:grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => onChange(item.id, { enabled: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-[#FF6B35] cursor-pointer"
            />
            <Input
              value={item.key}
              onChange={(e) => onChange(item.id, { key: e.target.value })}
              placeholder="Key"
              className="h-8 text-sm bg-background"
            />
            <Input
              value={item.value}
              onChange={(e) => onChange(item.id, { value: e.target.value })}
              placeholder="Value"
              className="h-8 text-sm bg-background"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {/* Mobile layout: stacked rows */}
          <div className="md:hidden space-y-1.5 p-2 rounded-md border border-border/50 mb-1.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => onChange(item.id, { enabled: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-[#FF6B35] cursor-pointer shrink-0"
              />
              <Input
                value={item.key}
                onChange={(e) => onChange(item.id, { key: e.target.value })}
                placeholder="Key"
                className="h-8 text-sm bg-background flex-1"
              />
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Input
                value={item.value}
                onChange={(e) => onChange(item.id, { value: e.target.value })}
                placeholder="Value"
                className="h-8 text-sm bg-background flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-muted-foreground hover:text-foreground"
        onClick={onAdd}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add
      </Button>
    </div>
  );
}
