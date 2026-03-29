'use client';

import { useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Briefcase, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialItem {
  id: string;
  label: string;
  href: string;
  icon: typeof MessageCircle;
  color: string;
  hoverColor: string;
}

const socialItems: SocialItem[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: 'https://wa.me/8613800000000',
    icon: MessageCircle,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/yujiang-ship-tech',
    icon: Briefcase,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
  },
  {
    id: 'email',
    label: 'Email Us',
    href: 'mailto:sales@yujiangshiptech.com',
    icon: Mail,
    color: 'bg-primary-600',
    hoverColor: 'hover:bg-primary-700',
  },
];

export default function SocialFloat() {
  const pathname = usePathname();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[80] hidden md:flex flex-col gap-2">
      {socialItems.map((item, index) => {
        const Icon = item.icon;
        const isHovered = hoveredId === item.id;

        return (
          <motion.div
            key={item.id}
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1, type: 'spring', damping: 20 }}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <a
              href={item.href}
              target={item.id !== 'email' ? '_blank' : undefined}
              rel={item.id !== 'email' ? 'noopener noreferrer' : undefined}
              aria-label={item.label}
              className={cn(
                'flex items-center rounded-full text-white shadow-lg transition-all duration-300 overflow-hidden',
                item.color,
                item.hoverColor,
                isHovered ? 'pr-4' : '',
              )}
            >
              <span className="w-10 h-10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </motion.div>
        );
      })}
    </div>
  );
}
