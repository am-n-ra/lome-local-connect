import { useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onDetected: (facilityId: string) => void;
  onClose: () => void;
}

const SCANNER_ID = 'omni-public-qr-reader';

// Extract an Omni facility id from a scanned payload: raw uuid, ?facility=<id>, or a URL ending in /<id>.
export function extractFacilityId(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuid.test(text)) return text;
  try {
    const url = new URL(text);
    const param = url.searchParams.get('facility');
    if (param && uuid.test(param)) return param;
    const last = url.pathname.split('/').filter(Boolean).pop() ?? '';
    if (uuid.test(last)) return last;
  } catch {
    const match = text.match(/facility=([0-9a-fA-F-]{36})/);
    if (match && uuid.test(match[1])) return match[1];
  }
  return null;
}

// Maquette QR sheet: real camera scan of a facility public QR -> opens the facility card.
export function PublicQrScannerSheet({ onDetected, onClose }: Props) {
  const [state, setState] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (cancelled || detectedRef.current) return;
          const facilityId = extractFacilityId(decoded);
          if (!facilityId) return;
          detectedRef.current = true;
          onDetectedRef.current(facilityId);
        },
        () => undefined,
      )
      .then(() => { if (!cancelled) setState('scanning'); })
      .catch((caught) => {
        if (cancelled) return;
        setState('error');
        setError(caught instanceof Error ? caught.message : 'La caméra est indisponible. Autorisez l’accès ou vérifiez l’appareil.');
      });
    return () => {
      cancelled = true;
      scanner.stop().then(() => scanner.clear()).catch(() => undefined);
      scannerRef.current = null;
    };
  }, []);

  return (
    <section className="omni-sheet omni-sheet-enter context-sheet" role="dialog" aria-modal="true" aria-label="Scanner un QR" style={{ height: '52%' }}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Scanner un QR</span>
          <h2>Facilité publique</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
      </div>
      <div className="maquette-cardbox" style={{ display: 'grid', placeItems: 'center', padding: 12 }}>
        {state === 'error' ? (
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, padding: 14, textAlign: 'center' }}>
            <CameraOff size={26} aria-hidden="true" />
            <p className="tiny muted" style={{ fontSize: 10 }}>{error}</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 260 }}>
            <div id={SCANNER_ID} style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }} />
            <span className="tiny muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <Camera size={12} aria-hidden="true" /> {state === 'scanning' ? 'Visez le QR de la facilité' : 'Ouverture de la caméra…'}
            </span>
          </div>
        )}
      </div>
      <p className="sub" style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: '#6b6b6b' }}>
        QR public — découvrir les offres. ≠ QR transaction.
      </p>
    </section>
  );
}
