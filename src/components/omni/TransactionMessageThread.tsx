import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OmniErrorState, OmniSkeleton } from "@/components/omni/ui/OmniPrimitives";
import { useServerFn } from "@/lib/useServerFn";
import { listMessages, sendMessage, type ChatMessage } from "@/lib/chat.functions";
import { useAuth } from "@/lib/auth";

export function TransactionMessageThread({
  facilityId,
  transactionId,
}: {
  facilityId: string;
  transactionId?: string | null;
}) {
  const { user } = useAuth();
  const fetchMessages = useServerFn(listMessages);
  const post = useServerFn(sendMessage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!user || !transactionId) return;
    setLoading(true);
    try {
      const response = await fetchMessages({ data: { facilityId, transactionId } });
      setMessages(response.messages);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [facilityId, fetchMessages, transactionId, user]);

  useEffect(() => {
    void refresh();
    if (!user || !transactionId) return;
    const interval = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(interval);
  }, [refresh, transactionId, user]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function submit() {
    const body = draft.trim();
    if (!user || !transactionId || !body || busy) return;
    setBusy(true);
    try {
      await post({ data: { facilityId, transactionId, body } });
      setDraft("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message impossible à envoyer.");
    } finally {
      setBusy(false);
    }
  }

  if (!transactionId) {
    return (
      <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
        Le fil de messages sera disponible dès que la transaction sera créée.
      </div>
    );
  }

  return (
    <section
      className="space-y-3 rounded-2xl border border-border p-3"
      aria-label="Messages transactionnels"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Messages transactionnels</p>
          <p className="text-xs text-muted-foreground">
            Les messages restent liés à cette transaction.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold">Fil privé</span>
      </div>

      {loadError ? (
        <OmniErrorState
          title="Messages indisponibles"
          description="La transaction reste active. Réessayez pour recharger le fil."
          onRetry={() => void refresh()}
        />
      ) : loading && messages.length === 0 ? (
        <div className="space-y-2">
          <OmniSkeleton className="h-10 w-4/5" />
          <OmniSkeleton className="ml-auto h-10 w-3/5" />
        </div>
      ) : (
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              Écrivez au commerçant pour confirmer l’heure de retrait ou poser une question.
            </p>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                message.sender_role === "buyer"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <p>{message.body}</p>
              <time className="mt-1 block text-[10px] opacity-70" dateTime={message.created_at}>
                {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
          <div ref={bottom} />
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Écrire un message…"
          aria-label="Message transactionnel"
          disabled={!user || busy}
        />
        <Button
          type="button"
          size="icon"
          aria-label="Envoyer le message"
          disabled={!user || busy || !draft.trim()}
          onClick={() => void submit()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
