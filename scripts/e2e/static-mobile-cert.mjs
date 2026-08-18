import { readFile } from "node:fs/promises";

const checks = [
  ["root viewport-fit", "src/routes/__root.tsx", "viewport-fit=cover"],
  ["dock safe-area", "src/components/omni/SearchDock.tsx", "env(safe-area-inset-bottom)"],
  ["dock clearance observer", "src/components/omni/SearchDock.tsx", "ResizeObserver"],
  ["search input prevents mobile zoom", "src/components/omni/SearchDock.tsx", "text-base"],
  ["scanner environment camera", "src/components/omni/vendor/CheckoutPanel.tsx", "facingMode: { ideal: \"environment\" }"],
  ["scanner secure context fallback", "src/components/omni/vendor/CheckoutPanel.tsx", "window.isSecureContext"],
  ["scanner visible video preview", "src/components/omni/vendor/CheckoutPanel.tsx", "data-omni-camera-preview"],
  ["scanner inline playback", "src/components/omni/vendor/CheckoutPanel.tsx", "playsInline"],
  ["scanner track cleanup", "src/components/omni/vendor/CheckoutPanel.tsx", "track.stop()"],
  ["scanner manual fallback", "src/lib/camera-scanner.ts", "saisie manuelle disponible"],
];

const failures = [];
for (const [label, path, needle] of checks) {
  const source = await readFile(path, "utf8");
  if (!source.includes(needle)) failures.push({ label, path, needle });
}
console.log(JSON.stringify({ total: checks.length, passed: checks.length - failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
