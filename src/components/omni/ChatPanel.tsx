import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@/lib/useServerFn";
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
import {
  confirmProductReceived,
  submitTransactionRating,
  declareTransactionPayment,
  selectTransactionPaymentPreference,
  createTransactionQr,
  getTransactionTimeline,
  type BuyerOrder,
  type TransactionTimeline,
} from "@/lib/checkout.functions";
import { TransactionThreadCard } from "@/components/omni/TransactionThreadCard";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Optional conversation to open directly (buyer side). */
  facilityId?: string | undefined;
  facilityName?: string | undefined;
  transactionContext?:
    | {
        status: string;
        amountLabel: string;
        qrCode?: string | null;
        transactionId?: string | null;
      }
    | undefined;
};

export function ChatPanel({
  open,
  onOpenChange,
  facilityId,
  facilityName,
  transactionContext,
}: Props) {
  const { user } = useAuth();
  const fetchThreads = useServerFn(listChatThreads);
  const fetchMessages = useServerFn(listMessages);
  const post = useServerFn(sendMessage);
  const fetchTimeline = useServerFn(getTransactionTimeline);
  const regenerateTransactionQr = useServerFn(createTransactionQr);
  const selectPayment = useServerFn(selectTransactionPaymentPreference);
  const declarePaymentServer = useServerFn(declareTransactionPayment);
  const confirmReceived = useServerFn(confirmProductReceived);
  const submitRatingServer = useServerFn(submitTransactionRating);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [active, setActive] = useState<{
    facilityId: string;
    buyerId?: string;
    transactionId?: string;
    name: string;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [transactionBusy, setTransactionBusy] = useState(false);
  const [transactionTimeline, setTransactionTimeline] = useState<TransactionTimeline | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const transactionId = transactionContext?.transactionId ?? null;

  const refreshThreads = useCallback(async () => {
    if (!user) return;
    try {
      setThreads(await fetchThreads({}));
    } catch {
      setThreads([]);
    }
  }, [fetchThreads, user]);

  const refreshTransaction = useCallback(async () => {
    if (!transactionId) {
      setTransactionTimeline(null);
      return;
    }
    try {
      setTransactionTimeline(await fetchTimeline({ data: { transactionId } }));
    } catch {
      setTransactionTimeline(null);
    }
  }, [fetchTimeline, transactionId]);

  const refreshMessages = useCallback(async () => {
    if (!active) return;
    try {
      const res = await fetchMessages({
        data: {
          facilityId: active.facilityId,
          ...(active.buyerId ? { buyerId: active.buyerId } : {}),
          ...(active.transactionId ? { transactionId: active.transactionId } : {}),
        },
      });
      setMessages(res.messages);
    } catch {
      setMessages([]);
    }
  }, [active, fetchMessages]);

  useEffect(() => {
    if (!open) return;
    void refreshThreads();
    if (facilityId)
      setActive({
        facilityId,
        ...(transactionId ? { transactionId } : {}),
        name: facilityName ?? "Conversation",
      });
  }, [open, facilityId, facilityName, refreshThreads, transactionId]);

  useEffect(() => {
    if (!open || !transactionId) {
      setTransactionTimeline(null);
      return;
    }
    void refreshTransaction();
    const interval = window.setInterval(() => void refreshTransaction(), 12000);
    return () => window.clearInterval(interval);
  }, [open, refreshTransaction, transactionId]);

  useEffect(() => {
    if (!open || !active || transactionContext) return;
    void refreshMessages();
    const id = setInterval(() => void refreshMessages(), 12000);
    return () => clearInterval(id);
  }, [open, active, refreshMessages, transactionContext]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function runTransactionAction(action: () => Promise<unknown>) {
    setTransactionBusy(true);
    try {
      await action();
      await refreshTransaction();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action transactionnelle impossible.");
    } finally {
      setTransactionBusy(false);
    }
  }

  async function submit() {
    if (!active || !draft.trim()) return;
    setBusy(true);
    try {
      await post({
        data: {
          facilityId: active.facilityId,
          ...(active.buyerId ? { buyerId: active.buyerId } : {}),
          ...(active.transactionId ? { transactionId: active.transactionId } : {}),
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
      <SheetContent
        side="bottom"
        className="flex max-h-[min(88dvh,48rem)] w-[min(calc(100vw-1.5rem),34rem)] flex-col gap-0 rounded-t-[1.75rem] p-0 sm:rounded-[1.5rem]"
      >
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>{active ? active.name : "Messages"}</SheetTitle>
          {transactionContext && !transactionTimeline && (
            <div className="mt-2 rounded-xl bg-secondary/70 p-2 text-left text-xs">
              <div className="flex items-center justify-between gap-2 font-semibold">
                <span>Conversation transactionnelle</span>
                <span className="rounded-full bg-background px-2 py-0.5">
                  {transactionContext.status}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Total : {transactionContext.amountLabel}
                {transactionContext.qrCode ? ` · QR ${transactionContext.qrCode}` : ""}
              </p>
            </div>
          )}
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
                  setActive({
                    facilityId: t.facility_id,
                    buyerId: t.buyer_id,
                    name: t.facility_name,
                  })
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

        {user && active && transactionContext && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {transactionTimeline ? (
              <TransactionThreadCard
                order={toBuyerOrder(transactionTimeline)}
                timeline={transactionTimeline}
                busy={transactionBusy}
                onRegenerateQr={() =>
                  void runTransactionAction(() =>
                    regenerateTransactionQr({ data: { transactionId: transactionTimeline.transaction.id } }),
                  )
                }
                onSelectPayment={(method) =>
                  void runTransactionAction(() =>
                    selectPayment({
                      data: { transactionId: transactionTimeline.transaction.id, method },
                    }),
                  )
                }
                onDeclarePayment={() =>
                  void runTransactionAction(() =>
                    declarePaymentServer({
                      data: { transactionId: transactionTimeline.transaction.id },
                    }),
                  )
                }
                onConfirmReceived={() =>
                  void runTransactionAction(() =>
                    confirmReceived({
                      data: { transactionId: transactionTimeline.transaction.id },
                    }),
                  )
                }
                onSubmitRating={(rating, comment) =>
                  void runTransactionAction(() =>
                    submitRatingServer({
                      data: {
                        transactionId: transactionTimeline.transaction.id,
                        rating,
                        comment,
                      },
                    }),
                  )
                }
                onRetry={() => void refreshTransaction()}
              />
            ) : (
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                Chargement du fil transactionnel…
              </p>
            )}
          </div>
        )}

        {user && active && !transactionContext && (
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

function toBuyerOrder(timeline: TransactionTimeline): BuyerOrder {
  const transaction = timeline.transaction;
  return {
    id: transaction.id,
    source: "intent",
    facility_id: transaction.facility_id,
    facility_name: transaction.facility_name,
    status: transaction.status,
    created_at: transaction.intent_created_at ?? new Date().toISOString(),
    total: transaction.amount,
    items: [
      {
        name: "Intention d’achat",
        quantity: 1,
        price_at_time: transaction.amount,
      },
    ],
    qr_token: transaction.qr_token,
    qr_expires_at: transaction.qr_expires_at,
    transaction_id: transaction.id,
    transaction_status: transaction.status,
    intent_created_at: transaction.intent_created_at,
    payment_mode: transaction.payment_mode,
    amount: transaction.amount,
    platform_fee: null,
  };
}
