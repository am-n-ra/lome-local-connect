import { FormEvent, useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { authClient, getAuthToken } from '../auth';
import { normalizeTogoPhone, phoneDeclarationLabel } from '../domain/phone';
import { setDeclaredPhone } from './api';
import { authErrorOf, sessionUserFromAuthResult, authResultHasSession, type SessionUser } from './auth-session';
import { trapDrawerFocus } from './ui-helpers';

/** BRANCH-2 — délai (s) avant que « Renvoyer » ne redevienne disponible. */
const RESEND_DELAY_SECONDS = 30;

export type AuthMode = 'signin' | 'signup';

type AuthSheetV13Props = {
  /** Which tab the screen opens on. The menu promises « Créer un compte » → `signup` ;
   *  a gated action needs an existing account → `signin`. */
  initialMode: AuthMode;
  /** Called with the REAL session once the account is created / signed in. The app
   *  adopts it (roles, capabilities, favorites, plan) — never a raw `setSheet('menu')`.
   *  `created` is true ONLY on a fresh signup (not a sign-in): the app uses it to show the
   *  one-step welcome ONCE, and never to an existing account that merely logs in. */
  onAuthenticated: (user: SessionUser, created: boolean) => Promise<void> | void;
  /** S-16 / S3-a — the declared Togo phone is written best-effort after a signup. */
  onClose: () => void;
  /** BRANCHES — open the legal sheet (confidentialité / conditions / mentions). */
  onOpenLegal: (section: 'confidentialite' | 'conditions' | 'mentions') => void;
};

/** A sign-in that failed because the address is not confirmed yet is NOT a wrong password.
 *  The two need different words, or the user retries a correct password forever. */
function isUnverifiedEmail(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const hay = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return hay.includes('verif') || hay.includes('not confirmed') || hay.includes('confirm');
}

/** Un code de vérification invalide ou expiré se dit avec SES mots, pas « erreur réseau ». */
function isBadCode(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const hay = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return hay.includes('invalid') || hay.includes('otp') || hay.includes('expired') || hay.includes('incorrect');
}

/** Un e-mail déjà utilisé à la création se dit avec ses mots (sinon « réessayez » boucle). */
function isExistingAccount(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const hay = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return hay.includes('exist') || hay.includes('already');
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
  // BRANCH-2 — le code reçu par e-mail (Neon Auth `email_verification_method = otp`).
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  // BRANCH-2 — le renvoi n'apparaît qu'APRÈS un délai : on ne propose pas de renvoyer un
  // e-mail qui vient de partir, et on ne laisse pas l'utilisateur devant un bouton inerte.
  const [resendIn, setResendIn] = useState(0);
  // BRANCHES — consentement explicite au traitement (loi togolaise 2019-014).
  const [consent, setConsent] = useState(false);

  const isSignup = mode === 'signup';
  const nameOk = firstName.trim().length > 0;
  const canSubmit = !busy && (!isSignup || (nameOk && consent)) && email.trim().length > 0 && password.length >= 6;

  // BRANCH-2 — envoi du CODE de vérification (OTP), pas d'un lien. Le délai de renvoi
  // démarre en même temps : l'utilisateur voit qu'un e-mail vient de partir.
  const sendConfirmation = useCallback(async (address: string) => {
    if (!authClient) return;
    setResendIn(RESEND_DELAY_SECONDS);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: address, type: 'email-verification' });
    } catch {
      /* best-effort : l'écran propose de renvoyer, il ne bloque jamais sur l'envoi */
    }
  }, []);

  // Compte à rebours du renvoi — nettoyé dès qu'on quitte l'état de confirmation.
  useEffect(() => {
    if (!awaitingConfirm || resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [awaitingConfirm, resendIn]);

  // S-16 / S3-a : enregistre le numéro DÉCLARÉ (best-effort, jamais bloquant) puis adopte
  // la session. Le geste est partagé par la création, la connexion et la vérification du
  // code, pour qu'aucun chemin n'oublie d'adopter l'utilisateur pourtant authentifié.
  const finishAuthenticated = useCallback(async (user: SessionUser, declaredPhone: string, created = false) => {
    if (declaredPhone !== '') {
      try {
        const token = await getAuthToken();
        if (token) await setDeclaredPhone({ token, phone: declaredPhone });
      } catch {
        /* best-effort : le numéro reste déclarable depuis le Compte */
      }
    }
    await onAuthenticated(user, created);
  }, [onAuthenticated]);


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
        const failure = authErrorOf(result);
        if (failure) {
          // Un e-mail déjà pris n'est pas « réessayez » : on le DIT, et on ouvre le chemin
          // de connexion pour que l'utilisateur ne reste pas à retenter la création.
          if (isExistingAccount(failure)) {
            setMode('signin');
            setError('Cet e-mail a déjà un compte. Saisissez votre mot de passe pour vous connecter.');
          } else {
            setError('Création impossible. Vérifiez vos informations et réessayez.');
          }
          return;
        }
        // AUTH-VERIFY (option 2) — avec la vérification d'e-mail ACTIVÉE côté Neon (S3-0),
        // la création renvoie l'utilisateur MAIS SANS session : le compte existe, pas la
        // session. On ne peut donc plus adopter l'utilisateur sur sa seule présence — on
        // exige une session réelle. Tant qu'elle manque, on demande le CODE reçu. Si Neon
        // est en mode « vérification optionnelle », la session est déjà là et le chemin
        // reste fluide (jamais de mur gratuit).
        const createdUser = sessionUserFromAuthResult(result);
        if (authResultHasSession(result) && createdUser) {
          await finishAuthenticated(createdUser, phoneTrimmed, true);
          return;
        }
        setAwaitingConfirm(email.trim());
        await sendConfirmation(email.trim());
        return;
      } else {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        const failure = authErrorOf(result);
        if (failure) {
          // Un e-mail non confirmé n'est PAS un mauvais mot de passe : dire « identifiants
          // incorrects » ferait réessayer un mot de passe pourtant juste, sans issue.
          if (isUnverifiedEmail(failure)) {
            setAwaitingConfirm(email.trim());
            await sendConfirmation(email.trim());
          } else {
            setError('Connexion impossible. Vérifiez vos identifiants.');
          }
          return;
        }
        const signedInUser = sessionUserFromAuthResult(result);
        if (signedInUser) {
          await finishAuthenticated(signedInUser, '');
          return;
        }
      }
      // Dernier recours (connexion seulement — la création a toujours conclu plus haut) :
      // le succès n'a pas porté d'utilisateur. On interroge la session UNE fois. Si elle
      // est vide, on explique quoi faire — on ne renvoie jamais l'utilisateur vers un
      // formulaire qui reboucle.
      const session = await authClient.getSession();
      const user = sessionUserFromAuthResult(session);
      if (user) {
        await finishAuthenticated(user, '');
        return;
      }
      setError('Connexion impossible pour le moment. Vérifiez votre connexion, puis réessayez.');
    } catch (caught) {
      // Le SDK est configuré `throw: false` pour les erreurs HTTP, mais un échec réseau ou
      // un throw inattendu peut encore remonter ici : on le dit sans accuser les identifiants.
      const failure = authErrorOf(caught);
      if (mode === 'signup' && failure && isExistingAccount(failure)) {
        setMode('signin');
        setError('Cet e-mail a déjà un compte. Saisissez votre mot de passe pour vous connecter.');
      } else if (mode === 'signin' && failure && isUnverifiedEmail(failure)) {
        setAwaitingConfirm(email.trim());
        await sendConfirmation(email.trim());
      } else {
        setError('Connexion impossible pour le moment. Vérifiez votre connexion, puis réessayez.');
      }
    } finally {
      setBusy(false);
    }
  }, [busy, nameOk, consent, email, password, phone, firstName, mode, onAuthenticated, sendConfirmation, finishAuthenticated]);

  const resend = useCallback(async () => {
    if (!awaitingConfirm || resending || resendIn > 0) return;
    setResending(true);
    setNotice(null);
    await sendConfirmation(awaitingConfirm);
    setResending(false);
    setNotice(`Nouveau code envoyé à ${awaitingConfirm}. Vérifiez aussi vos indésirables.`);
  }, [awaitingConfirm, resending, resendIn, sendConfirmation]);

  // BRANCH-2 — l'utilisateur SAISIT le code reçu. Un code juste ouvre la session ; un code
  // faux est dit comme tel. Le succès de vérification porte DÉJÀ l'utilisateur : on l'adopte
  // au lieu de re-fetcher une session qui peut échouer à se confirmer (ce qui faisait boucler).
  const verifyCode = useCallback(async () => {
    const trimmed = code.trim();
    if (!awaitingConfirm || verifying || trimmed.length === 0) return;
    setVerifying(true);
    setError(null);
    setNotice(null);
    try {
      if (!authClient) { setError("L'authentification n'est pas configurée dans cet environnement."); return; }
      const result = await authClient.emailOtp.verifyEmail({ email: awaitingConfirm, otp: trimmed });
      const failure = authErrorOf(result);
      if (failure) {
        setError(isBadCode(failure) ? 'Code incorrect ou expiré. Vérifiez le code reçu, ou demandez-en un nouveau.' : 'La vérification a échoué. Réessayez.');
        return;
      }
      const verifiedUser = sessionUserFromAuthResult(result);
      if (verifiedUser) { await finishAuthenticated(verifiedUser, '', true); return; }
      const session = await authClient.getSession();
      const user = sessionUserFromAuthResult(session);
      if (user) { await finishAuthenticated(user, '', true); return; }
      // Adresse confirmée mais aucune session ouverte : on l'ouvre par une connexion
      // explicite (le mot de passe est encore dans l'écran), jamais une impasse.
      const passwordNow = password;
      if (passwordNow.length >= 6) {
        try {
          const signedIn = await authClient.signIn.email({ email: awaitingConfirm, password: passwordNow });
          const signedInUser = sessionUserFromAuthResult(signedIn);
          if (signedInUser) { await finishAuthenticated(signedInUser, '', true); return; }
        } catch {
          /* retombe sur la connexion manuelle ci-dessous */
        }
      }
      setNotice('Adresse confirmée. Saisissez votre mot de passe pour vous connecter.');
      setAwaitingConfirm(null);
      setMode('signin');
    } catch (caught) {
      const failure = authErrorOf(caught);
      setError(failure && isBadCode(failure) ? 'Code incorrect ou expiré. Vérifiez le code reçu, ou demandez-en un nouveau.' : 'La vérification a échoué. Réessayez.');
    } finally {
      setVerifying(false);
    }
  }, [awaitingConfirm, verifying, code, onAuthenticated, finishAuthenticated, password]);

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
          <p className="sub">Nous avons envoyé un <b>code</b> de confirmation à <b>{awaitingConfirm}</b>. Saisissez-le ci-dessous.</p>
          <div className="cardbox">
            <div className="kv"><span>1 · Ouvrez l'e-mail</span><b>Expéditeur Omni</b></div>
            <div className="kv"><span>2 · Saisissez le code</span><b>Ci-dessous</b></div>
          </div>
          <label className="label" htmlFor="v13-auth-code" style={{ marginTop: 8 }}>Code de confirmation</label>
          <input
            id="v13-auth-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="field"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn ok" style={{ marginTop: 8 }} type="button" onClick={() => void verifyCode()} disabled={verifying || code.trim().length === 0}>
            {verifying ? 'Vérification…' : 'Confirmer mon adresse'}
          </button>
          {error && <p className="tiny" style={{ color: 'var(--warn)', marginTop: 7 }} role="alert">{error}</p>}
          <p className="tiny muted" style={{ marginTop: 9 }}>Rien reçu ? Regardez vos indésirables.</p>
          {resendIn > 0 ? (
            <button className="btn ghost sm" style={{ marginTop: 7 }} type="button" disabled>
              Renvoyer le code dans {resendIn} s
            </button>
          ) : (
            <button className="btn" style={{ marginTop: 7 }} type="button" onClick={() => void resend()} disabled={resending}>
              {resending ? 'Envoi…' : 'Renvoyer le code'}
            </button>
          )}
          <button className="btn ghost sm" style={{ marginTop: 7 }} type="button" onClick={() => { setAwaitingConfirm(null); setCode(''); setMode('signin'); setError(null); setNotice(null); }}>
            Déjà confirmé : me connecter
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
