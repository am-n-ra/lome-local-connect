import { FormEvent, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { normalizeTogoPhone, phoneDeclarationLabel } from '../domain/phone';
import { setDeclaredPhone } from './api';
import { sessionUserFromAuthResult, type SessionUser } from './auth-session';
import { trapDrawerFocus } from './ui-helpers';

export type AuthMode = 'signin' | 'signup';

type AuthSheetV13Props = {
  /** Which tab the screen opens on. The menu promises « Créer un compte » → `signup` ;
   *  a gated action needs an existing account → `signin`. */
  initialMode: AuthMode;
  /** Called with the REAL session once the account is created / signed in. The app
   *  adopts it (roles, capabilities, favorites, plan) — never a raw `setSheet('menu')`. */
  onAuthenticated: (user: SessionUser) => Promise<void> | void;
  /** S-16 / S3-a — the declared Togo phone is written best-effort after a signup. */
  onClose: () => void;
  /** BRANCHES — open the legal sheet (confidentialité / conditions / mentions). */
  onOpenLegal: (section: 'confidentialite' | 'conditions' | 'mentions') => void;
};

/** The confirmation link must return the user to Omni so they can sign in. */
function emailConfirmCallbackUrl(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.origin}/`;
}

/** A sign-in that failed because the address is not confirmed yet is NOT a wrong password.
 *  The two need different words, or the user retries a correct password forever. */
function isUnverifiedEmail(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const hay = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return hay.includes('verif') || hay.includes('not confirmed') || hay.includes('confirm');
}

/**
 * Heartwood — l'écran `auth` était CONNEXION SEULE. Un nouvel utilisateur n'avait
 * aucun chemin vers la création de compte, alors que le bouton du menu promet
 * « Créer un compte / se connecter » et que `OnboardV13` (l’ancienne surface de
 * création) n'était atteignable que par un chemin mort (`resumePendingAction(false)`).
 *
 * Ce composant réunit les DEUX gestes sur une surface unique : Prénom (requis) →
 * E-mail → Mot de passe → Téléphone (optionnel), puis la VRAIE création de compte
 * Neon (email/mot de passe). Il n'y a pas de code OTP simulé (X5).
 *
 * AUTH-CONFIRM — quand la plateforme exige une confirmation par e-mail, la création
 * n'ouvre pas de session. L'ancien écran lâchait alors une phrase en passant
 * (« Compte créé. Si une confirmation par email est demandée… ») puis laissait
 * l'utilisateur bloqué. Désormais un ÉTAT dédié explique quoi faire, propose de
 * RENVOYER l'e-mail, et un bouton « J'ai confirmé » ramène à la connexion.
 */
export function AuthSheetV13({ initialMode, onAuthenticated, onClose, onOpenLegal }: AuthSheetV13Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // AUTH-CONFIRM — non-null = we are waiting for the user to confirm this address.
  const [awaitingConfirm, setAwaitingConfirm] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  // BRANCHES — consentement explicite au traitement (loi togolaise 2019-014).
  const [consent, setConsent] = useState(false);

  const isSignup = mode === 'signup';
  const nameOk = firstName.trim().length > 0;
  const canSubmit = !busy && (!isSignup || (nameOk && consent)) && email.trim().length > 0 && password.length >= 6;

  const sendConfirmation = useCallback(async (address: string) => {
    if (!authClient) return;
    try {
      await authClient.sendVerificationEmail({ email: address, callbackURL: emailConfirmCallbackUrl() });
    } catch {
      /* best-effort : l'écran propose de renvoyer, il ne bloque jamais sur l'envoi */
    }
  }, []);

  const submit = useCallback(async () => {
    if (busy || !email.trim() || password.length < 6) return;
    if (mode === 'signup' && (!nameOk || !consent)) return;
    const phoneTrimmed = phone.trim();
    // S-16 : le numéro est optionnel ; s'il est saisi, il doit être un vrai format Togo.
    if (mode === 'signup' && phoneTrimmed !== '' && normalizeTogoPhone(phoneTrimmed) === null) {
      setError('Numéro invalide : attendu +228 puis 8 chiffres (ou laissez vide).');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (!authClient) {
        setError("L'authentification n'est pas configurée dans cet environnement.");
        return;
      }
      if (mode === 'signup') {
        const result = await authClient.signUp.email({ email: email.trim(), password, name: firstName.trim() });
        if (result?.error) {
          setError('Création impossible : cet e-mail est peut-être déjà utilisé.');
          return;
        }
      } else {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        if (result?.error) {
          // Un e-mail non confirmé n'est PAS un mauvais mot de passe : dire « identifiants
          // incorrects » ferait réessayer un mot de passe pourtant juste, sans issue.
          if (isUnverifiedEmail(result.error)) {
            setAwaitingConfirm(email.trim());
            await sendConfirmation(email.trim());
          } else {
            setError('Connexion impossible. Vérifiez vos identifiants.');
          }
          return;
        }
      }
      const session = await authClient.getSession();
      const user = sessionUserFromAuthResult(session);
      if (!user) {
        // La plateforme exige une confirmation par e-mail avant d'ouvrir une session.
        // On n'invente pas une session : on montre l'étape suivante, clairement.
        setAwaitingConfirm(email.trim());
        if (mode === 'signup') await sendConfirmation(email.trim());
        return;
      }
      // S-16 / S3-a : enregistre le numéro DÉCLARÉ (best-effort, jamais bloquant).
      if (mode === 'signup' && phoneTrimmed !== '') {
        try {
          const token = await getAuthToken();
          if (token) await setDeclaredPhone({ token, phone: phoneTrimmed });
        } catch {
          /* best-effort : le numéro reste déclarable depuis le Compte */
        }
      }
      await onAuthenticated(user);
    } catch {
      setError(mode === 'signup' ? 'Création impossible : cet e-mail est peut-être déjà utilisé.' : 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setBusy(false);
    }
  }, [busy, nameOk, consent, email, password, phone, firstName, mode, onAuthenticated, sendConfirmation]);

  const resend = useCallback(async () => {
    if (!awaitingConfirm || resending) return;
    setResending(true);
    setNotice(null);
    await sendConfirmation(awaitingConfirm);
    setResending(false);
    setNotice(`E-mail renvoyé à ${awaitingConfirm}. Vérifiez aussi vos indésirables.`);
  }, [awaitingConfirm, resending, sendConfirmation]);

  return (
    <section className="sheet h-mid" data-sheet="auth" role="dialog" aria-modal="true" aria-label={awaitingConfirm ? 'Confirmez votre e-mail' : isSignup ? 'Création de compte' : 'Connexion'} onKeyDown={trapDrawerFocus}>
      <div className="handle" />
      <div className="sheet-head">
        <div>
          <div className="eyebrow">{awaitingConfirm ? 'Une dernière étape' : 'Bienvenue'}</div>
          <h1>{awaitingConfirm ? 'Confirmez votre e-mail.' : isSignup ? 'Créez votre compte.' : 'Connectez-vous pour continuer.'}</h1>
        </div>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
      </div>

      {awaitingConfirm ? (
        <>
          <p className="sub">Nous avons envoyé un lien de confirmation à <b>{awaitingConfirm}</b>. Ouvrez ce lien, puis revenez vous connecter.</p>
          <div className="cardbox">
            <div className="kv"><span>1 · Ouvrez l'e-mail</span><b>Expéditeur Omni</b></div>
            <div className="kv"><span>2 · Cliquez le lien</span><b>Votre adresse est confirmée</b></div>
            <div className="kv"><span>3 · Revenez ici</span><b>Se connecter</b></div>
          </div>
          <p className="tiny muted" style={{ marginTop: 7 }}>Rien reçu ? Regardez vos indésirables, puis renvoyez l'e-mail ci-dessous.</p>
          <button className="btn" style={{ marginTop: 10 }} type="button" onClick={() => void resend()} disabled={resending}>
            {resending ? 'Envoi…' : "Renvoyer l'e-mail de confirmation"}
          </button>
          <button className="btn ok" style={{ marginTop: 7 }} type="button" onClick={() => { setAwaitingConfirm(null); setMode('signin'); setError(null); setNotice(null); }}>
            J'ai confirmé : me connecter
          </button>
          {notice && <p className="tiny muted" style={{ marginTop: 7 }} role="status">{notice}</p>}
        </>
      ) : (
        <>
          <p className="sub">
            {authClient
              ? (isSignup ? 'Créez votre compte en quelques secondes.' : 'Entrez vos identifiants pour continuer.')
              : 'L’ouverture de compte est momentanément indisponible. Réessayez plus tard.'}
          </p>
          <form className="cardbox" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void submit(); }}>
            {isSignup && (
              <>
                <label className="label" htmlFor="v13-auth-firstname">Prénom</label>
                <input id="v13-auth-firstname" name="firstName" className="field" placeholder="Ama" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </>
            )}
            <label className="label" htmlFor="v13-auth-email">E-mail</label>
            <input id="v13-auth-email" name="email" type="email" autoComplete="email" required className="field" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="label" htmlFor="v13-auth-password">Mot de passe</label>
            <input id="v13-auth-password" name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required className="field" placeholder={isSignup ? '6 caractères minimum' : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
            {isSignup && (
              <>
                <label className="label" htmlFor="v13-auth-phone">Téléphone (optionnel)</label>
                <input id="v13-auth-phone" name="phone" inputMode="tel" autoComplete="tel" className="field" placeholder="+228 90 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <p className="tiny muted" style={{ marginTop: 5 }}>Au Togo, le téléphone est souvent plus pratique que l'email. Statut : {phoneDeclarationLabel()}.</p>
              </>
            )}
            {isSignup && (
              <label className="tiny muted" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} required />
                <span>
                  J’accepte les <button type="button" className="linkbtn" style={{ display: 'inline', minHeight: 0, padding: 0 }} onClick={() => onOpenLegal('conditions')}>conditions d’utilisation</button> et je consens au traitement de mes données décrit dans la <button type="button" className="linkbtn" style={{ display: 'inline', minHeight: 0, padding: 0 }} onClick={() => onOpenLegal('confidentialite')}>politique de confidentialité</button>.
                </span>
              </label>
            )}
            <button className="btn" type="submit" style={{ marginTop: 10 }} disabled={!canSubmit}>
              {busy ? 'Un instant…' : isSignup ? 'Créer mon compte' : 'Se connecter'}
            </button>
            {error && <p className="tiny" style={{ color: 'var(--warn)', marginTop: 7 }} role="alert">{error}</p>}
            {notice && <p className="tiny muted" style={{ marginTop: 7 }} role="status">{notice}</p>}
            <button className="btn ghost sm" style={{ marginTop: 7 }} type="button" onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(null); setNotice(null); }}>
              {isSignup ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? Créer un compte'}
            </button>
            <p className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>Aucune inscription complète n'est demandée pour explorer la carte.</p>
          </form>
        </>
      )}
    </section>
  );
}
