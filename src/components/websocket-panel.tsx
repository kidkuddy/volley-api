"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRequestStore } from "@/stores/request-store";
import type { WebSocketMessage } from "@/types";
import { ArrowUp, ArrowDown, Trash2, Send } from "lucide-react";
import { v4 as uuid } from "uuid";

export function WebSocketPanel() {
  const [messageInput, setMessageInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs = useRequestStore((s) => s.tabs);
  const activeTabIndex = useRequestStore((s) => s.activeTabIndex);
  const setWsConnected = useRequestStore((s) => s.setWsConnected);
  const addWsMessage = useRequestStore((s) => s.addWsMessage);
  const clearWsMessages = useRequestStore((s) => s.clearWsMessages);
  const resolveUrl = useRequestStore((s) => s.resolveUrl);

  const tab = activeTabIndex >= 0 ? tabs[activeTabIndex] : null;
  const wsConnected = tab?.wsConnected ?? false;
  const messages = tab?.wsMessages ?? [];
  const url = tab?.request.url ?? "";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  function connect() {
    const resolvedUrl = resolveUrl(url);
    try {
      const ws = new WebSocket(resolvedUrl);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (event) => {
        addWsMessage({
          id: uuid(),
          direction: "received",
          data: typeof event.data === "string" ? event.data : "[Binary data]",
          timestamp: Date.now(),
        });
      };
    } catch {
      setWsConnected(false);
    }
  }

  function disconnect() {
    wsRef.current?.close();
    wsRef.current = null;
  }

  function sendMessage() {
    if (!wsRef.current || !messageInput.trim()) return;
    wsRef.current.send(messageInput);
    addWsMessage({
      id: uuid(),
      direction: "sent",
      data: messageInput,
      timestamp: Date.now(),
    });
    setMessageInput("");
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="flex flex-col h-full border-t border-border">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className={`h-2 w-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-muted-foreground/30"}`} />
        <span className="text-xs text-muted-foreground">
          {wsConnected ? "Connected" : "Disconnected"}
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={clearWsMessages}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 h-[250px]">
        <div ref={scrollRef} className="p-2 space-y-1">
          {messages.map((msg: WebSocketMessage) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 px-3 py-1.5 rounded text-xs font-mono ${
                msg.direction === "sent"
                  ? "bg-[#FF6B35]/5 border-l-2 border-[#FF6B35]"
                  : "bg-green-500/5 border-l-2 border-green-500"
              }`}
            >
              {msg.direction === "sent" ? (
                <ArrowUp className="h-3 w-3 mt-0.5 text-[#FF6B35] shrink-0" />
              ) : (
                <ArrowDown className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
              )}
              <span className="text-muted-foreground shrink-0">{formatTime(msg.timestamp)}</span>
              <span className="break-all text-foreground">{msg.data}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              {wsConnected ? "Waiting for messages..." : "Connect to start exchanging messages"}
            </p>
          )}
        </div>
      </ScrollArea>

      {wsConnected && (
        <div className="flex items-center gap-2 p-3 border-t border-border">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="h-8 text-sm font-mono bg-background"
          />
          <Button
            size="sm"
            className="h-8 bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
            onClick={sendMessage}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
