import { useEffect, useState } from 'react';

type TransactionQrCardProps = {
  transactionId: string;
  token: string;
  expiresAt: string;
};

export function TransactionQrCard({ transactionId, token, expiresAt }: TransactionQrCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    setError('');
    const payload = JSON.stringify({ v: 1, transactionId, token });
    void import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
        color: { dark: '#101820', light: '#ffffff' },
      }))
      .then((url) => {
        if (active) setImageUrl(url);
      }).catch(() => {
        if (active) setError('Le QR ne peut pas être affiché. Utilisez le mode de secours dans Omni.');
      });
    return () => {
      active = false;
    };
  }, [transactionId, token]);

  return (
    <div className="transaction-qr-card" role="status" aria-live="polite">
      {imageUrl ? <img src={imageUrl} alt="QR transactionnel à présenter au vendeur" /> : <div className="omni-skeleton transaction-qr-placeholder" aria-label="Génération du QR transactionnel" />}
      <div className="transaction-qr-copy">
        <strong>{error || 'QR transactionnel prêt'}</strong>
        <small>Valable jusqu’à {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Le vendeur doit le scanner dans Omni.</small>
      </div>
    </div>
  );
}
