import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, ScanLine, ShieldCheck, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { getAuthToken } from '../auth';
import { verifyQrToken } from './api';
import { cameraStatusLabel } from '../lib/camera-scanner';

interface Props {
  onClose: () => void;
  onVerified: (accepted: boolean, detail: string) => void;
}

const SCANNER_ID = 'omni-seller-qr-reader';

// Payload scannable: `transactionId:token` brut, ou URL `…?txn=<id>&qr=<token>`.

export function extractTransactionPayload(raw: string): { transactionId: string; tokenHash: string } | null {
  const text = raw.trim();
  if (!text) return null;
  const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const colon = text.split(':');
  if (colon.length === 2 && uuid.test(colon[0].trim()) && colon[1].trim().length >= 8) {
    return { transactionId: colon[0].trim(), tokenHash: colon[1].trim() };
  }
  try {
    const url = new URL(text);
    const txn = url.searchParams.get('txn') ?? url.searchParams.get('transactionId');
    const tok = url.searchParams.get('qr') ?? url.searchParams.get('token');
    if (txn && uuid.test(txn) && tok && tok.length >= 8) return { transactionId: txn, tokenHash: tok };
  } catch { /* pas une URL — on garde la forme brute */ }
  return null;
}

export function SellerQrScannerSheet({ onClose, onVerified }: Props) {
  const [state, setState] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ accepted: boolean; detail: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const doneRef = useRef(false);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const verify = useCallback(async (payload: string) => {
    if (doneRef.current) return;
    const parsed = extractTransactionPayload(payload);
    if (!parsed) { setError('QR ou code illisible — attendez `<transactionId>:<jeton>`.'); return; }
    setBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) { setError('Connectez-vous pour vérifier un QR.'); return; }
      const res = await verifyQrToken({ transactionId: parsed.transactionId, tokenHash: parsed.tokenHash, token });
      if (res.ok && res.data?.accepted) {
        doneRef.current = true;
        setResult({ accepted: true, detail: 'QR vérifié — bon pour encaissement.' });
        onVerifiedRef.current(true, 'QR vérifié — bon pour encaissement.');
      } else {
        setResult({ accepted: false, detail: res.data?.reason ?? res.error?.message ?? 'QR non vérifié.' });
        onVerifiedRef.current(false, res.data?.reason ?? res.error?.message ?? 'QR non vérifié.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Vérification indisponible.');
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    const teardown = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => undefined);
      scannerRef.current = null;
    };
    const stopOnHidden = () => {
      if (document.visibilityState === 'hidden') {
        cancelled = true;
        teardown();
        if (!doneRef.current) setState('starting');
      }
    };
    document.addEventListener('visibilitychange', stopOnHidden);
    (async () => {
      try {
        stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled || !stream) { stream?.getTracks().forEach((track) => track.stop()); return; }
        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;
        await scanner
          .start(
            { facingMode: { ideal: 'environment' } } ,
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decoded) => { if (!cancelled) void verify(decoded); },
            () => undefined,
          );
        if (cancelled) { teardown(); return; }
        setState('scanning');
      } catch (caught) {
        if (cancelled) return;
        setState('error');
        setError(caught instanceof Error ? caught.message : 'La caméra est indisponible. Autorisez l’accès ou saisissez le code.');
      }
    })();
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', stopOnHidden);
      teardown();
    };
  }, [state, verify]);


  return (
    <section className="sheet h-mid" data-sheet="seller-qr" role="dialog" aria-modal="false" aria-label="Scanner un QR transaction">
      <div className="handle" />
      <div className="sheet-head">
        <div>
          <div className="eyebrow">Scanner transaction</div>
          <h1>Vérifier le QR du client</h1>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
      </div>
      {error && <p className="sub" role="alert">{error}</p>}
      {result && (
        <p className="sub" role="status" style={{ color: result.accepted ? 'var(--ok)' : 'var(--warn)' }}>
          {result.detail}
        </p>
      )}
      <div className="cardbox" style={{ display: 'grid', placeItems: 'center', padding: 12 }}>
        {state === 'starting' ? (
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, padding: 14, textAlign: 'center' }}>
            <Camera size={26} aria-hidden="true" />
            <p className="tiny muted" style={{ fontSize: 10 }}>Prêt à scanner ?</p>
            <button className="btn sm" type="button" onClick={() => setState('scanning')}><Camera size={14} /> Autoriser et démarrer la caméra</button>
            <span className="tiny muted" style={{ fontSize: 9 }}>La caméra ne démarre pas toute seule. Vous pouvez aussi saisir le code ci-dessous.</span>
          </div>
        ) : state === 'error' ? (
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, padding: 14, textAlign: 'center' }}>
            <CameraOff size={26} aria-hidden="true" />
            <p className="tiny muted" style={{ fontSize: 10 }}>{error}</p>
            <button className="btn ghost sm" type="button" onClick={() => { setState('starting'); setError(''); }}><RefreshCw size={13} /> Réessayer</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 260 }}>
            <div id={SCANNER_ID} style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }} />
            <span className="tiny muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <Camera size={12} aria-hidden="true" /> {cameraStatusLabel(state === 'scanning' ? 'active' : 'permission_pending')}
            </span>
          </div>
        )}
      </div>
      <div className="cardbox" style={{ marginTop: 8 }}>
        <label className="tiny muted" htmlFor="omni-seller-qr-manual" style={{ display: 'block', marginBottom: 4 }}>Saisir le code</label>
        <div className="row" style={{ gap: 6 }}>
          <input id="omni-seller-qr-manual" value={manual} onChange={(event) => setManual(event.target.value)} placeholder="transactionId:jeton" aria-label="Code QR" style={{ flex: 1, minWidth: 0 }} />
          <button className="btn sm" type="button" disabled={busy || manual.trim().length < 8} onClick={() => void verify(manual)}><ScanLine size={14} /> Vérifier</button>
        </div>
      </div>
      <p className="tiny muted" style={{ marginTop: 7 }}>
        <ShieldCheck size={12} /> Le scan marque la transaction vérifiée côté caisse — preuve d'encaissement.
      </p>
    </section>
  );
}
