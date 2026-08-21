import { createFileRoute } from "@tanstack/react-router";
import { V2Shell } from "../components/v2/V2Shell";

export const Route = createFileRoute("/")({ component: V2FoundationPage });

function V2FoundationPage() {
  return (
    <V2Shell
      chrome={<span className="v2-chrome-label">Omni V2 · foundation</span>}
      dock={
        <div className="v2-dock-placeholder">
          <span className="v2-dock-dot" aria-hidden="true" />
          <span>La recherche arrive dans la slice S1</span>
        </div>
      }
      sheet={
        <div className="v2-sheet-placeholder">
          <strong>Socle V2 actif</strong>
          <span>La carte, le dock et les feuilles partagent déjà leur surface.</span>
        </div>
      }
    />
  );
}
