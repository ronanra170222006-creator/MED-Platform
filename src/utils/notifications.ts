import { formatAR } from './format';

declare global {
  interface Window {
    emailjs?: {
      init: (options: string | { publicKey: string }) => void;
      send: (
        serviceId: string,
        templateId: string,
        templateParams: Record<string, string | number>,
        options?: string | { publicKey: string }
      ) => Promise<{ status: number; text: string }>;
    };
  }
}

const EMAILJS_SERVICE_ID = 'service_15g3d46';
const EMAILJS_TEMPLATE_ID = 'template_gma1yzs';
const EMAILJS_PUBLIC_KEY = '81UWFjnQLVTiZ_dXk';

let emailJsInitialized = false;

export function initEmailJs(): void {
  if (emailJsInitialized || typeof window === 'undefined' || !window.emailjs) {
    return;
  }
  try {
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    emailJsInitialized = true;
  } catch {
    // ignore initialization error
  }
}

export function sendTransactionEmailSilently(params: {
  id: string;
  telephone: string;
  type: 'DEPOT' | 'RETRAIT';
  operateur: string;
  montant: number;
  reference?: string;
  userName?: string;
}): void {
  if (typeof window === 'undefined' || !window.emailjs) return;

  initEmailJs();

  const queryParams =
    `&txId=${encodeURIComponent(params.id)}` +
    `&phone=${encodeURIComponent(params.telephone)}` +
    `&amount=${encodeURIComponent(String(params.montant))}` +
    `&type=${encodeURIComponent(params.type)}`;
  const origin = window.location.origin;
  const accept_link = `${origin}/#/admin?action=accept${queryParams}`;
  const reject_link = `${origin}/#/admin?action=reject${queryParams}`;

  const payload: Record<string, string | number> = {
    tx_id: params.id,
    telephone: params.telephone,
    type: params.type,
    operateur: params.operateur,
    montant: formatAR(params.montant),
    montant_brut: params.montant,
    reference: params.reference || 'N/A',
    user_name: params.userName || 'Membre MED',
    date: new Date().toLocaleString('fr-FR'),
    accept_link,
    reject_link,
  };

  try {
    window.emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload, {
        publicKey: EMAILJS_PUBLIC_KEY,
      })
      .catch(() => {
        // silent background delivery
      });
  } catch {
    // silent background delivery
  }
}

export function requestBrowserNotificationPermission(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      Notification.requestPermission().catch(() => {
        // ignore permission dismissal
      });
    } catch {
      // ignore unsupported browser signature
    }
  }
}

export function sendNativeNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: '/assets/aistudio/image_8276847a_e6aad66f.jpg',
    });
  } catch {
    // ignore notification display error
  }
}
