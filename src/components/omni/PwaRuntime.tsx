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
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[80] flex justify-center">
      <div className="pointer-events-auto omni-glass flex w-full max-w-lg items-center gap-3 rounded-2xl p-3 shadow-[var(--shadow-soft)]">
        <Download className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Installer Omni sur cet appareil</p>
          <p className="text-xs text-muted-foreground">
            Recherche plus rapide, même icône, même espace.
          </p>
        </div>
        <Button size="sm" onClick={() => void install()}>
          Installer
        </Button>
        <button
          type="button"
          aria-label="Fermer"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-secondary"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
