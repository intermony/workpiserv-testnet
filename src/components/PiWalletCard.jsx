// ============================================================
// src/components/PiWalletCard.jsx
// Détecte le wallet Pi → affiche l'adresse ou propose création
// Utilise Pi.Wallet.getUserMigratedWalletAddresses() du SDK
// ============================================================
import { useState, useEffect } from 'react';
import { notify } from './NotificationSystem';

const API = import.meta.env.VITE_API_URL;

// ── Détection Pi Browser ──
function isPiBrowser() {
  return typeof window !== 'undefined' && typeof window.Pi !== 'undefined';
}

// ── Tronquer adresse wallet ──
function truncate(addr) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

// ── Copier dans le presse-papier ──
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify.success('تم النسخ ✓', 'تم نسخ عنوان المحفظة');
  } catch {
    notify.error('خطأ', 'تعذر نسخ العنوان');
  }
}

export default function PiWalletCard({ token }) {
  const [walletAddr, setWalletAddr] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // ── Au montage : charger depuis SDK Pi ──
  useEffect(() => {
    if (!isPiBrowser()) {
      setLoading(false);
      return;
    }

    window.Pi.Wallet.getUserMigratedWalletAddresses()
      .then(data => {
        const addresses = data?.wallets || [];
        if (addresses.length > 0) {
          const addr = addresses[0].publicKey;
          setWalletAddr(addr);
          // Sauvegarder en base si pas encore fait
          saveWalletToBackend(addr);
        }
      })
      .catch(() => {
        // Wallet pas encore créé ou erreur
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Sauvegarder l'adresse côté backend ──
  async function saveWalletToBackend(address) {
    if (!token || !address) return;
    try {
      await fetch(`${API}/api/user/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ walletAddress: address }),
      });
    } catch { /* silencieux */ }
  }

  // ── Ouvrir Pi Wallet pour création ──
  function openPiWallet() {
    if (isPiBrowser()) {
      // Dans Pi Browser, wallet.pi ouvre la page native du wallet
      window.location.href = 'https://wallet.pi';
    } else {
      notify.info('Pi Browser مطلوب', 'يرجى فتح التطبيق من متصفح Pi Browser');
    }
  }

  // ── Styles ──
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(251,191,36,0.05) 100%)',
    border: '1.5px solid rgba(245,158,11,0.30)',
    borderRadius: '16px',
    padding: '18px 20px',
    marginBottom: '16px',
    fontFamily: 'inherit',
  };

  if (!isPiBrowser()) return null; // Invisible hors Pi Browser

  return (
    <div style={cardStyle} dir="rtl">
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '22px' }}>🔑</span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#fcd34d' }}>
            محفظة Pi الخاصة بك
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            عنوان المحفظة على شبكة Pi
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          جارٍ التحميل...
        </div>
      ) : walletAddr ? (
        /* ── Wallet trouvé ── */
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px 14px'
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#f1f5f9', flex: 1, wordBreak: 'break-all' }}>
              {truncate(walletAddr)}
            </span>
            <button
              onClick={() => copyToClipboard(walletAddr)}
              style={{
                background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: '8px', padding: '6px 10px', color: '#fcd34d',
                cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap'
              }}
            >
              📋 نسخ
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#10b981' }}>
            ✓ المحفظة متصلة بنجاح
          </p>
        </div>
      ) : (
        /* ── Pas de wallet ── */
        <div>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
            لم يتم اكتشاف محفظة Pi. قم بإنشاء محفظتك لتتمكن من الدفع واستلام Pi.
          </p>
          <button
            onClick={openPiWallet}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none', borderRadius: '10px',
              padding: '10px 20px', color: '#000',
              fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <span>🔑</span> إنشاء محفظة Pi
          </button>
        </div>
      )}
    </div>
  );
            }
        
