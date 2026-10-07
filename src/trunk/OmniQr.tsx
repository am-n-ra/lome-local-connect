import { QRCodeSVG } from 'qrcode.react';

/**
 * Le QR de transaction Omni — une seule définition, partagée par le flux acheteur et la Room.
 *
 * Contrat (Heartwood S1) :
 * - encode `transactionId:token` (le payload que `SellerQrScannerSheet` décode) ;
 * - **modules sombres sur fond blanc** : un QR clair-sur-sombre se lit mal, voire pas du tout ;
 * - monochrome (`--ink` sur blanc) — jamais l'accent, réservé à la confiance (design.md §30).
 *
 * Utiliser `qrPayload()` pour construire `value` afin que le rendu et le scanner restent d'accord.
 */
export function OmniQr({ value, size = 168 }: { value: string; size?: number }) {
  return (
    <span className="omni-qr" role="img" aria-label="QR Omni">
      <QRCodeSVG value={value} size={size} level="M" bgColor="#ffffff" fgColor="#0f0f0f" marginSize={1} />
    </span>
  );
}
