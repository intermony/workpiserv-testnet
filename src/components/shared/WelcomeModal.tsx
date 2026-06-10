import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Briefcase, X } from 'lucide-react';

interface WelcomeModalProps {
  username: string;
  onClose: () => void;
}

export function WelcomeModal({ username, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();

  const handleChoice = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">π</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-navy">
              Welcome, @{username}! 🎉
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              What would you like to do on WorkπServ?
            </p>
          </div>

          {/* Choices */}
          <div className="space-y-3">
            <button
              onClick={() => handleChoice('/marketplace')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-brand hover:bg-brand-light transition-all text-left group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                <ShoppingBag size={22} className="text-brand group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold text-navy">Find a Service</p>
                <p className="text-xs text-gray-500">Browse and buy services in Pi</p>
              </div>
            </button>

            <button
              onClick={() => handleChoice('/create-service')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-2xl hover:border-brand hover:bg-brand-light transition-all text-left group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                <Briefcase size={22} className="text-brand group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold text-navy">Sell a Service</p>
                <p className="text-xs text-gray-500">Publish your skills and earn Pi</p>
              </div>
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={onClose}
            className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} /> Explore on my own
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
              }
