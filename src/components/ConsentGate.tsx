/**
 * ConsentGate.tsx — Porte de consentement obligatoire (CGU / avertissements)
 * ---------------------------------------------------------------------------
 * Trilingue FR / EN / AR (RTL automatique pour l'arabe).
 * - Bloque toute l'app tant que le Pioneer n'a pas accepté.
 * - « J'accepte » → POST /api/terms/accept (enregistre la version + horodatage).
 * - « Je ne suis pas d'accord » → déconnexion immédiate (callback onDeclined).
 *
 * ⚠️ La version du texte ci-dessous (TERMS_VERSION) DOIT correspondre à
 *    CURRENT_TERMS_VERSION du backend. Si tu modifies le texte, incrémente
 *    les DEUX (ici et sur le serveur / variable d'env TERMS_VERSION).
 *
 * INTÉGRATION (dans App.tsx, après l'authentification Pi) :
 *
 *   import ConsentGate from './components/ConsentGate';
 *   // `user` vient de /api/auth/me ou de pi-login (il contient termsAccepted)
 *   {user && !user.termsAccepted && (
 *     <ConsentGate
 *       apiBaseUrl={import.meta.env.VITE_API_URL}   // ex. https://workpiserv-api-testnet.onrender.com
 *       token={token}                               // le JWT stocké après login
 *       onAccepted={() => refetchMe()}              // re-fetch /me → termsAccepted devient true → la porte disparaît
 *       onDeclined={logout}                         // ta fonction de déconnexion (vide le token + redirige)
 *     />
 *   )}
 */

import { useState } from 'react';
import { PI_SANDBOX } from '@/config/network';

export const TERMS_VERSION = '2026-06-29'; // doit = CURRENT_TERMS_VERSION (backend)
// Réseau détecté au build : 'false' (ou absent) => Mainnet ; 'true' => Testnet.
const IS_MAINNET = !PI_SANDBOX;

type Lang = 'fr' | 'en' | 'ar';

interface Section { h: string; p: string; }
interface Locale {
  dir: 'ltr' | 'rtl';
  label: string;       // libellé du bouton de langue
  title: string;
  intro: string;
  sections: Section[];
  checkbox: string;
  accept: string;
  decline: string;
  declineHint: string;
  updated: string;     // « Version du … »
}

