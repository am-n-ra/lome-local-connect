import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Camera, Image as ImageIcon, QrCode, Upload, X, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import type { PublicFacility } from './types';

export function parseFacilityIdFromQr(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  // 1. Check if it's a full URL containing `facility=` query param
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const fac = url.searchParams.get('facility');
      if (fac) return fac;
    }
  } catch {
    // Ignore URL parse failures
  }

  // 2. Check query string format `?facility=...` or `facility=...`
  const match = trimmed.match(/(?:^|[?&])facility=([^&#\s]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  // 3. Raw facility ID format (e.g. fac_... or alphanumeric)
  if (/^[a-zA-Z0-9_-]{3,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function FacilityQrScannerModal(props: {
  onScan: (facilityId: string) => void;
  onClose: () => void;
  sampleFacilities?: PublicFacility[];
}) {
  const [mode, setMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (mode !== 'camera') {
      stopCamera();
      return;
    }

    let isMounted = true;
    setError(null);
    setScanning(true);

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("L'accès à la caméra n'est pas supporté sur ce navigateur.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
          requestAnimationFrame(scanVideoFrame);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Impossible d’accéder à la caméra.';
        setError(`${msg} Utilisez l'import d'image ou la saisie manuelle.`);
        setCameraActive(false);
        setMode('manual');
      }
    }

    void startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [mode]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const facilityId = parseFacilityIdFromQr(code.data);
        if (facilityId) {
          stopCamera();
          props.onScan(facilityId);
          return;
        } else {
          setError(`QR code non reconnu comme une facilité Omni : "${code.data.slice(0, 30)}..."`);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setError('Impossible d’analyser l’image.');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        const facilityId = parseFacilityIdFromQr(code.data);
        if (facilityId) {
          props.onScan(facilityId);
        } else {
          setError(`Le QR code trouvé ("${code.data.slice(0, 30)}...") ne correspond pas à une facilité.`);
        }
      } else {
        setError('Aucun QR code lisible trouvé dans cette image.');
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Impossible de charger cette image.');
    };

    img.src = url;
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const facilityId = parseFacilityIdFromQr(manualInput);
    if (facilityId) {
      props.onScan(facilityId);
    } else {
      setError('Format non reconnu. Entrez un identifiant (ex: fac_01) ou un lien complet.');
    }
  };

  return (
    <section
      className="omni-sheet omni-sheet-enter context-sheet facility-qr-scanner-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      style={{ zIndex: 60 }}
    >
      <div className="sheet-handle" />
      <div className="sheet-head">
        <div>
          <span className="section-kicker">Découverte Omni</span>
          <h2 id="qr-scanner-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1A1C1B' }}>
            Scanner un QR de facilité
          </h2>
        </div>
        <button type="button" onClick={props.onClose} aria-label="Fermer le scanner">
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0 16px', background: '#EAE8E0', padding: 4, borderRadius: 9999 }}>
        <button
          type="button"
          className={`role-option ${mode === 'camera' ? 'active' : ''}`}
          style={{ flex: 1, padding: '6px 12px', fontSize: 13, border: 0, borderRadius: 9999, background: mode === 'camera' ? '#234D40' : 'transparent', color: mode === 'camera' ? '#F9F7F2' : '#1A1C1B', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setMode('camera')}
        >
          <Camera size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> Caméra
        </button>
        <button
          type="button"
          className={`role-option ${mode === 'upload' ? 'active' : ''}`}
          style={{ flex: 1, padding: '6px 12px', fontSize: 13, border: 0, borderRadius: 9999, background: mode === 'upload' ? '#234D40' : 'transparent', color: mode === 'upload' ? '#F9F7F2' : '#1A1C1B', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setMode('upload')}
        >
          <Upload size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> Fichier
        </button>
        <button
          type="button"
          className={`role-option ${mode === 'manual' ? 'active' : ''}`}
          style={{ flex: 1, padding: '6px 12px', fontSize: 13, border: 0, borderRadius: 9999, background: mode === 'manual' ? '#234D40' : 'transparent', color: mode === 'manual' ? '#F9F7F2' : '#1A1C1B', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setMode('manual')}
        >
          <QrCode size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> Saisie
        </button>
      </div>

      {mode === 'camera' && (
        <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto', aspectRatio: '1/1', background: '#000', borderRadius: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div
            style={{
              position: 'absolute',
              width: '70%',
              height: '70%',
              border: '2px dashed rgba(249, 247, 242, 0.85)',
              borderRadius: 16,
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
            }}
          />
          {!cameraActive && (
            <div style={{ position: 'absolute', color: '#F9F7F2', textAlign: 'center', padding: 16 }}>
              <span className="spinner" style={{ marginBottom: 8, display: 'inline-block' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Démarrage de la caméra…</p>
            </div>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div style={{ padding: 24, textAlign: 'center', background: '#F9F7F2', border: '2px dashed #EAE8E0', borderRadius: 18 }}>
          <ImageIcon size={36} color="#234D40" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#1A1C1B', fontWeight: 600 }}>
            Déposez ou sélectionnez une photo du QR code
          </p>
          <label className="primary-button omni-pressable" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 18px' }}>
            <Upload size={16} /> Parcourir l'image
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1C1B' }}>
            Lien ou Identifiant de la facilité
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="ex: https://omni.../?facility=fac_01 ou fac_01"
              style={{
                width: '100%',
                marginTop: 6,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #EAE8E0',
                background: '#FFFFFF',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </label>
          <button
            type="submit"
            className="primary-button omni-pressable"
            disabled={!manualInput.trim()}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            Rechercher la facilité <ArrowRight size={16} />
          </button>
        </form>
      )}

      {error && (
        <div className="inline-error" role="alert" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {props.sampleFacilities && props.sampleFacilities.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #EAE8E0' }}>
          <span className="section-kicker" style={{ fontSize: 11, color: '#234D40', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Raccourcis de test rapide (Facilités visibles)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {props.sampleFacilities.slice(0, 4).map((f) => (
              <button
                key={f.id}
                type="button"
                className="secondary-button"
                style={{ padding: '6px 10px', fontSize: 12, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => props.onScan(f.id)}
              >
                <CheckCircle2 size={12} color="#234D40" /> {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="privacy-note" style={{ marginTop: 16, fontSize: 12, color: 'rgba(26, 28, 27, 0.65)' }}>
        Le QR code de comptoir permet aux clients de trouver instantanément l'établissement et de consulter ses offres vérifiées.
      </p>
    </section>
  );
}
