import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { resolveUserCurrency } from '../domain/currency';
import { normalizeTogoPhone, phoneDeclarationLabel } from '../domain/phone';
import { planPriceLabel, localPlanPriceLabel } from '../domain/plan-labels';
import { getPublicStats, setDeclaredPhone } from './api';
import { sessionUserFromAuthResult, type SessionUser } from './auth-session';
import type { PublicStats } from './types';

type OnboardV13Props = {
  pendingSearch: string;
  /** X5 — true when a real session already exists (gated action → real sign-in). */
  hasSession: boolean;
  onClose: () => void;
  onComplete: () => void;
  /** X5 — real account created/signed in: the app adopts this session in place. */
  onAuthenticated?: (user: SessionUser) => void;
};

type ObStep = 1 | 2 | 3;

// X5 — onboarding honnête. L'ancienne étape « code à 4 chiffres » était SIMULÉE
// (setTimeout, aucun code envoyé) alors qu'un vrai utilisateur y arrivait après un
// VRAI login Neon : un mensonge de sécurité. Remplacée par la VRAIE création de
// compte Neon email/mot de passe. La preuve sociale est tirée de la base
// (`getPublicStats`) — jamais un chiffre inventé (S-15, aucun frais).
export function OnboardV13({ pendingSearch, hasSession, onClose, onComplete, onAuthenticated }: OnboardV13Props) {
  // Un compte réel existe déjà → on ne redemande pas des identifiants.
  const [step, setStep] = useState<ObStep>(hasSession ? 3 : 1);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await getPublicStats().catch(() => null);
      if (active && result?.ok && result.data && result.data.facilities > 0) setStats(result.data);
    })();
    return () => { active = false; };
  }, []);

  const submitAccount = useCallback(async () => {
    if (busy || !email.trim() || password.length < 6) return;
    // S-16 : le numéro est optionnel ; s'il est saisi, il doit être un vrai format Togo.
    const phoneTrimmed = phone.trim();
    if (mode === 'signup' && phoneTrimmed !== '' && normalizeTogoPhone(phoneTrimmed) === null) {
      setAuthError('Numéro invalide : attendu +228 puis 8 chiffres (ou laissez vide).');
      return;
    }
    setBusy(true);
    setAuthError(null);
    setNotice(null);
    try {
      if (!authClient) {
        setAuthError("L'inscription n'est pas configurée dans cet environnement.");
        return;
      }
      if (mode === 'signup') {
        await authClient.signUp.email({ email: email.trim(), password, name: firstName.trim() || email.trim() });
      } else {
        await authClient.signIn.email({ email: email.trim(), password });
      }
      const session = await authClient.getSession();
      const user = sessionUserFromAuthResult(session);
      if (!user) {
        // Honnête : Better Auth peut exiger une confirmation par email avant
        // d'ouvrir une session. On ne franchit pas l'étape sans session réelle.
        setNotice('Compte créé. Si une confirmation par email est demandée, validez-la puis connectez-vous.');
        setMode('signin');
        return;
      }
      // S-16 / S3-a : enregistre le numéro DÉCLARÉ (best-effort, jamais bloquant).
      // Le compte vient d'être créé — on ne fait pas échouer l'inscription si l'écriture
      // du numéro rate ; il reste déclarable depuis la sheet Compte.
      if (mode === 'signup' && phoneTrimmed !== '') {
        try {
          const token = await getAuthToken();
          if (token) await setDeclaredPhone({ token, phone: phoneTrimmed });
        } catch {
          /* best-effort : le numéro reste déclarable depuis le Compte */
        }
      }
      onAuthenticated?.(user);
      setStep(3);
    } catch {
      setAuthError(mode === 'signup' ? 'Création impossible : cet email est peut-être déjà utilisé.' : 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setBusy(false);
    }
  }, [busy, email, password, phone, firstName, mode, onAuthenticated]);

  const greeting = firstName.trim() ? `${firstName.trim()}, ` : '';
  const currencyInput = { locale: typeof navigator === 'undefined' ? null : navigator.language };

  return (
    <section className="sheet h-mid" data-sheet="onboard" role="region" aria-label="Onboarding">
      <div className="handle" />
      {step === 1 && (
        <>
          <div className="sheet-head">
            <div><div className="eyebrow">Avant de continuer</div><h1>Omni trouve l'offre près de vous.</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={onClose} aria-label="Fermer"><ArrowLeft size={15} /></button>
          </div>
          <p className="sub">Un moteur de recherche de l'offre locale : vous décrivez ce que vous voulez et vos contraintes, Omni vous montre où ça existe vraiment, maintenant.</p>
          {stats && (
            <div className="cardbox">
              <div className="kv"><span>Lieux sur la carte</span><b>{stats.facilities}</b></div>
              <div className="kv"><span>Offres publiées</span><b>{stats.offers}</b></div>
            </div>
          )}
          <div className="cardbox">
            <div className="kv"><span>1 · Découvrir</span><b>Carte des facilités réelles</b></div>
            <div className="kv"><span>2 · Interroger</span><b>Disponibilité confirmée</b></div>
            <div className="kv"><span>3 · Vérifier & transiger</span><b>QR tracé, paiement sûr</b></div>
          </div>
          <p className="tiny muted" style={{ marginTop: 7 }}>La disponibilité n'apparaît qu'une fois confirmée, jamais une promesse invérifiée.</p>
          <button className="btn ok" style={{ marginTop: 10 }} type="button" onClick={() => setStep(2)}>Créer mon compte</button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Vous pouvez explorer la carte sans compte ; l'accès sert à envoyer une demande.</p>
        </>
      )}
      {step === 2 && (
        <>
          <div className="sheet-head">
            <div><div className="eyebrow">Votre recherche est gardée</div><h1>{mode === 'signup' ? 'Créez votre compte.' : 'Connectez-vous.'}</h1></div>
            <button type="button" className="btn ghost sm" style={{ width: 'auto', minHeight: 28 }} onClick={() => setStep(1)}><ArrowLeft size={15} /></button>
          </div>
          <p className="sub">Nous reprendrons « {pendingSearch || '…'} » exactement telle quelle juste après.</p>
          {mode === 'signup' && (
            <>
              <div className="label">Prénom (optionnel)</div>
              <input className="field" placeholder="Ama" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </>
          )}
          <div className="label" style={{ marginTop: 8 }}>Email</div>
          <input className="field lg" type="email" autoComplete="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="label" style={{ marginTop: 8 }}>Mot de passe</div>
          <input className="field lg" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="6 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void submitAccount(); }} />
          {mode === 'signup' && (
            <>
              <div className="label" style={{ marginTop: 8 }}>Téléphone (optionnel)</div>
              <input className="field lg" inputMode="tel" autoComplete="tel" placeholder="+228 90 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void submitAccount(); }} />
              <p className="tiny muted" style={{ marginTop: 5 }}>Au Togo le numéro est plus courant que l'email. Statut : {phoneDeclarationLabel()}. Omni ne vérifie pas ce numéro.</p>
            </>
          )}
          <button className="btn ok" style={{ marginTop: 10 }} type="button" disabled={busy || !email.trim() || password.length < 6} onClick={() => void submitAccount()}>
            {busy ? 'Un instant…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
          {authError && <p className="tiny" style={{ color: 'var(--warn)', marginTop: 7 }} role="alert">{authError}</p>}
          {notice && <p className="tiny muted" style={{ marginTop: 7 }} role="status">{notice}</p>}
          <button className="btn ghost sm" style={{ marginTop: 7 }} type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setAuthError(null); setNotice(null); }}>
            {mode === 'signup' ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? Créer un compte'}
          </button>
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Aucune inscription complète n'est demandée pour explorer la carte.</p>
        </>
      )}
      {step === 3 && (
        <>
          <div className="sheet-head">
            <div><div className="eyebrow">{greeting}avant de reprendre votre recherche</div><h1>Ce que Pro débloque.</h1></div>
          </div>
          <div className="cardbox">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>Acheteur Pro</b><br /><span className="tiny muted">Recherches illimitées + alertes</span></div>
              <span className="status ink">{planPriceLabel('buyerPro', resolveUserCurrency(currencyInput))}</span>
            </div>
            <p className="tiny muted" style={{ marginTop: 6 }}>≈ {localPlanPriceLabel('buyerPro', resolveUserCurrency(currencyInput))} . Sans engagement.</p>
          </div>
          <div className="cardbox">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>Acheteur Gratuit</b><br /><span className="tiny muted">Ce que vous avez déjà</span></div>
              <span className="status gray">Actuel</span>
            </div>
          </div>
          <button className="btn ghost" style={{ marginTop: 10 }} type="button" onClick={onComplete}>Continuer gratuitement</button>
          <button className="btn" style={{ marginTop: 7 }} type="button" onClick={onComplete}>Choisir Pro</button>
        </>
      )}
    </section>
  );
}
