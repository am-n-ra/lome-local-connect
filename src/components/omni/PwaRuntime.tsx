import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRuntime() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const updateConnection = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    updateConnection();
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (offline) {
    return (
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[80] flex justify-center">
        <div className="pointer-events-auto omni-glass flex max-w-md items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-[var(--shadow-soft)]">
          <WifiOff className="h-4 w-4 text-primary" />
          <span>Hors connexion : les actions transactionnelles attendent le réseau.</span>
        </div>
      </div>
    );
  }

  if (!installEvent || dismissed) return null;
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(var(--omni-dock-clearance,5rem)+env(safe-area-inset-bottom)+0.35rem)] z-[60] flex justify-center">
      <div className="pointer-events-auto omni-glass flex w-full max-w-sm items-center gap-2 rounded-full px-2.5 py-2 shadow-[var(--shadow-soft)]">
        <Download className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">Installer Omni</p>
          <p className="truncate text-[10px] text-muted-foreground">Accès rapide à la recherche</p>
        </div>
        <Button size="sm" className="h-8 px-2.5 text-xs" onClick={() => void install()}>
          Installer
        </Button>
        <button
          type="button"
          aria-label="Fermer"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-secondary"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
