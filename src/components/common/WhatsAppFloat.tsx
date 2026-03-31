'use client';

import { useState, useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8613800000000';

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => setMounted(true), []);

  // Hide on admin pages (with or without locale prefix).
  const isAdminRoute = pathname === '/admin' || pathname.includes('/admin');
  if (!mounted || isAdminRoute) return null;

  const message = encodeURIComponent(
    'Hello! I am interested in your marine equipment products. Could you provide more information?',
  );
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="px-3 py-1.5 rounded-lg bg-primary-800 text-white text-sm font-medium whitespace-nowrap shadow-lg"
          >
            Chat with us
          </motion.span>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 flex items-center justify-center rounded-full bg-green-500 text-white shadow-xl hover:bg-green-600 transition-colors"
      >
        {/* Ping animation */}
        <motion.span
          className="absolute inset-0 rounded-full bg-green-400"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 3,
            delay: 2,
          }}
        />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </motion.a>
    </div>
  );
}
