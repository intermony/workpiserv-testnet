import { useState, useEffect, useCallback } from 'react';
import { ArrowDownToLine, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '@/i18n';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://workpiserv-api.onrender.com';
const MIN_WITHDRAWAL = 0.5; // indicatif côté client ; le backend fait foi

type WStatus = 'requested' | 'processing' | 'submitted' | 'completed' | 'failed' | 'blocked';

interface Withdrawal {
  _id: string;
  amount: number;
  status: WStatus;
  availableAt?: string;
  txid?: string;
  createdAt?: string;
}

interface Strings {
  title: string; sub: string; available: string; min: string; placeholder: string;
  btn: string; sending: string; histTitle: string; histEmpty: string;
  errInvalid: string; errInsufficient: string; okRequested: string;
  st: Record<WStatus, string>;
}

const STR: Record<string, Strings> = {
  en: {
    title: 'Withdraw to Pi wallet',
    sub: 'Withdrawals are sent to your Pi wallet automatically within 48h, unless flagged for review.',
    available: 'Available balance', min: 'Minimum', placeholder: 'Amount in π',
    btn: 'Withdraw', sending: 'Sending…', histTitle: 'Recent withdrawals', histEmpty: 'No withdrawals yet.',
    errInvalid: 'Enter a valid amount.', errInsufficient: 'Insufficient balance.',
    okRequested: 'Withdrawal requested. It will be paid within 48h unless reviewed.',
    st: { requested: 'Pending (48h)', processing: 'Processing', submitted: 'On blockchain', completed: 'Paid', failed: 'Failed (refunded)', blocked: 'Blocked (refunded)' },
  },
  fr: {
    title: 'Retirer vers le portefeuille Pi',
    sub: 'Les retraits sont envoyés automatiquement sur votre portefeuille Pi sous 48h, sauf vérification.',
    available: 'Solde disponible', min: 'Minimum', placeholder: 'Montant en π',
    btn: 'Retirer', sending: 'Envoi…', histTitle: 'Retraits récents', histEmpty: 'Aucun retrait pour le moment.',
    errInvalid: 'Entrez un montant valide.', errInsufficient: 'Solde insuffisant.',
    okRequested: 'Demande enregistrée. Versement sous 48h sauf vérification.',
    st: { requested: 'En attente (48h)', processing: 'En cours', submitted: 'Sur la blockchain', completed: 'Versé', failed: 'Échec (remboursé)', blocked: 'Bloqué (remboursé)' },
  },
  ar: {
    title: 'السحب إلى محفظة Pi',
    sub: 'تُرسل عمليات السحب تلقائيًا إلى محفظتك على Pi خلال 48 ساعة، ما لم تخضع للمراجعة.',
    available: 'الرصيد المتاح', min: 'الحد الأدنى', placeholder: 'المبلغ بالـ π',
    btn: 'سحب', sending: 'جارٍ الإرسال…', histTitle: 'عمليات السحب الأخيرة', histEmpty: 'لا توجد عمليات سحب بعد.',
    errInvalid: 'أدخل مبلغًا صحيحًا.', errInsufficient: 'الرصيد غير كافٍ.',
    okRequested: 'تم تسجيل الطلب. الدفع خلال 48 ساعة ما لم تتم المراجعة.',
    st: { requested: 'قيد الانتظار (48س)', processing: 'قيد المعالجة', submitted: 'على البلوكشين', completed: 'تم الدفع', failed: 'فشل (مُسترد)', blocked: 'محظور (مُسترد)' },
  },
  zh: {
    title: '提现到 Pi 钱包',
    sub: '提现将在 48 小时内自动发送到您的 Pi 钱包，除非需要审核。',
    available: '可用余额', min: '最低', placeholder: '金额（π）',
    btn: '提现', sending: '发送中…', histTitle: '最近的提现', histEmpty: '暂无提现记录。',
    errInvalid: '请输入有效金额。', errInsufficient: '余额不足。',
    okRequested: '提现已申请。将在 48 小时内支付，除非需要审核。',
    st: { requested: '等待中（48小时）', processing: '处理中', submitted: '区块链处理中', completed: '已支付', failed: '失败（已退款）', blocked: '已拦截（已退款）' },
  },
  vi: {
    title: 'Rút về ví Pi',
    sub: 'Các khoản rút được gửi tự động về ví Pi của bạn trong vòng 48 giờ, trừ khi cần xem xét.',
    available: 'Số dư khả dụng', min: 'Tối thiểu', placeholder: 'Số tiền (π)',
    btn: 'Rút tiền', sending: 'Đang gửi…', histTitle: 'Lịch sử rút gần đây', histEmpty: 'Chưa có khoản rút nào.',
    errInvalid: 'Nhập số tiền hợp lệ.', errInsufficient: 'Số dư không đủ.',
    okRequested: 'Đã gửi yêu cầu. Thanh toán trong 48 giờ trừ khi cần xem xét.',
    st: { requested: 'Đang chờ (48h)', processing: 'Đang xử lý', submitted: 'Trên blockchain', completed: 'Đã thanh toán', failed: 'Thất bại (đã hoàn)', blocked: 'Bị chặn (đã hoàn)' },
  },
};

const STATUS_STYLE: Record<WStatus, { color: string; Icon: typeof Clock }> = {
  requested:  { color: '#FBBF24', Icon: Clock },
  processing: { color: '#60A5FA', Icon: Loader2 },
  submitted:  { color: '#60A5FA', Icon: Loader2 },
  completed:  { color: '#4ADE80', Icon: CheckCircle2 },
  failed:     { color: '#F87171', Icon: XCircle },
  blocked:    { color: '#F87171', Icon: XCircle },
};

export default function WithdrawCard({ balance }: { balance: number }) {
  const { lang } = useLanguage();
  const s = STR[lang] || STR.en;

  const [amount, setAmount] = useState('');
  const [reserved, setReserved] = useState(0); // déduit localement après une demande réussie
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [list, setList] = useState<Withdrawal[]>([]);

  const token = () => localStorage.getItem('workpiserv_token') || '';
  const display = Math.max(0, +(balance - reserved).toFixed(7));

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/withdrawals`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) return;
      setList(await r.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const submit = async () => {
    setError(null); setSuccess(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError(s.errInvalid); return; }
    if (amt > display) { setError(s.errInsufficient); return; }

    setSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/api/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setError(data.error || `HTTP ${r.status}`); setSubmitting(false); return; }
      setReserved(v => +(v + amt).toFixed(7));
      setAmount('');
      setSuccess(s.okRequested);
      fetchList();
    } catch {
      setError(s.errInvalid);
    }
    setSubmitting(false);
  };

  return (
    <section className="card-surface p-5 space-y-4">
      <div>
        <h2 className="font-heading font-semibold text-navy flex items-center gap-2">
          <ArrowDownToLine size={18} className="text-brand" /> {s.title}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{s.available}</p>
          <p className="font-heading font-bold text-2xl text-navy">{display} <span className="text-brand">π</span></p>
        </div>
        <p className="text-xs text-muted-foreground">{s.min}: {MIN_WITHDRAWAL} π</p>
      </div>

      <div className="flex gap-2">
        <input
          type="number" inputMode="decimal" min={MIN_WITHDRAWAL} step="0.01"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(null); setSuccess(null); }}
          placeholder={s.placeholder}
          className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-navy outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          disabled={submitting || !amount}
          className="btn-primary text-sm px-5 disabled:opacity-50 flex items-center gap-1.5"
        >
          {submitting ? <><Loader2 size={15} className="animate-spin" /> {s.sending}</> : s.btn}
        </button>
      </div>

      {error && <p className="text-xs text-[#F87171]">{error}</p>}
      {success && <p className="text-xs text-[#4ADE80]">{success}</p>}

      {list.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-sm font-medium text-muted-foreground">{s.histTitle}</p>
          {list.map(w => {
            const st = STATUS_STYLE[w.status] || STATUS_STYLE.requested;
            const Icon = st.Icon;
            return (
              <div key={w._id} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-2.5">
                <span className="font-semibold text-navy">{w.amount} π</span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: st.color }}>
                  <Icon size={13} className={w.status === 'processing' || w.status === 'submitted' ? 'animate-spin' : ''} />
                  {s.st[w.status] || w.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
