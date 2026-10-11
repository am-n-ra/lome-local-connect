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
};

/**
 * Heartwood — l'écran `auth` était CONNEXION SEULE. Un nouvel utilisateur n'avait
 * aucun chemin vers la création de compte, alors que le bouton du menu promet
 * « Créer un compte / se connecter » et que `OnboardV13` (la seule surface de
 * création) n'était atteignable que par un chemin mort (`resumePendingAction(false)`).
 *
 * Ce composant réunit les DEUX gestes sur une surface unique, dans le même ordre que
 * l'onboarding : Prénom (optionnel) → Email → Mot de passe → Téléphone (optionnel),
 * puis la VRAIE création de compte Neon (email/mot de passe). Il n'y a pas de code
 * OTP simulé (X5) et aucune inscription n'est requise pour explorer la carte.
 */
export function AuthSheetV13({ initialMode, onAuthenticated, onClose }: AuthSheetV13Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (busy || !email.trim() || password.length < 6) return;
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
        await authClient.signUp.email({ email: email.trim(), password, name: firstName.trim() || email.trim() });
      } else {
        await authClient.signIn.email({ email: email.trim(), password });
      }
      const session = await authClient.getSession();
      const user = sessionUserFromAuthResult(session);
      if (!user) {
        // Honnête : Better Auth peut exiger une confirmation par email avant d'ouvrir
        // une session. On ne franchit pas l'étape sans session réelle.
        setNotice('Compte créé. Si une confirmation par email est demandée, validez-la puis connectez-vous.');
        setMode('signin');
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
      setError(mode === 'signup' ? 'Création impossible : cet email est peut-être déjà utilisé.' : 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setBusy(false);
    }
  }, [busy, email, password, phone, firstName, mode, onAuthenticated]);

  const isSignup = mode === 'signup';
  const canSubmit = !busy && email.trim().length > 0 && password.length >= 6;

  return (
    <section className="sheet h-mid" data-sheet="auth" role="dialog" aria-modal="true" aria-label={isSignup ? 'Création de compte' : 'Connexion'} onKeyDown={trapDrawerFocus}>
      <div className="handle" />
      <div className="sheet-head">
        <div><div className="eyebrow">Bienvenue</div><h1>{isSignup ? 'Créez votre compte.' : 'Connectez-vous pour continuer.'}</h1></div>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Fermer"><X size={15} /></button>
      </div>
      <p className="sub">
        {authClient ? 'La connexion Omni (Neon Auth) est active.' : "L'authentification n'est pas configurée dans cet environnement."}
      </p>
      <form className="cardbox" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void submit(); }}>
        {isSignup && (
          <>
            <label className="label" htmlFor="v13-auth-firstname">Prénom (optionnel)</label>
            <input id="v13-auth-firstname" name="firstName" className="field" placeholder="Ama" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </>
        )}
        <label className="label" htmlFor="v13-auth-email">Email</label>
        <input id="v13-auth-email" name="email" type="email" autoComplete="email" required className="field" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label" htmlFor="v13-auth-password">Mot de passe</label>
        <input id="v13-auth-password" name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required className="field" placeholder={isSignup ? '6 caractères minimum' : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />
        {isSignup && (
          <>
            <label className="label" htmlFor="v13-auth-phone">Téléphone (optionnel)</label>
            <input id="v13-auth-phone" name="phone" inputMode="tel" autoComplete="tel" className="field" placeholder="+228 90 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="tiny muted" style={{ marginTop: 5 }}>Au Togo le numéro est plus courant que l'email. Statut : {phoneDeclarationLabel()}. Omni ne vérifie pas ce numéro.</p>
          </>
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
    </section>
  );
}
