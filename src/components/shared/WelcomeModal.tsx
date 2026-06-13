/* ════════════════════════════════════════════════════════════
   WorkPiServ — Modal d'onboarding nouveaux Pioneers
   4 slides animées : Bienvenue → Acheter → Vendre → Sécurité
   Puis choix final : Explorer / Vendre
   Conçu pour des utilisateurs peu familiers avec les apps web.
   ════════════════════════════════════════════════════════════ */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Briefcase, X } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface WelcomeModalProps {
  username: string;
  onClose: () => void;
}

const SLIDES = [
  {
    emoji: '🎉',
    bgColor: 'bg-orange-50',
    accentColor: 'text-brand',
    titleKey: 'onboard.slide1Title',
    descKey: 'onboard.slide1Desc',
  },
  {
    emoji: '🛒',
    bgColor: 'bg-blue-50',
    accentColor: 'text-blue-600',
    titleKey: 'onboard.slide2Title',
    descKey: 'onboard.slide2Desc',
    steps: ['onboard.slide2Step1', 'onboard.slide2Step2', 'onboard.slide2Step3'],
  },
  {
    emoji: '💼',
    bgColor: 'bg-green-50',
    accentColor: 'text-green-600',
    titleKey: 'onboard.slide3Title',
    descKey: 'onboard.slide3Desc',
    steps: ['onboard.slide3Step1', 'onboard.slide3Step2', 'onboard.slide3Step3'],
  },
  {
    emoji: '🔒',
    bgColor: 'bg-purple-50',
    accentColor: 'text-purple-600',
    titleKey: 'onboard.slide4Title',
    descKey: 'onboard.slide4Desc',
    highlight: 'onboard.slide4Highlight',
  },
];

export function WelcomeModal({ username, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLastSlide = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  const goNext = () => {
    setDirection(1);
    setSlide(s => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setSlide(s => s - 1);
  };

  const handleChoice = (path: string) => {
    onClose();
    navigate(path);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Barre de progression */}
          <div className="flex gap-1.5 p-4 pb-0">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  i <= slide ? 'bg-brand' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>

          {/* Contenu animé */}
          <div className="relative overflow-hidden min-h-[280px] p-6 pt-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Slides 0-3 : onboarding */}
                {slide < SLIDES.length && (
                  <div className="text-center">
                    {/* Emoji principal */}
                    <div className={`w-20 h-20 ${current.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <span className="text-4xl">{current.emoji}</span>
                    </div>

                    {/* Titre */}
                    <h2 className={`font-heading font-bold text-xl text-navy mb-2`}>
                      {t(current.titleKey).replace('{username}', username)}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-500 text-sm mb-4">
                      {t(current.descKey)}
                    </p>

                    {/* Étapes (slides 1 et 2) */}
                    {'steps' in current && current.steps && (
                      <div className="space-y-2 text-left">
                        {current.steps.map((stepKey, i) => (
                          <div key={i} className={`flex items-center gap-3 p-2.5 ${current.bgColor} rounded-xl`}>
                            <span className={`w-6 h-6 rounded-full ${current.bgColor} border-2 ${
                              current.accentColor.replace('text-', 'border-')
                            } flex items-center justify-center text-xs font-bold ${current.accentColor} shrink-0`}>
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-700 font-medium">{t(stepKey)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Highlight sécurité (slide 3) */}
                    {'highlight' in current && current.highlight && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-left">
                        <p className="text-sm text-purple-700 font-semibold">
                          ✅ {t(current.highlight)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {!isLastSlide ? (
            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              {slide > 0 ? (
                <button
                  onClick={goPrev}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ←
                </button>
              ) : <div />}
              <button
                onClick={goNext}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
              >
                {t('onboard.next')} <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            /* Slide finale : choix acheteur / vendeur */
            <div className="px-6 pb-6 space-y-3">
              <button
                onClick={() => handleChoice('/marketplace')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-brand hover:bg-brand-light transition-all text-left group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand transition-colors">
                  <ShoppingBag size={22} className="text-brand group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold text-navy">{t('onboard.buyTitle')}</p>
                  <p className="text-xs text-gray-500">{t('onboard.buyDesc')}</p>
                </div>
              </button>

              <button
                onClick={() => handleChoice('/create-service')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-green-400 hover:bg-green-50 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-500 transition-colors">
                  <Briefcase size={22} className="text-green-600 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold text-navy">{t('onboard.sellTitle')}</p>
                  <p className="text-xs text-gray-500">{t('onboard.sellDesc')}</p>
                </div>
              </button>

              <button
                onClick={onClose}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-500 transition-colors py-1"
              >
                {t('onboard.skip')}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
