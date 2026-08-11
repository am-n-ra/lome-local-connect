import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  listChatThreads,
  listMessages,
  sendMessage,
  type ChatMessage,
  type ChatThread,
} from "@/lib/chat.functions";
import { useAuth } from "@/lib/auth";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Optional conversation to open directly (buyer side). */
  facilityId?: string | undefined;
  facilityName?: string | undefined;
};

export function ChatPanel({ open, onOpenChange, facilityId, facilityName }: Props) {
  const { user } = useAuth();
  const fetchThreads = useServerFn(listChatThreads);
  const fetchMessages = useServerFn(listMessages);
  const post = useServerFn(sendMessage);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [active, setActive] = useState<{ facilityId: string; buyerId?: string; name: string } | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    if (!user) return;
    try {
      setThreads(await fetchThreads({}));
    } catch {
      setThreads([]);
    }
  }, [fetchThreads, user]);

  const refreshMessages = useCallback(async () => {
    if (!active) return;
    try {
      const res = await fetchMessages({
        data: { facilityId: active.facilityId, ...(active.buyerId ? { buyerId: active.buyerId } : {}) },
      });
      setMessages(res.messages);
    } catch {
      setMessages([]);
    }
  }, [active, fetchMessages]);

  useEffect(() => {
    if (!open) return;
    void refreshThreads();
    if (facilityId) setActive({ facilityId, name: facilityName ?? "Conversation" });
  }, [open, facilityId, facilityName, refreshThreads]);

  useEffect(() => {
    if (!open || !active) return;
    void refreshMessages();
    const id = setInterval(() => void refreshMessages(), 12000);
    return () => clearInterval(id);
  }, [open, active, refreshMessages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function submit() {
    if (!active || !draft.trim()) return;
    setBusy(true);
    try {
      await post({
        data: {
          facilityId: active.facilityId,
          ...(active.buyerId ? { buyerId: active.buyerId } : {}),
          body: draft.trim(),
        },
      });
      setDraft("");
      await refreshMessages();
      await refreshThreads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>{active ? active.name : "Messages"}</SheetTitle>
        </SheetHeader>

        {!user && (
          <p className="p-4 text-sm text-muted-foreground">
            Connectez-vous pour discuter avec les commerçants.
          </p>
        )}

        {user && !active && (
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {threads.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune conversation pour l'instant.</p>
            )}
            {threads.map((t) => (
              <button
                key={`${t.facility_id}-${t.buyer_id}`}
                type="button"
                onClick={() =>
                  setActive({ facilityId: t.facility_id, buyerId: t.buyer_id, name: t.facility_name })
                }
                className="omni-card w-full p-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold">{t.facility_name}</p>
                  {t.unread > 0 && (
                    <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">
                      {t.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">{t.last_body}</p>
              </button>
            ))}
          </div>
        )}

        {user && active && (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {threads.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setActive(null)}
                >
                  ← Toutes les conversations
                </button>
              )}
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Écrivez au commerçant : disponibilité, taille, heure de retrait…
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender_role === "buyer"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.body}
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submit();
                }}
                placeholder="Votre message…"
              />
              <Button size="icon" disabled={busy || !draft.trim()} onClick={() => void submit()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="px-3 pb-3 text-[11px] text-muted-foreground">
              Vos coordonnées personnelles restent masquées : la discussion passe par OmniView.
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
