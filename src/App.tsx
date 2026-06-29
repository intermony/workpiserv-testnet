import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { WelcomeModal } from '@/components/shared/WelcomeModal';
import ConsentGate from '@/components/ConsentGate';
import { usePiAuth } from '@/hooks/usePiAuth';
import { LanguageProvider } from '@/i18n';
import AdminPage from '@/pages/AdminPage';
import HomePage from '@/pages/HomePage';
import MarketplacePage from '@/pages/MarketplacePage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import OrdersPage from '@/pages/OrdersPage';
import ProfilePage from '@/pages/ProfilePage';
import CreateServicePage from '@/pages/CreateServicePage';
import MessagesPage from '@/pages/MessagesPage';
import AboutPage from '@/pages/static/AboutPage';
import HelpPage from '@/pages/static/HelpPage';
import SafetyPage from '@/pages/static/SafetyPage';
import ContactPage from '@/pages/static/ContactPage';
import ReportPage from '@/pages/static/ReportPage';
import BlogPage from '@/pages/static/BlogPage';
import AffiliatePage from '@/pages/static/AffiliatePage';
import PrivacyPage from '@/pages/static/PrivacyPage';
import TermsPage from '@/pages/static/TermsPage';
import CookiesPage from '@/pages/static/CookiesPage';

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox: boolean }) => void;
      authenticate: (scopes: string[], onIncompletePaymentFound: (payment: unknown) => void) => Promise<{ user: { uid: string; username: string } }>;
    };
  }
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // ⚠️ On récupère aussi `token` et `logout` depuis usePiAuth pour la porte de
  // consentement. Si ton hook les nomme autrement (ex. signOut) ou ne les expose
  // pas, voir les deux solutions de repli en bas de ce fichier.
  const { user, isNewUser, clearNewUser, token, logout } = usePiAuth();

  // Une fois les CGU acceptées dans cette session, on masque la porte sans recharger.
  const [termsAccepted, setTermsAccepted] = useState(false);

  // GitHub Pages SPA fallback: 404.html sends deep links to /?redirect=/path.
  // Read that param once on load and route to it client-side.
  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect) {
      navigate(redirect, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remonter en haut de page à chaque changement de route
  // (sinon, en cliquant un lien du footer, la page reste scrollée en bas)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Le Pioneer est connecté mais n'a pas encore accepté la version courante des CGU.
  const mustAcceptTerms = !!user && !user.termsAccepted && !termsAccepted;

  return (
    <LanguageProvider>
    <AppLayout>
      {/* Porte de consentement — bloque l'app tant que les CGU ne sont pas acceptées.
          « Je ne suis pas d'accord » déconnecte immédiatement le Pioneer. */}
      {mustAcceptTerms && (
        <ConsentGate
          apiBaseUrl={import.meta.env.VITE_API_URL}
          token={token}
          onAccepted={() => setTermsAccepted(true)}
          onDeclined={logout}
        />
      )}

      {/* Welcome Modal — nouveaux Pioneers uniquement */}
      {isNewUser && user && (
        <WelcomeModal
          username={user.username}
          onClose={clearNewUser}
        />
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/create-service" element={<CreateServicePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
    </LanguageProvider>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   NOTES D'INTÉGRATION (à vérifier une fois, puis tu peux supprimer ce bloc)

   1) `token` et `logout` viennent de usePiAuth. Si ton hook NE les expose PAS :

      • Token via localStorage — remplace `token={token}` par :
          token={localStorage.getItem('token') || ''}
        (mets la VRAIE clé sous laquelle tu stockes le JWT après login.)

      • Déconnexion — si ta fonction s'appelle autrement, adapte `onDeclined`.
        Exemple minimal si tu n'as pas de fonction dédiée :
          onDeclined={() => { localStorage.removeItem('token'); window.location.href = '/'; }}

      • Si tu utilises un client axios `api` avec le token déjà attaché, tu peux
        ignorer apiBaseUrl/token et utiliser l'option intégrée de ConsentGate :
          onAccept={async () => { await api.post('/api/terms/accept', { version: '2026-06-29' }); }}

   2) « Demandé une seule fois » : pour que la porte ne réapparaisse pas aux
      connexions suivantes, usePiAuth doit conserver le champ `termsAccepted`
      renvoyé par /api/auth/me. Si ton hook fait setUser(data) (tout l'objet),
      c'est automatique ; s'il reconstruit un objet typé, ajoute-y `termsAccepted`.
   ─────────────────────────────────────────────────────────────────────────── */
