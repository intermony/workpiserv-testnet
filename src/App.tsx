import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { WelcomeModal } from '@/components/shared/WelcomeModal';
import { API_BASE_URL } from '@/config/network';
import ConsentGate from '@/components/ConsentGate';
import { usePiAuth, AuthProvider } from '@/hooks/usePiAuth';
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

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isNewUser, clearNewUser, logout, refreshUser } = usePiAuth();

  // Masque la porte instantanément après acceptation, le temps que refreshUser()
  // re-synchronise user.termsAccepted depuis le serveur (la source de vérité).
  const [justAccepted, setJustAccepted] = useState(false);

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

  // Connecté mais CGU pas encore acceptées (état lu depuis le backend via /api/auth/me).
  const mustAcceptTerms = !!user && !user.termsAccepted && !justAccepted;

  return (
    <LanguageProvider>
    <AppLayout>
      {/* Porte de consentement — bloque l'app tant que les CGU ne sont pas acceptées.
          « Je ne suis pas d'accord » déconnecte immédiatement le Pioneer (état partagé). */}
      {mustAcceptTerms && (
        <ConsentGate
          apiBaseUrl={API_BASE_URL}
          onAccepted={() => { setJustAccepted(true); refreshUser(); }}
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

export default function App() {
  // AuthProvider = état d'auth partagé par toute l'app (Header, pages, porte de consentement).
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
