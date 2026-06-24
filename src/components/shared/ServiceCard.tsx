import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Shield } from 'lucide-react';
import type { Service } from '@/types';
import { StarRating } from './StarRating';
import Price from '@/components/shared/Price';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n';

interface ServiceCardProps {
  service: Service;
  index?: number;
}

export function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const hasImage = !!service.image && !imgError;
  const hasAvatar = !!service.freelancer.avatar && !avatarError;
  const initial = (service.freelancer.name || 'π').charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0, 0, 0.2, 1] }}
    >
      <Link to={`/service/${service.id}`} className="block group">
        <div className="card-surface-hover overflow-hidden h-full flex flex-col">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {hasImage ? (
              <>
                <img
                  src={service.image}
                  alt={service.title}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1E1B4B] via-[#2A2566] to-[#443B8E] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                <span className="text-[110px] font-bold leading-none select-none text-[#F2622E] opacity-30">π</span>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/40 text-xs font-semibold tracking-widest uppercase">WorkπServ</span>
              </div>
            )}
            {/* Escrow badge */}
            {service.escrow && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-escrow-light text-escrow text-xs font-medium px-2.5 py-1 rounded-full">
                <Shield size={12} />
                Escrow
              </div>
            )}
            {/* Category badge */}
            <div className="absolute top-3 left-3 bg-brand text-white backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full capitalize">
              {service.category}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-semibold text-navy line-clamp-2 group-hover:text-brand transition-colors duration-200">
              {service.title}
            </h3>

            {/* Freelancer */}
            <div className="flex items-center gap-2 mt-3">
              {hasAvatar ? (
                <img
                  src={service.freelancer.avatar}
                  alt={service.freelancer.name}
                  onError={() => setAvatarError(true)}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">{initial}</span>
              )}
              <span className="text-sm text-muted-foreground font-medium">{service.freelancer.name}</span>
              {service.freelancer.verified && (
                <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="mt-2">
              <StarRating rating={service.rating} size={14} showValue reviewCount={service.reviewCount} />
            </div>

            {/* Price & Delivery */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              {service.priceCurrency === 'USD'
                ? <Price usd={service.price} className="text-brand font-bold text-lg" />
                : <Price pi={service.price} className="text-brand font-bold text-lg" />}
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock size={12} />
                <span>{service.deliveryDays} {t('service.days')}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
