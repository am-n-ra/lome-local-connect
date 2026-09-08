import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

type OnboardV13Props = { pendingSearch: string; onClose: () => void; onComplete: () => void };

type ObStep = 1 | 2 | 3;

export function OnboardV13({ pendingSearch, onClose, onComplete }: OnboardV13Props) {
  const [step, setStep] = useState<ObStep>(1);
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [busy, setBusy] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 2) return;
    setTimer(30);
    setCanResend(false);
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(id); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const sendCode = useCallback(() => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep(2); }, 600);
  }, []);

  const verifyCode = useCallback(() => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep(3); }, 500);
  }, []);

  const handleOtpInput = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  }, [otp]);

  const handleOtpKeydown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }, [otp]);

  return (
    <section className="sheet h-mid" data-sheet="onboard" role="region" aria-label="Onboarding">
      <div className="handle" />
      {step === 1 && (
        <>
          <div className="sheet-head">
            <div><div className="eyebrow">Avant de continuer</div><h1>Votre recherche est gardée.</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose}><ArrowLeft size={15} /></button>
          </div>
          <p className="sub">Nous reprendrons « {pendingSearch || '…'} » exactement telle quelle juste après.</p>
          <div className="label">Numéro ou email</div>
          <input className="field lg" placeholder="+228 90 00 00 00 ou vous@exemple.com" value={contact} onChange={(e) => setContact(e.target.value)} />
          <button className="btn ok" style={{ marginTop: 10 }} type="button" disabled={busy || !contact.trim()} onClick={sendCode}>Recevoir le code</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Aucun mot de passe. Aucune inscription complète maintenant.</p>
        </>
      )}
      {step === 2 && (
        <>
          <div className="sheet-head">
            <div><div className="eyebrow">Code reçu</div><h1>Entrez le code à 4 chiffres.</h1></div>
          </div>
          <div className="otpboxes">
            {otp.map((v, i) => (
              <input key={i} ref={(el) => { otpRefs.current[i] = el; }} maxLength={1} inputMode="numeric" value={v}
                onChange={(e) => handleOtpInput(i, e.target.value)} onKeyDown={(e) => handleOtpKeydown(i, e)} />
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 7 }}>Code envoyé — expire dans 0:{timer < 10 ? '0' : ''}{timer}.</p>
          <button className="btn ok" style={{ marginTop: 8 }} type="button" disabled={busy || otp.some((d) => !d)} onClick={verifyCode}>Continuer</button>
          <button className="btn ghost sm" style={{ marginTop: 7 }} type="button" disabled={!canResend || busy} onClick={sendCode}>Renvoyer le code</button>
        </>
      )}
      {step === 3 && (
        <>
          <div className="sheet-head">
            <div><div className="eyebrow">Avant de reprendre votre recherche</div><h1>Ce que Pro débloque.</h1></div>
          </div>
          <div className="softplan">
            <div><b className="fs-10">Buyer Pro</b><br /><span className="tiny muted">Recherches illimitées + alertes</span></div>
            <span className="status ink">5 $/mois</span>
          </div>
          <div className="softplan">
            <div><b className="fs-10">Buyer Free</b><br /><span className="tiny muted">Ce que vous avez déjà</span></div>
            <span className="status gray">Actuel</span>
          </div>
          <button className="btn ghost" style={{ marginTop: 10 }} type="button" onClick={onComplete}>Continuer gratuitement</button>
          <button className="btn" style={{ marginTop: 7 }} type="button" onClick={onComplete}>Choisir Pro</button>
        </>
      )}
    </section>
  );
}
