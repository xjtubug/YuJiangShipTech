'use client';

import { useState, type FormEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Play,
  Briefcase,
  MessageCircle,
  Anchor,
} from 'lucide-react';

const productCategories = [
  { label: 'Marine Valves', href: '/products?category=marine-valves' },
  { label: 'Ship Pumps', href: '/products?category=ship-pumps' },
  { label: 'Deck Equipment', href: '/products?category=deck-equipment' },
  { label: 'Navigation Equipment', href: '/products?category=navigation-equipment' },
  { label: 'Safety Equipment', href: '/products?category=safety-equipment' },
  { label: 'Engine Parts', href: '/products?category=engine-parts' },
];

export default function Footer() {
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tContact = useTranslations('contact');

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  const quickLinks = [
    { label: tNav('home'), href: '/' },
    { label: tNav('products'), href: '/products' },
    { label: tNav('about'), href: '/about' },
    { label: tNav('contact'), href: '/contact' },
    { label: tNav('quote'), href: '/quote' },
  ];

  return (
    <footer className="bg-primary-900 text-primary-100">
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Column 1: Company info */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-0.5">
              <span className="text-2xl font-extrabold text-accent-500">
                YuJiang
              </span>
              <span className="text-2xl font-extrabold text-white">
                Ship&nbsp;Tech
              </span>
            </Link>

            <p className="text-primary-300 text-sm leading-relaxed">
              Professional marine equipment manufacturer and exporter. Providing
              high-quality valves, pumps, deck equipment, and navigation systems
              for global shipbuilding and shipping industries.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-primary-400 font-medium">
                {tFooter('followUs')}
              </span>
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

          {/* Column 2: Quick links */}
          <div>
            <h3 className="text-white font-semibold text-base mb-5">
              {tFooter('quickLinks')}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-300 hover:text-accent-400 text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <Anchor className="w-3 h-3 text-primary-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Product categories */}
          <div>
            <h3 className="text-white font-semibold text-base mb-5">
              {tNav('products')}
            </h3>
            <ul className="space-y-3">
              {productCategories.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-primary-300 hover:text-accent-400 text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <Anchor className="w-3 h-3 text-primary-500" />
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact + Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold text-base mb-5">
                {tFooter('contactInfo')}
              </h3>
              <ul className="space-y-3 text-sm text-primary-300">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
                  <span>{tContact('addressValue')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-accent-500 shrink-0" />
                  <a href="tel:+8657486000000" className="hover:text-accent-400 transition-colors">
                    +86 574-8600-0000
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-accent-500 shrink-0" />
                  <a href="mailto:sales@yujiangshiptech.com" className="hover:text-accent-400 transition-colors">
                    sales@yujiangshiptech.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-accent-500 shrink-0" />
                  <span>{tContact('workingHoursValue')}</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">
                {tFooter('newsletter')}
              </h4>
              <p className="text-primary-400 text-xs mb-3">
                {tFooter('newsletterDesc')}
              </p>
              {subscribed ? (
                <p className="text-green-400 text-sm font-medium">
                  ✓ Thank you for subscribing!
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tFooter('emailPlaceholder')}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-primary-800 border border-primary-700 text-white placeholder:text-primary-500 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
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
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-800">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-primary-400">
          <p>{tFooter('copyright')}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-accent-400 transition-colors">
              {tFooter('privacy')}
            </Link>
            <Link href="/terms" className="hover:text-accent-400 transition-colors">
              {tFooter('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
