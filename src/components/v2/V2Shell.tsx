import type { ReactNode } from "react";

type V2ShellProps = {
  children?: ReactNode;
  chrome?: ReactNode;
  dock?: ReactNode;
  sheet?: ReactNode;
};

export function V2Shell({ children, chrome, dock, sheet }: V2ShellProps) {
  return (
    <main className="v2-app-shell" aria-label="Omni V2 application">
      <section className="v2-scene" aria-label="Map scene">
        <div className="v2-scene-placeholder" aria-label="Map scene reserved for the next slice">
          <span className="v2-scene-orbit" aria-hidden="true" />
          <p>Omni V2 map scene</p>
        </div>
      </section>
      <header className="v2-chrome" aria-label="Application controls">
        {chrome ?? <span className="v2-chrome-label">V2 foundation</span>}
      </header>
      <section className="v2-dock" aria-label="Primary dock">
        {dock ?? <span>Search dock reserved for S1</span>}
      </section>
      <section className="v2-sheet-slot" aria-label="Active sheet">
        {sheet ?? <span>No active sheet</span>}
      </section>
      {children}
    </main>
  );
}
