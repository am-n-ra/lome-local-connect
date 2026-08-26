import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';
import type { QrVerificationResult, TransactionState } from './types';

type CameraState = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'error';

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

type SellerTransactionPanelProps = {
  transactionId: string;
  setTransactionId: (value: string) => void;
  qrPayload: string;
  setQrPayload: (value: string) => void;
  verifyState: 'idle' | 'loading' | 'error' | 'success';
  verifyError: string;
  onVerifyQr: () => void;
  verification: QrVerificationResult | null;
  transactionState: TransactionState;
  paymentState: 'idle' | 'loading' | 'error' | 'success';
  paymentError: string;
  onConfirmPayment: () => void;
  transitionState: 'idle' | 'loading' | 'error' | 'success';
  transitionError: string;
  onAdvanceFulfilment: () => void;
  onAdvanceFulfilled: () => void;
};

function money(minor: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(minor);
}

export function SellerTransactionPanel(props: SellerTransactionPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const frameRef = useRef<number | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState('');

  const stopCamera = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  };

  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      setCameraError('La caméra QR n’est pas disponible dans ce navigateur. Utilisez la saisie manuelle de secours.');
      return;
    }
    setCameraState('starting');
    setCameraError('');
    try {
      const detector = new Detector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      detectorRef.current = detector;
      if (!videoRef.current) throw new Error('Aperçu caméra indisponible.');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState('scanning');
      const scan = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          const value = codes.find((code) => typeof code.rawValue === 'string' && code.rawValue.length > 0)?.rawValue;
          if (value) {
            props.setQrPayload(value);
            stopCamera();
            return;
          }
        } catch {
          setCameraState('error');
          setCameraError('La caméra n’a pas pu lire ce QR. Gardez-le dans le cadre ou utilisez la saisie manuelle.');
          stopCamera();
          return;
        }
        frameRef.current = requestAnimationFrame(() => { void scan(); });
      };
      frameRef.current = requestAnimationFrame(() => { void scan(); });
    } catch (caught) {
      stopCamera();
      setCameraState('error');
      setCameraError(caught instanceof DOMException && caught.name === 'NotAllowedError' ? 'Accès caméra refusé. Autorisez la caméra ou utilisez la saisie manuelle.' : 'La caméra ne peut pas démarrer. Utilisez la saisie manuelle de secours.');
    }
  };

  return <div className="seller-transaction-panel">
    <div className="notice-card"><strong>Scanner le QR transactionnel Buyer</strong><p>Le Buyer vous présente son QR. Omni vérifie côté serveur la transaction, l’offre et le snapshot lié au compte Buyer. Le QR public de facilité ne peut pas remplacer ce QR.</p></div>
    <div className="seller-scanner-actions">
      <button className="primary-button omni-pressable" type="button" onClick={() => void startCamera()} disabled={cameraState === 'starting' || cameraState === 'scanning'} aria-busy={cameraState === 'starting'}><QrCode size={16} />{cameraState === 'starting' ? 'Ouverture de la caméra…' : cameraState === 'scanning' ? 'QR recherché dans le cadre…' : 'Scanner avec la caméra'}</button>
      {cameraState === 'scanning' && <button className="secondary-button omni-pressable" type="button" onClick={stopCamera}>Arrêter la caméra</button>}
    </div>
    {(cameraState === 'scanning' || cameraState === 'error') && <div className="seller-camera-frame"><video ref={videoRef} muted playsInline aria-label="Aperçu de la caméra pour scanner le QR transactionnel" />{cameraState === 'scanning' && <span>Placez le QR Buyer dans le cadre</span>}</div>}
    {(cameraError || cameraState === 'unsupported') && <div className="inline-error" role="alert">{cameraError}</div>}
    <label className="seller-message-field">Donnée QR lue ou collée en secours<textarea value={props.qrPayload} onChange={(event) => props.setQrPayload(event.target.value)} rows={3} placeholder='Le scanner remplira cette zone automatiquement' /></label>
    <label className="seller-message-field">Transaction ID de secours<input value={props.transactionId} onChange={(event) => props.setTransactionId(event.target.value)} placeholder="UUID si le QR ne peut pas être lu" autoComplete="off" /></label>
    {props.verifyError && <div className="inline-error" role="alert">{props.verifyError}</div>}
    <button className="secondary-button wide omni-pressable" type="button" aria-busy={props.verifyState === 'loading'} disabled={props.verifyState === 'loading' || !props.qrPayload.trim()} onClick={props.onVerifyQr}>{props.verifyState === 'loading' ? 'Vérification serveur…' : 'Vérifier le QR Buyer'} <ShieldCheck size={16} /></button>
    {props.verifyState === 'success' && props.verification && <div className="seller-checkout-summary" role="status"><div className="seller-response-success"><CheckCircle2 size={22} /><div><strong>Transaction vérifiée</strong><p>Le snapshot serveur est chargé. Vérifiez le prix affiché avant d’accepter le paiement.</p></div></div><div className="seller-checkout-facts"><span><b>Produit</b><small>{props.verification.productName ?? 'Offre catalogue'}<em className="seller-fact-id">{props.verification.productId}</em></small></span><span><b>Quantité</b><small>{props.verification.quantity}</small></span><span><b>Prix unitaire</b><small>{money(props.verification.unitPriceMinor ?? 0)}</small></span><span><b>Réduction</b><small>{props.verification.couponCode ?? 'Aucune'}</small></span><span><b>Total net</b><small>{money(props.verification.netAmountMinor ?? 0)}</small></span></div></div>}
    {props.transactionState === 'qr_verified' && <button className="primary-button omni-pressable" type="button" aria-busy={props.paymentState === 'loading'} disabled={props.paymentState === 'loading'} onClick={props.onConfirmPayment}>{props.paymentState === 'loading' ? 'Confirmation…' : 'Paiement reçu au comptoir'} <CheckCircle2 size={16} /></button>}
    {props.paymentState === 'success' && props.transactionState === 'payment_confirmed' && <div className="seller-response-success" role="status"><CheckCircle2 size={22} /><div><strong>Paiement confirmé</strong><p>Préparez maintenant la remise au Buyer.</p></div></div>}
    {props.paymentError && <div className="inline-error" role="alert">{props.paymentError}</div>}
    {props.transactionState === 'payment_confirmed' && <button className="secondary-button wide omni-pressable" type="button" aria-busy={props.transitionState === 'loading'} disabled={props.transitionState === 'loading'} onClick={props.onAdvanceFulfilment}>{props.transitionState === 'loading' ? 'Préparation…' : 'Préparer la remise'} <ArrowRight size={16} /></button>}
    {props.transactionState === 'fulfilment_pending' && <button className="primary-button omni-pressable" type="button" aria-busy={props.transitionState === 'loading'} disabled={props.transitionState === 'loading'} onClick={props.onAdvanceFulfilled}>{props.transitionState === 'loading' ? 'Validation…' : 'Marquer comme remis'} <CheckCircle2 size={16} /></button>}
    {props.transactionState === 'fulfilled' && <div className="seller-response-success" role="status"><CheckCircle2 size={22} /><div><strong>Remise enregistrée</strong><p>Le Buyer peut maintenant confirmer la réception. La notation sera demandée avant la clôture.</p></div></div>}
    {props.transitionError && <div className="inline-error" role="alert">{props.transitionError}</div>}
  </div>;
}
