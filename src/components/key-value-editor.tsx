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
      <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 px-1 text-xs font-medium text-muted-foreground">
        <span />
        <span>Key</span>
        <span>Value</span>
        <span />
      </div>
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center">
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
