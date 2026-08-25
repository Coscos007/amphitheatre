import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../shared-types.ts";

export function useUnreadChat({
  messages,
  selfId,
  chatVisible,
  enabled,
}: {
  messages: ChatMessage[];
  selfId?: string;
  chatVisible: boolean;
  enabled: boolean;
}): number {
  const [unread, setUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const seenIds = useRef(new Set<string>());
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (!enabled) {
      seenIds.current.clear();
      setReady(false);
      setUnread(0);
      return;
    }
    const timer = window.setTimeout(() => {
      for (const message of messagesRef.current) seenIds.current.add(message.id);
      setReady(true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !ready) return;
    if (chatVisible) {
      for (const message of messages) seenIds.current.add(message.id);
      setUnread(0);
      return;
    }
    let count = 0;
    for (const message of messages) {
      if (seenIds.current.has(message.id)) continue;
      if (selfId && message.userId === selfId) {
        seenIds.current.add(message.id);
        continue;
      }
      count += 1;
    }
    setUnread(count);
  }, [messages, chatVisible, selfId, enabled, ready]);

  return unread;
}
