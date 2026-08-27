import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { ServiceImageUpload } from '@/components/ServiceImageUpload';

import { API_BASE_URL as API_URL, apiHeaders, handleUnauthorized } from '@/config/network';
const CATEGORIES = [
  { id: 'design',      name: 'Design' },
  { id: 'development', name: 'Development' },
  { id: 'marketing',  name: 'Marketing' },
  { id: 'writing',    name: 'Writing & Translation' },
  { id: 'video',      name: 'Video & Animation' },
  { id: 'audio',      name: 'Audio & Voice' },
  { id: 'business',   name: 'Business' },
  { id: 'consulting', name: 'Consulting' },
];

type FieldName = 'title' | 'category' | 'price' | 'description';

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const [title, setTitle]           = useState('');
  const [category, setCategory]     = useState('');
  const [price, setPrice]           = useState('');
  const [priceCurrency, setPriceCurrency] = useState<'PI' | 'USD'>('PI');
  const [deliveryDays, setDelivery] = useState('3');
  const [description, setDesc]      = useState('');
  const [image, setImage]           = useState('');

  // Validation par champ — chaque règle est indépendante pour permettre
  // un message d'erreur précis sous le champ concerné.
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    title: false,
    category: false,
    price: false,
    description: false,
  });

  const titleRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const titleValid = title.trim().length >= 10;
  const categoryValid = category.length > 0;
  const priceValid = Number(price) > 0;
  const descValid = description.trim().length >= 30;

  const isValid = titleValid && categoryValid && priceValid && descValid;

  function markTouched(field: FieldName) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  const showTitleError = touched.title && !titleValid;
  const showCategoryError = touched.category && !categoryValid;
  const showPriceError = touched.price && !priceValid;
  const showDescError = touched.description && !descValid;

  const errorBorderClass = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
  const normalBorderClass = 'border-border focus:border-brand focus:ring-brand/20';

  async function handleImageUpload(file: File) {
    let token: string | null = null;
    try { token = localStorage.getItem('workpiserv_token'); } catch { token = null; }

    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_URL}/api/services/upload-image`, {
      method: 'POST',
      headers: apiHeaders({
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }),
      body: formData,
    });

    if (!res.ok) {
      handleUnauthorized(res.status);
      throw new Error('upload failed');
    }
    const data = await res.json();
    setImage(data.imageUrl);
  }

  async function handleSubmit() {
    if (!isValid) {
      // Marque tous les champs comme "touchés" pour révéler tous les messages
      // d'erreur d'un coup, puis scroll+focus vers le premier champ invalide.
      setTouched({ title: true, category: true, price: true, description: true });

      const firstInvalid = !titleValid
        ? titleRef.current
        : !categoryValid
        ? categoryRef.current
        : !priceValid
        ? priceRef.current
        : descRef.current;

      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
      return;
    }

    setLoading(true);
    setError('');
    let token: string | null = null;
    try { token = localStorage.getItem('workpiserv_token'); } catch { token = null; }

    try {
      const res = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
        body: JSON.stringify({
          title: title.trim(),
          category,
          price: Number(price),
          priceCurrency,
          deliveryDays: Number(deliveryDays),
          description: description.trim(),
          image,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        handleUnauthorized(res.status);
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message || t('create.failed'));
      }
    } catch {
      setError(t('create.networkError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl text-navy mb-2">{t('create.success')}</h2>
          <p className="text-muted-foreground">{t('create.redirecting')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-6">
          <div className="text-sm text-muted-foreground mb-2">
            <Link to="/" className="text-brand hover:underline">{t('nav.home')}</Link>
            <span className="mx-2">/</span>
            <Link to="/profile" className="text-brand hover:underline">{t('nav.profile')}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{t('create.crumb')}</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-navy">{t('create.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('create.subtitle')}</p>
        </div>
      </div>

      <div className="section-container py-8 max-w-2xl">
        <div className="space-y-5">

          {/* Cover image */}
          <ServiceImageUpload
            currentImage={image}
            onUpload={handleImageUpload}
            onRemove={() => setImage('')}
            label={t('create.image')}
            hint={t('create.imageHint')}
            uploadingLabel={t('create.imageUploading')}
            errorFormat={t('create.imageErrorFormat')}
            errorSize={t('create.imageErrorSize')}
            errorGeneric={t('create.imageErrorGeneric')}
          />

          {/* Title */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-navy mb-1.5">
              {t('create.serviceTitle')} <span className="text-brand">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">Be specific and clear — min. 10 characters</p>
            <input
              ref={titleRef}
              type="text"
              placeholder={t('create.titlePh')}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => markTouched('title')}
              maxLength={120}
              aria-invalid={showTitleError}
              className={`w-full h-12 px-4 border rounded-xl text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                showTitleError ? errorBorderClass : normalBorderClass
              }`}
            />
            <div className="flex items-start justify-between mt-1 gap-2">
              {showTitleError ? (
                <p className="text-xs text-red-600">{t('create.errTitle')}</p>
              ) : <span />}
              <p className="text-xs text-muted-foreground text-right shrink-0">{title.length}/120</p>
            </div>
          </div>

          {/* Category */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-navy mb-1.5">
              {t('create.category')} <span className="text-brand">*</span>
            </label>
            <div className="relative">
              <select
                ref={categoryRef}
                value={category}
                onChange={e => setCategory(e.target.value)}
                onBlur={() => markTouched('category')}
                aria-invalid={showCategoryError}
                className={`w-full h-12 px-4 pr-10 border rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all bg-card ${
                  showCategoryError ? errorBorderClass : normalBorderClass
                }`}
              >
                <option value="">{t('create.selectCategory')}</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {showCategoryError && (
              <p className="text-xs text-red-600 mt-1">{t('create.errCategory')}</p>
            )}
          </div>

          {/* Price & Delivery */}
          <div className="card-surface p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">
                  {t('create.price')} <span className="text-brand">*</span>
                </label>
                {/* Devise : PI (montant fixe) ou USD (montant Pi verrouillé à la commande) */}
                <div className="flex gap-1 mb-2">
                  {(['PI', 'USD'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPriceCurrency(c)}
                      className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${priceCurrency === c ? 'bg-brand text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {c === 'PI' ? 'π Pi' : '$ USD'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-bold text-sm">{priceCurrency === 'USD' ? '$' : 'π'}</span>
                  <input
                    ref={priceRef}
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    onBlur={() => markTouched('price')}
                    min="1"
                    aria-invalid={showPriceError}
                    className={`w-full h-12 pl-8 pr-4 border rounded-xl text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                      showPriceError ? errorBorderClass : normalBorderClass
                    }`}
                  />
                </div>
                {showPriceError ? (
                  <p className="text-xs text-red-600 mt-1">{t('create.errPrice')}</p>
                ) : priceCurrency === 'USD' && (
                  <p className="text-[11px] text-muted-foreground mt-1">Le montant en Pi sera calculé et verrouillé au taux du moment lors de chaque commande.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">{t('create.delivery')}</label>
                <div className="relative">
                  <select
                    value={deliveryDays}
                    onChange={e => setDelivery(e.target.value)}
                    className="w-full h-12 px-4 pr-10 border border-border rounded-xl text-sm appearance-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-card"
                  >
                    {[1, 2, 3, 5, 7, 10, 14, 21, 30].map(d => (
                      <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-navy mb-1.5">
              {t('create.description')} <span className="text-brand">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">{t('create.descHint')}</p>
            <textarea
              ref={descRef}
              placeholder={t('create.descPh')}
              value={description}
              onChange={e => setDesc(e.target.value)}
              onBlur={() => markTouched('description')}
              rows={6}
              maxLength={2000}
              aria-invalid={showDescError}
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all resize-y ${
                showDescError ? errorBorderClass : normalBorderClass
              }`}
            />
            <div className="flex items-start justify-between mt-1 gap-2">
              {showDescError ? (
                <p className="text-xs text-red-600">{t('create.errDescription')}</p>
              ) : <span />}
              <p className="text-xs text-muted-foreground text-right shrink-0">{description.length}/2000</p>
            </div>
          </div>

          {/* Escrow note */}
          <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#0077B615', border: '1px solid #0077B640', color: '#004E64' }}>
            {t('create.escrowNote')}
          </div>

          {/* Error serveur (réseau, backend) — jamais utilisée pour la validation de formulaire */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isValid && !loading
                ? 'bg-brand text-white hover:bg-brand/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> {t('create.publishing')}</>
            ) : (
              t('create.publish')
            )}
          </button>

        </div>
      </div>
    </main>
  );
}
