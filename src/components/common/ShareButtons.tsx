'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Briefcase,
  Globe,
  AtSign,
  Mail,
  Link2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

interface ShareChannel {
  id: string;
  label: string;
  icon: typeof MessageCircle;
  color: string;
  getHref: (url: string, title: string, description: string) => string; // not all channels use every param
}

const channels: ShareChannel[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500 hover:bg-green-600',
    getHref: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Briefcase,
    color: 'bg-blue-600 hover:bg-blue-700',
    getHref: (url, _title) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Globe,
    color: 'bg-blue-500 hover:bg-blue-600',
    getHref: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter',
    label: 'Twitter',
    icon: AtSign,
    color: 'bg-sky-500 hover:bg-sky-600',
    getHref: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'bg-primary-600 hover:bg-primary-700',
    getHref: (url, title, description) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
  },
];

export default function ShareButtons({
  url,
  title,
  description = '',
}: ShareButtonsProps) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-sm font-medium text-primary-600 mr-1">
        {t('share')}:
      </span>

      {channels.map((channel) => {
        const Icon = channel.icon;
        return (
          <a
            key={channel.id}
            href={channel.getHref(url, title, description)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${channel.label}`}
            className={cn(
              'w-9 h-9 flex items-center justify-center rounded-lg text-white transition-colors',
              channel.color,
            )}
          >
            <Icon className="w-4 h-4" />
          </a>
        );
      })}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className={cn(
          'relative w-9 h-9 flex items-center justify-center rounded-lg text-white transition-colors',
          copied
            ? 'bg-green-500'
            : 'bg-gray-500 hover:bg-gray-600',
        )}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span
              key="link"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Link2 className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-xs font-medium text-green-600"
          >
            Link copied!
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
