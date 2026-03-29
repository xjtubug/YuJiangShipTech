'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  Send,
  Play,
  Briefcase,
  MessageCircle,
} from 'lucide-react';

export default function Footer() {
  const tFooter = useTranslations('footer');

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch { /* silently fail */ }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-primary-900 text-primary-100">
      <div className="container-wide py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Follow Us */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-primary-300 font-medium">
              {tFooter('followUs')}
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/8613800000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-800 text-primary-300 hover:bg-green-600 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/yujiang-ship-tech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-800 text-primary-300 hover:bg-blue-600 hover:text-white transition-colors"
              >
                <Briefcase className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@yujiang-ship-tech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-800 text-primary-300 hover:bg-red-600 hover:text-white transition-colors"
              >
                <Play className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-sm text-primary-300 font-medium shrink-0">
              {tFooter('newsletter')}
            </span>
            {subscribed ? (
              <p className="text-green-400 text-sm font-medium">
                ✓ {tFooter('subscribed') ?? 'Thank you for subscribing!'}
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 flex-1 md:flex-initial">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tFooter('emailPlaceholder')}
                  className="flex-1 min-w-0 md:w-64 px-3 py-2 rounded-lg bg-primary-800 border border-primary-700 text-white placeholder:text-primary-500 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                  aria-label={tFooter('subscribe')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-800">
        <div className="container-wide py-4 text-center text-sm text-primary-400">
          <p>{tFooter('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
