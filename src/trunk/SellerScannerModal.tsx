import React, { useState } from 'react';
import { X, Camera, Zap, CheckCircle2, QrCode, RefreshCw } from 'lucide-react';

export interface SellerScannerModalProps {
  onClose: () => void;
  onScanSuccess?: (code: string) => Promise<boolean | void> | void;
}

export function SellerScannerModal({ onClose, onScanSuccess }: SellerScannerModalProps) {
  const [flashlight, setFlashlight] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const handleSimulateScan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 800));
    const mockToken = 'OMNI-INTENT-' + Math.floor(100000 + Math.random() * 900000);
    setScannedResult(mockToken);
    setScanning(false);

    if (onScanSuccess) {
      await onScanSuccess(mockToken);
    }
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="seller-scanner-title">
      <section className="omni-sheet omni-sheet-enter omni-keyboard-aware context-sheet seller-scanner-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <span className="section-kicker">Scanner Vendeur Omni</span>
            <h2 id="seller-scanner-title">Scanner un QR client</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="camera-viewfinder-container">
          <div className={`camera-viewfinder-box ${flashlight ? 'flashlight-on' : ''}`}>
            <div className="viewfinder-frame">
              <div className="viewfinder-corner top-left" />
              <div className="viewfinder-corner top-right" />
              <div className="viewfinder-corner bottom-left" />
              <div className="viewfinder-corner bottom-right" />
              <div className="viewfinder-laser" />
            </div>

            <div className="viewfinder-controls">
              <button
                type="button"
                className={`flash-toggle-btn ${flashlight ? 'active' : ''}`}
                onClick={() => setFlashlight(!flashlight)}
                aria-label={flashlight ? 'Éteindre le flash' : 'Allumer le flash'}
              >
                <Zap size={18} />
              </button>
            </div>
          </div>
          <p className="scanner-instruction">
            Pointez la caméra vers le QR d’intention d’achat ou de coupon présenté par le client au comptoir.
          </p>
        </div>

        {scannedResult ? (
          <div className="seller-response-success omni-card-enter" role="status">
            <CheckCircle2 size={20} />
            <div>
              <strong>QR Code validé !</strong>
              <small>Code: {scannedResult}</small>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="primary-button wide omni-pressable"
            onClick={handleSimulateScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <RefreshCw size={16} className="spin-icon" /> Analyse du QR en cours…
              </>
            ) : (
              <>
                <QrCode size={18} /> Simuler le scan QR au comptoir
              </>
            )}
          </button>
        )}

        <button type="button" className="secondary-button wide omni-pressable" onClick={onClose}>
          Fermer le scanner
        </button>
      </section>
    </div>
  );
}
