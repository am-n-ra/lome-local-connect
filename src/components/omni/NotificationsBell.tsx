import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listNotifications, type NotificationRow } from "@/lib/omni.functions";
import { markNotificationsRead } from "@/lib/checkout.functions";
import { useAuth } from "@/lib/auth";

export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetchNotifications = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setItems(await fetchNotifications({}));
    } catch {
      setItems([]);
    }
  }, [fetchNotifications, user]);

  useEffect(() => {
    void refresh();
    if (!user) return;
    const id = window.setInterval(() => void refresh(), 60000);
    return () => window.clearInterval(id);
  }, [refresh, user]);

  const unread = items.filter((n) => !n.read_at).length;

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      await refresh();
      if (unread > 0) {
        try {
          await markRead({});
          setItems((prev) =>
            prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
          );
        } catch {
          /* silencieux */
        }
      }
    }
  }

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={(v) => void onOpenChange(v)}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="omni-glass relative h-10 w-10 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        className="w-[min(20rem,calc(100vw-1.5rem))] p-0"
      >
        <p className="border-b border-border px-3 py-2 text-sm font-semibold">Notifications</p>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">Aucune notification.</p>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              className="block w-full border-b border-border px-3 py-2 text-left last:border-0 hover:bg-secondary"
              onClick={() => {
                setOpen(false);
                if (n.link) navigate({ to: n.link });
              }}
            >
              <span className="block text-sm font-medium">{n.title}</span>
              {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
              <span className="block text-[11px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString("fr-FR")}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
