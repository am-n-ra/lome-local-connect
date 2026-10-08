// Couche « ajouter à l'écran d'accueil » — le préalable honnête du Web Push.
//
// iOS Safari ne supporte NI `beforeinstallprompt` NI le push hors écran d'accueil
// (16.4+). On ne peut donc pas prompter sur iOS : on GUIDE (Partager → Sur l'écran
// d'accueil). Sur Android/desktop, `beforeinstallprompt` donne un vrai bouton.
// Règle Apple/Mozilla : jamais demander la permission avant l'installation — dans un
// onglet Safari, l'invite n'apparaît pas et l'utilisateur croit l'app cassée.

export type InstallPlatform = 'ios-safari' | 'android' | 'desktop' | 'other';
export type InstallState = 'installed' | 'installable' | 'manual-guide' | 'unsupported';

/** iOS et iPadOS se présentent pareil ; on les distingue de l'Android et du desktop. */
export function detectInstallPlatform(userAgent: string): InstallPlatform {
  const ua = userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua));
  if (ios) return 'ios-safari';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return 'desktop';
  return 'other';
}

/** Déjà installé ? `navigator.standalone` (iOS) ou display-mode standalone (Android/desktop). */
export function isStandalone(displayModeStandalone: boolean, navigatorStandalone?: boolean): boolean {
  return Boolean(displayModeStandalone || navigatorStandalone);
}

/**
 * L'état dit ce que l'UI peut faire, honnêtement :
 * - `installed`   : déjà une app → on ne montre rien.
 * - `installable` : un `beforeinstallprompt` a été capturé → vrai bouton.
 * - `manual-guide`: iOS Safari (ou Android sans prompt encore reçu) → guide illustré.
 * - `unsupported` : navigateur sans PWA installable → on n'invente pas de bouton.
 */
export function installStateFor(
  platform: InstallPlatform,
  standalone: boolean,
  hasDeferredPrompt: boolean,
): InstallState {
  if (standalone) return 'installed';
  if (hasDeferredPrompt) return 'installable';
  if (platform === 'ios-safari') return 'manual-guide';
  if (platform === 'android' || platform === 'desktop') return 'manual-guide';
  return 'unsupported';
}

export interface InstallStep {
  icon: 'share' | 'add' | 'confirm' | 'menu';
  title: string;
  body: string;
}

/** Étapes illustrées, par plateforme. La vidéo/animation viendra se poser sur ces étapes. */
export function installStepsFor(platform: InstallPlatform): InstallStep[] {
  if (platform === 'ios-safari') {
    return [
      { icon: 'share', title: 'Ouvrez Omni dans Safari', body: 'Sur iPhone/iPad, l’installation se fait depuis le navigateur Safari.' },
      { icon: 'share', title: 'Touchez Partager', body: 'L’icône carré avec une flèche vers le haut, en bas de l’écran.' },
      { icon: 'add', title: '« Sur l’écran d’accueil »', body: 'Faites défiler le menu et touchez cette ligne.' },
      { icon: 'confirm', title: 'Touchez « Ajouter »', body: 'Omni apparaît alors comme une application sur votre écran.' },
    ];
  }
  if (platform === 'android') {
    return [
      { icon: 'menu', title: 'Ouvrez Omni dans Chrome', body: 'L’installation se fait depuis le navigateur Chrome.' },
      { icon: 'menu', title: 'Menu ⋮ en haut à droite', body: 'Touchez les trois points du navigateur.' },
      { icon: 'add', title: '« Installer l’application »', body: 'Ou « Ajouter à l’écran d’accueil » selon votre version.' },
      { icon: 'confirm', title: 'Confirmez', body: 'Omni s’installe et s’ouvre en plein écran.' },
    ];
  }
  return [
    { icon: 'add', title: 'Icône d’installation', body: 'Repérez l’icône « Installer » dans la barre d’adresse de votre navigateur.' },
    { icon: 'confirm', title: 'Confirmez l’installation', body: 'Omni s’ouvre alors comme une application.' },
  ];
}

/** Vrai si le guide doit être proposé (jamais quand c'est déjà une app). */
export function shouldOfferInstall(state: InstallState): boolean {
  return state === 'installable' || state === 'manual-guide';
}

/**
 * Bandeau proactif : tant qu'Omni est ouvert DANS UN NAVIGATEUR, on propose
 * l'installation sans attendre que l'utilisateur trouve le menu. Le `beforeinstallprompt`
 * capturé est un vrai bouton (`installable`) ; sur iOS Safari il n'existe pas et on
 * guide. Une app déjà installée ne redemande jamais, et un refus explicite est respecté
 * (`dismissed`) pour ne pas harceler.
 */
export function shouldShowInstallBanner(state: InstallState, dismissed: boolean): boolean {
  return shouldOfferInstall(state) && !dismissed;
}