const T: Record<Lang, Locale> = {
  fr: {
    dir: 'ltr',
    label: 'FR',
    title: 'Conditions & avertissements',
    intro:
      "Avant d'utiliser WorkπServ, merci de lire et d'accepter les points suivants. Ils protègent autant les acheteurs que les freelances.",
    sections: [
      {
        h: '1. Nature du service',
        p: IS_MAINNET ? "WorkπServ est une place de marché de services entre Pioneers, réglée en Pi. La plateforme fonctionne sur le réseau principal (Mainnet) : les Pi échangés ont une valeur réelle et les transactions sont définitives. Engage-toi en connaissance de cause." : "WorkπServ est une place de marché de services entre Pioneers, réglée en Pi. La plateforme est en phase de test (Testnet) : les Pi échangés n'ont pas de valeur réelle tant que le passage en Mainnet n'est pas annoncé.",
      },
      {
        h: '2. Détention des fonds en escrow',
        p: "Quand tu paies un service, tes Pi sont placés en séquestre (escrow) jusqu'à la fin de la commande. WorkπServ détient actuellement ces fonds lui-même, en attendant le contrat d'escrow natif de Pi Network vers lequel la plateforme migrera dès qu'il sera disponible. WorkπServ n'est ni une banque ni un dépositaire (custodian) régulé.",
      },
      {
        h: '3. Commission',
        p: "La plateforme prélève une commission de 10 % sur chaque commande finalisée. Le freelance reçoit 90 % du montant.",
      },
      {
        h: '4. Remboursements & litiges',
        p: "Après livraison, l'acheteur dispose de 5 jours pour accepter ou ouvrir un litige ; sans action, la commande se finalise automatiquement et le freelance est payé. Si le freelance ne livre jamais, l'acheteur peut demander un remboursement passé 7 jours. Un freelance peut annuler une commande qu'il ne peut pas honorer (l'acheteur est alors remboursé). En cas de litige, l'administration de la plateforme arbitre.",
      },
      {
        h: '5. Sécurité — anti-arnaque',
        p: "Ne partage JAMAIS ta phrase secrète (seed phrase) ni tes clés privées : WorkπServ ne te les demandera jamais. Garde tes échanges et tes paiements sur la plateforme. Tout signalement d'arnaque est pris au sérieux.",
      },
      {
        h: '6. Risque & responsabilité',
        p: "Les services sont fournis directement entre utilisateurs ; WorkπServ facilite la mise en relation et le séquestre mais ne garantit pas la qualité d'un travail. Les crypto-actifs comportent des risques (volatilité, irréversibilité des transactions). Tu utilises la plateforme à tes propres risques.",
      },
      {
        h: '7. Cadre juridique',
        p: IS_MAINNET ? "WorkπServ n'est pas encore exploité par une société constituée ; une entité juridique est en cours de création dans une juridiction favorable aux crypto-actifs, et des conditions définitives (dont le droit applicable) seront publiées à ce moment-là. En attendant, il t'appartient de respecter les lois de ton pays concernant les crypto-actifs et l'utilisation de ce service." : "WorkπServ est en phase de test et n'est pas encore exploité par une société constituée. Avant le passage en Mainnet, une entité juridique sera créée dans une juridiction favorable aux crypto-actifs, et des conditions définitives (dont le droit applicable) seront publiées à ce moment-là. En attendant, il t'appartient de respecter les lois de ton pays concernant les crypto-actifs et l'utilisation de ce service.",
      },
    ],
    checkbox: "J'ai lu et j'accepte les conditions et avertissements ci-dessus.",
    accept: "J'accepte",
    decline: "Je ne suis pas d'accord",
    declineHint: 'Refuser vous déconnectera.',
    updated: 'Version du',
  },
  en: {
    dir: 'ltr',
    label: 'EN',
    title: 'Terms & disclaimers',
    intro:
      'Before using WorkπServ, please read and accept the following. These protect both buyers and freelancers.',
    sections: [
      {
        h: '1. Nature of the service',
        p: IS_MAINNET ? "WorkπServ is a marketplace for services between Pioneers, settled in Pi. The platform runs on the main network (Mainnet): the Pi exchanged has real value and transactions are final. Proceed with full awareness." : "WorkπServ is a marketplace for services between Pioneers, settled in Pi. The platform is in a testing phase (Testnet): the Pi exchanged has no real value until a Mainnet switch is announced.",
      },
      {
        h: '2. Funds held in escrow',
        p: "When you pay for a service, your Pi is placed in escrow until the order completes. WorkπServ currently holds these funds itself, pending Pi Network's native escrow smart contract, to which the platform will migrate once available. WorkπServ is neither a bank nor a regulated custodian.",
      },
      {
        h: '3. Commission',
        p: 'The platform charges a 10% commission on every completed order. The freelancer receives 90% of the amount.',
      },
      {
        h: '4. Refunds & disputes',
        p: "After delivery, the buyer has 5 days to accept or open a dispute; with no action, the order auto-completes and the freelancer is paid. If the freelancer never delivers, the buyer may request a refund after 7 days. A freelancer may cancel an order they cannot fulfil (the buyer is then refunded). In case of a dispute, the platform's admin arbitrates.",
      },
      {
        h: '5. Security — anti-scam',
        p: 'NEVER share your seed phrase or private keys: WorkπServ will never ask for them. Keep your communication and payments on the platform. All scam reports are taken seriously.',
      },
      {
        h: '6. Risk & liability',
        p: 'Services are provided directly between users; WorkπServ facilitates matching and escrow but does not guarantee the quality of any work. Crypto-assets carry risks (volatility, irreversible transactions). You use the platform at your own risk.',
      },
      {
        h: '7. Legal framework',
        p: IS_MAINNET ? "WorkπServ is not yet operated by an incorporated company; a legal entity is being established in a crypto-friendly jurisdiction, and definitive terms (including governing law) will be published at that time. In the meantime, you are responsible for complying with your own country's laws regarding crypto-assets and the use of this service." : 'WorkπServ is in a testing phase and is not yet operated by an incorporated company. Before the Mainnet switch, a legal entity will be established in a crypto-friendly jurisdiction, and definitive terms (including governing law) will be published at that time. In the meantime, you are responsible for complying with your own country\'s laws regarding crypto-assets and the use of this service.',
      },
    ],
    checkbox: 'I have read and accept the terms and disclaimers above.',
    accept: 'I accept',
    decline: "I don't agree",
    declineHint: 'Declining will log you out.',
    updated: 'Version of',
  },
  ar: {
    dir: 'rtl',
    label: 'العربية',
    title: 'الشروط والتنبيهات',
    intro:
      'قبل استخدام WorkπServ، يُرجى قراءة النقاط التالية والموافقة عليها. فهي تحمي المشترين والمستقلّين على حدٍّ سواء.',
    sections: [
      {
        h: '١. طبيعة الخدمة',
        p: IS_MAINNET ? 'WorkπServ سوقٌ لتبادل الخدمات بين الرّوّاد (Pioneers) تُسوَّى بعملة Pi. تعمل المنصّة على الشبكة الرئيسية (Mainnet): عملة Pi المتبادَلة لها قيمة حقيقية والمعاملات نهائية. تابع وأنت على دراية كاملة.' : 'WorkπServ سوقٌ لتبادل الخدمات بين الرّوّاد (Pioneers) تُسوَّى بعملة Pi. المنصّة في طور التجربة (Testnet): عملة Pi المتبادَلة لا قيمة حقيقية لها إلى حين الإعلان عن التحوّل إلى الشبكة الرئيسية (Mainnet).',
      },
      {
        h: '٢. الاحتفاظ بالأموال في الضمان (Escrow)',
        p: 'عند دفعك مقابل خدمة، تُحفَظ عملات Pi الخاصة بك في الضمان إلى حين إتمام الطلب. تحتفظ WorkπServ حاليًا بهذه الأموال بنفسها، في انتظار عقد الضمان الأصلي (smart contract) لشبكة Pi الذي ستنتقل إليه المنصّة فور توفّره. WorkπServ ليست بنكًا ولا جهة إيداع (custodian) خاضعة للتنظيم.',
      },
      {
        h: '٣. العمولة',
        p: 'تقتطع المنصّة عمولة قدرها ١٠٪ من كل طلبٍ مكتمل. ويتقاضى المستقلّ ٩٠٪ من المبلغ.',
      },
      {
        h: '٤. الاسترجاع والنزاعات',
        p: 'بعد التسليم، أمام المشتري ٥ أيام لقبول العمل أو فتح نزاع؛ وفي حال عدم اتخاذ أي إجراء يُكتمَل الطلب تلقائيًا ويُدفَع للمستقلّ. وإذا لم يُسلِّم المستقلّ إطلاقًا، يجوز للمشتري طلب الاسترجاع بعد ٧ أيام. ويمكن للمستقلّ إلغاء طلبٍ يتعذّر عليه تنفيذه (فيُسترجَع المبلغ للمشتري). وفي حال النزاع، تتولّى إدارة المنصّة التحكيم.',
      },
      {
        h: '٥. الأمان — مكافحة الاحتيال',
        p: 'لا تُشارِك أبدًا عبارتك السرّية (seed phrase) أو مفاتيحك الخاصة: لن تطلبها منك WorkπServ مطلقًا. أبقِ مراسلاتك ومدفوعاتك داخل المنصّة. ويُؤخَذ كل بلاغٍ عن احتيال على محمل الجدّ.',
      },
      {
        h: '٦. المخاطر والمسؤولية',
        p: 'تُقدَّم الخدمات مباشرةً بين المستخدمين؛ تُيسِّر WorkπServ التواصل والضمان لكنها لا تضمن جودة أي عمل. تنطوي الأصول المشفّرة على مخاطر (تقلّب الأسعار، وعدم قابلية المعاملات للإلغاء). أنت تستخدم المنصّة على مسؤوليتك الخاصة.',
      },
      {
        h: '٧. الإطار القانوني',
        p: IS_MAINNET ? 'منصّة WorkπServ ليست بعدُ مُشغّلة من قِبَل شركة مُسجّلة؛ يجري حاليًا إنشاء كيان قانوني في ولاية قضائية داعمة للأصول المشفّرة، وستُنشَر عندئذٍ شروطٌ نهائية (بما في ذلك القانون الواجب التطبيق). وفي غضون ذلك، تقع على عاتقك مسؤولية الامتثال لقوانين بلدك المتعلّقة بالأصول المشفّرة وباستخدام هذه الخدمة.' : 'منصّة WorkπServ في طور التجربة وليست بعدُ مُشغّلة من قِبَل شركة مُسجّلة. قبل الانتقال إلى الشبكة الرئيسية (Mainnet)، سيُنشأ كيانٌ قانوني في ولاية قضائية داعمة للأصول المشفّرة، وستُنشَر عندئذٍ شروطٌ نهائية (بما في ذلك القانون الواجب التطبيق). وفي غضون ذلك، تقع على عاتقك مسؤولية الامتثال لقوانين بلدك المتعلّقة بالأصول المشفّرة وباستخدام هذه الخدمة.',
      },
    ],
    checkbox: 'لقد قرأتُ الشروط والتنبيهات أعلاه وأوافق عليها.',
    accept: 'أوافق',
    decline: 'لا أوافق',
    declineHint: 'الرفض سيؤدي إلى تسجيل خروجك.',
    updated: 'إصدار بتاريخ',
  },
};

