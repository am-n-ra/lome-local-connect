import { useEffect, useState } from 'react';

export type FreshnessLevel = 'fresh' | 'stale' | 'expired';

function computeFreshness(observedAt: string | null): { text: string; level: FreshnessLevel } {
  if (!observedAt) return { text: '', level: 'fresh' };
  const elapsed = Date.now() - new Date(observedAt).getTime();
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return { text: "à l'instant", level: 'fresh' };
  if (minutes < 60) return { text: `il y a ${minutes} min`, level: 'fresh' };
  const hours = Math.floor(minutes / 60);
  if (hours < 4) return { text: `il y a ${hours}h`, level: 'fresh' };
  if (hours < 24) return { text: `il y a ${hours}h`, level: 'stale' };
  const days = Math.floor(hours / 24);
  return { text: `il y a ${days}j`, level: 'expired' };
}

export function useFreshnessTimer(observedAt: string | null): { text: string; level: FreshnessLevel } {
  const [freshness, setFreshness] = useState(() => computeFreshness(observedAt));

  useEffect(() => {
    setFreshness(computeFreshness(observedAt));
    if (!observedAt) return;
    const id = window.setInterval(() => {
      setFreshness(computeFreshness(observedAt));
    }, 30000);
    return () => window.clearInterval(id);
  }, [observedAt]);

  return freshness;
}
