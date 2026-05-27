'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Send, ShieldAlert, AlertCircle } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { sendMessage, markConversationRead } from '../actions';

interface ChatMessage {
  id: string;
  sender_id: string;
  body: string | null;
  type: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  isBlocked: boolean;
}

export function ChatThread({ conversationId, currentUserId, initialMessages, isBlocked }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to new messages
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel: RealtimeChannel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev; // de-dupe
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Mark messages from the other party as read on mount + when new ones arrive
  useEffect(() => {
    const lastFromOther = messages
      .slice()
      .reverse()
      .find((m) => m.sender_id !== currentUserId && !m.read_at);
    if (lastFromOther) {
      void markConversationRead(conversationId);
    }
  }, [messages, conversationId, currentUserId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistic message
    const optimistic: ChatMessage = {
      id: `local-${crypto.randomUUID()}`,
      sender_id: currentUserId,
      body: trimmed,
      type: 'text',
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');

    startTransition(async () => {
      const result = await sendMessage({ conversation_id: conversationId, body: trimmed });
      if (result.error) {
        setError(result.error);
        // Roll back the optimistic
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setText(trimmed);
      }
      // On success the realtime subscription will deliver the canonical row;
      // we let the dedupe by id handle replacement when we get the server id.
      // For local-* ids we drop them once the server message arrives:
      // (handled by the next render after Realtime push, see below)
    });
  }

  // Drop optimistic local-* messages once we receive a real one from the server
  useEffect(() => {
    setMessages((prev) => {
      const hasReal = prev.some((m) => !m.id.startsWith('local-'));
      if (!hasReal) return prev;
      // For each local-* whose body matches a real message after it, remove it.
      return prev.filter((m, idx) => {
        if (!m.id.startsWith('local-')) return true;
        const realAfter = prev
          .slice(idx + 1)
          .find(
            (r) =>
              !r.id.startsWith('local-') &&
              r.sender_id === m.sender_id &&
              r.body === m.body,
          );
        return !realAfter;
      });
    });
  }, [messages.length]);

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-4">
        <div className="text-center">
          <span className="rounded-full bg-white px-3 py-1 text-xs text-neutral-500 shadow-xs">
            Today
          </span>
        </div>

        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : ''}`}>
              <div
                className={`max-w-md whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? 'rounded-tr-sm bg-primary text-white'
                    : 'rounded-tl-sm bg-white text-neutral-900'
                }`}
              >
                {m.body}
                {mine && m.id.startsWith('local-') && (
                  <span className="ml-2 text-[10px] opacity-60">Sending…</span>
                )}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="py-10 text-center text-sm text-neutral-500">
            No messages yet. Say hello.
          </div>
        )}

        <div className="flex justify-center">
          <div className="flex max-w-md items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
            <ShieldAlert className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>Meet in a public daytime location. Never share OTPs.</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 border-t border-red-200 bg-red-50 p-2 text-xs text-red-900">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {isBlocked ? (
        <div className="border-t border-neutral-200 bg-neutral-100 p-3 text-center text-sm text-neutral-500">
          This conversation is blocked.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t border-neutral-200 p-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="input max-h-32 flex-1 resize-none"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="btn-primary !px-3"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </>
  );
}
