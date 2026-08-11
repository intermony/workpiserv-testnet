import { useState } from 'react';
import { Coins, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import { useLanguage } from '@/i18n';
import piSDK, { piSdkAvailable, waitForPiSDK } from '@/lib/pi';

const MIN_TOPUP = 0.1;            // indicatif côté client ; le backend fait foi
const QUICK = [0.5, 1, 5, 10];    // montants rapides (π)

type Phase = 'idle' | 'paying' | 'done' | 'cancelled' | 'error';

interface Strings {
  title: string; sub: string; current: string; placeholder: string;
  quick: string; btn: string; paying: string;
  okCredited: string;            // contient {b}
  cancelled: string;
  errInvalid: string; errNoPi: string; errGeneric: string;
}

const STR: Record<string, Strings> = {
  en: {
    title: 'Top up balance',
    sub: 'Add Pi to your internal balance to order services. Secure payment via Pi Browser.',
    current: 'Current balance', placeholder: 'Amount in π', quick: 'Quick amounts',
    btn: 'Top up', paying: 'Processing…',
    okCredited: 'Balance topped up! New balance: {b} π',
    cancelled: 'Payment cancelled.',
    errInvalid: 'Enter a valid amount.',
    errNoPi: 'Open WorkPiServ in the Pi Browser to top up.',
    errGeneric: 'Top-up failed. Please try again.',
  },
  fr: {
    title: 'Recharger le solde',
    sub: 'Ajoutez du Pi à votre solde interne pour commander des services. Paiement sécurisé via le Pi Browser.',
    current: 'Solde actuel', placeholder: 'Montant en π', quick: 'Montants rapides',
    btn: 'Recharger', paying: 'Traitement…',
    okCredited: 'Solde rechargé ! Nouveau solde : {b} π',
    cancelled: 'Paiement annulé.',
    errInvalid: 'Entrez un montant valide.',
    errNoPi: 'Ouvrez WorkPiServ dans le Pi Browser pour recharger.',
    errGeneric: 'Échec de la recharge. Réessayez.',
  },
  ar: {
    title: 'شحن الرصيد',
    sub: 'أضف Pi إلى رصيدك الداخلي لطلب الخدمات. دفع آمن عبر متصفح Pi.',
    current: 'الرصيد الحالي', placeholder: 'المبلغ بالـ π', quick: 'مبالغ سريعة',
    btn: 'شحن', paying: 'جارٍ المعالجة…',
    okCredited: 'تم شحن الرصيد! الرصيد الجديد: {b} π',
    cancelled: 'تم إلغاء الدفع.',
    errInvalid: 'أدخل مبلغًا صحيحًا.',
    errNoPi: 'افتح WorkPiServ في متصفح Pi لإجراء الشحن.',
    errGeneric: 'فشل الشحن. حاول مرة أخرى.',
  },
  zh: {
    title: '充值余额',
    sub: '向您的内部余额添加 Pi 以购买服务。通过 Pi 浏览器安全支付。',
    current: '当前余额', placeholder: '金额（π）', quick: '快捷金额',
    btn: '充值', paying: '处理中…',
    okCredited: '充值成功！新余额：{b} π',
    cancelled: '支付已取消。',
    errInvalid: '请输入有效金额。',
    errNoPi: '请在 Pi 浏览器中打开 WorkPiServ 进行充值。',
    errGeneric: '充值失败，请重试。',
  },
  vi: {
    title: 'Nạp số dư',
    sub: 'Thêm Pi vào số dư nội bộ để đặt dịch vụ. Thanh toán an toàn qua Pi Browser.',
    current: 'Số dư hiện tại', placeholder: 'Số tiền (π)', quick: 'Số tiền nhanh',
    btn: 'Nạp tiền', paying: 'Đang xử lý…',
    okCredited: 'Đã nạp số dư! Số dư mới: {b} π',
    cancelled: 'Thanh toán đã hủy.',
    errInvalid: 'Nhập số tiền hợp lệ.',
    errNoPi: 'Mở WorkPiServ trong Pi Browser để nạp tiền.',
    errGeneric: 'Nạp tiền thất bại. Vui lòng thử lại.',
  },
};

export default function RechargeCard({
  balance,
  onCredited,
}: {
  balance: number;
  onCredited?: () => void;
}) {
  const { lang } = useLanguage();
  const s = STR[lang] || STR.en;

  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const busy = phase === 'paying';

  const reset = (keepAmount = false) => {
    setPhase('idle');
    if (!keepAmount) setAmount('');
  };

  const start = async () => {
    setError(null);
    setSuccess(null);

    const amt = Number(amount);
    if (!amt || amt <= 0) { setError(s.errInvalid); return; }

    // Le SDK Pi peut arriver après le clic sur mobile : on lui laisse un délai.
    if (!piSdkAvailable()) {
      const ready = await waitForPiSDK();
      if (!ready) { setError(s.errNoPi); return; }
    }

    setPhase('paying');
    try {
      await piSDK.topUpWallet(amt, {
        onReadyForServerApproval: (_pid, data) => {
          const d = data as { success?: boolean; error?: string };
          if (d && d.success === false) {
            setError(d.error || s.errGeneric);
            setPhase('error');
          }
        },
        onReadyForServerCompletion: (_pid, _txid, data) => {
          const d = data as { success?: boolean; balance?: number; error?: string };
          if (d && d.success) {
            const newBal = typeof d.balance === 'number' ? d.balance : balance + amt;
            setSuccess(s.okCredited.replace('{b}', String(newBal)));
            setPhase('done');
            setAmount('');
            onCredited?.();
          } else {
            setError((d && d.error) || s.errGeneric);
            setPhase('error');
          }
        },
        onCancel: () => {
          setSuccess(null);
          setError(s.cancelled);
          reset(true);
        },
        onError: (err) => {
          console.error('Top-up error:', err);
          setError(s.errGeneric);
          setPhase('error');
        },
      });
    } catch (err) {
      console.error('Top-up start error:', err);
      setError(s.errGeneric);
      setPhase('error');
    }
  };

  return (
    <section className="card-surface p-5 space-y-4">
      <div>
        <h2 className="font-heading font-semibold text-navy flex items-center gap-2">
          <Coins size={18} className="text-brand" /> {s.title}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{s.current}</p>
          <p className="font-heading font-bold text-2xl text-navy">
            {balance} <span className="text-brand">π</span>
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">{s.quick}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              onClick={() => { setAmount(String(q)); setError(null); setSuccess(null); }}
              className={`rounded-full border px-4 py-1.5 text-sm transition disabled:opacity-50 ${
                amount === String(q)
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-background text-navy'
              }`}
            >
              {q} π
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number" inputMode="decimal" min={MIN_TOPUP} step="0.1"
          value={amount}
          disabled={busy}
          onChange={(e) => { setAmount(e.target.value); setError(null); setSuccess(null); }}
          placeholder={s.placeholder}
          className="flex-1 min-w-0 rounded-2xl border border-border bg-background px-4 py-3 text-navy outline-none focus:border-brand disabled:opacity-50"
        />
        <button
          onClick={start}
          disabled={busy || !amount}
          className="btn-primary text-sm px-5 disabled:opacity-50 flex items-center gap-1.5"
        >
          {busy ? <><Loader2 size={15} className="animate-spin" /> {s.paying}</> : s.btn}
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#DC2626] flex items-center gap-1.5">
          {phase === 'cancelled' ? <Info size={13} /> : <XCircle size={13} />} {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-[#16A34A] flex items-center gap-1.5">
          <CheckCircle2 size={13} /> {success}
        </p>
      )}
    </section>
  );
}