interface ConsentGateProps {
  apiBaseUrl: string;
  token?: string;
  onAccepted: () => void;
  onDeclined: () => void;
  defaultLang?: Lang;
  /** Optionnel : remplace l'appel fetch interne par ton propre client API. */
  onAccept?: () => Promise<void>;
}

export default function ConsentGate({
  apiBaseUrl,
  token,
  onAccepted,
  onDeclined,
  defaultLang = 'fr',
  onAccept,
}: ConsentGateProps) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = T[lang];

  async function handleAccept() {
    if (!checked || submitting) return;
    setSubmitting(true);
    setError(null);
    // Récupère le JWT : prop `token` si fournie, sinon on le détecte dans le
    // localStorage (motif JWT à 3 segments) — pas besoin de connaître la clé.
    const getToken = (): string => {
      if (token) return token;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          const v = localStorage.getItem(k) || '';
          if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v)) return v;
        }
      } catch { /* ignore */ }
      return '';
    };
    try {
      if (onAccept) {
        await onAccept();
      } else {
        const res = await fetch(`${apiBaseUrl}/api/terms/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ version: TERMS_VERSION }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      onAccepted();
    } catch (e) {
      setError(
        lang === 'fr'
          ? "Échec de l'enregistrement. Réessaie."
          : lang === 'ar'
          ? 'تعذّر الحفظ. أعد المحاولة.'
          : 'Could not save. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ backdropFilter: 'blur(4px)' }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
    >
      <div
        dir={t.dir}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e1320] text-slate-100 shadow-2xl"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h2 className="text-base font-semibold">{t.title}</h2>
          </div>
          <div className="flex gap-1">
            {(Object.keys(T) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                  lang === l ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {T[l].label}
              </button>
            ))}
          </div>
        </div>

        {/* Corps défilant */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 text-sm text-slate-300">{t.intro}</p>
          <div className="space-y-3">
            {t.sections.map((s, i) => (
              <div key={i} className="rounded-lg bg-white/[0.03] p-3">
                <h3 className="mb-1 text-sm font-semibold text-slate-100">{s.h}</h3>
                <p className="text-[13px] leading-relaxed text-slate-300">{s.p}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {t.updated} {TERMS_VERSION}
          </p>
        </div>

        {/* Pied : case + boutons */}
        <div className="border-t border-white/10 px-5 py-4">
          <label className="mb-3 flex cursor-pointer items-start gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-500"
            />
            <span>{t.checkbox}</span>
          </label>

          {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              onClick={handleAccept}
              disabled={!checked || submitting}
              className="flex-1 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? '…' : t.accept}
            </button>
            <button
              onClick={onDeclined}
              disabled={submitting}
              className="flex-1 rounded-lg border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
              title={t.declineHint}
            >
              {t.decline}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">{t.declineHint}</p>
        </div>
      </div>
    </div>
  );
}
