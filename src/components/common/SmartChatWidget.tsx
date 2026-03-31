'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Configurable defaults – move to env / site-settings API later     */
/* ------------------------------------------------------------------ */

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '8613800000000';
const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'sales@yujiangshiptech.com';
const TELEGRAM_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? 'yujiangshiptech';
const WECHAT_QR_URL = process.env.NEXT_PUBLIC_WECHAT_QR_URL ?? '/contact#wechat';
const QQ_NUMBER = process.env.NEXT_PUBLIC_QQ_NUMBER ?? '123456789';
const LINE_ID = process.env.NEXT_PUBLIC_LINE_ID ?? '@yujiangshiptech';
const KAKAOTALK_URL =
  process.env.NEXT_PUBLIC_KAKAOTALK_URL ?? 'https://pf.kakao.com/_yujiang';

/* ------------------------------------------------------------------ */
/*  Brand SVG icons                                                   */
/* ------------------------------------------------------------------ */

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.137 6.137 0 0 1-.253-1.728c0-3.572 3.326-6.47 7.43-6.47.259 0 .51.013.76.034C16.673 4.685 13.035 2.188 8.691 2.188zm-2.6 4.408a1.073 1.073 0 0 1 0 2.146 1.073 1.073 0 0 1 0-2.146zm5.2 0a1.073 1.073 0 0 1 0 2.146 1.073 1.073 0 0 1 0-2.146zM16.68 8.882c-3.684 0-6.68 2.578-6.68 5.757 0 3.18 2.996 5.757 6.68 5.757a8.44 8.44 0 0 0 2.35-.34.71.71 0 0 1 .59.082l1.57.917a.265.265 0 0 0 .138.045c.132 0 .24-.108.24-.243 0-.06-.024-.118-.039-.175l-.322-1.218a.49.49 0 0 1 .176-.546C22.89 17.93 24 16.126 24 14.14v-.5c0-3.18-2.996-4.757-7.32-4.757zm-2.19 3.324a.893.893 0 1 1 0 1.786.893.893 0 0 1 0-1.786zm4.38 0a.893.893 0 1 1 0 1.786.893.893 0 0 1 0-1.786z" />
    </svg>
  );
}

function QQIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M21.395 15.035a39.548 39.548 0 0 0-1.257-3.025c0-.008.007-.015.007-.023 1.099-5.455-.038-8.155-.038-8.155C19.197 1.46 15.803 0 12 0 8.198 0 4.803 1.46 3.893 3.832c0 0-1.137 2.7-.038 8.155 0 .008.007.015.007.023a39.548 39.548 0 0 0-1.257 3.025c-1.437 3.87-1.078 5.152-.678 5.297.548.197 2.428-1.725 2.428-1.725 0 1.16.64 2.587 2.098 3.683-.534.157-1.664.618-1.294 1.14.218.307 1.107.313 2.293.158a9.97 9.97 0 0 0 4.548.5 9.97 9.97 0 0 0 4.548-.5c1.186.155 2.075.149 2.293-.158.37-.522-.76-1.983-1.294-1.14 1.458-1.096 2.098-2.523 2.098-3.683 0 0 1.88 1.922 2.428 1.725.4-.145.759-1.427-.678-5.297z" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 0 1-.63-.629V8.108a.63.63 0 0 1 .63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 0 1-.63.629.626.626 0 0 1-.51-.262l-2.443-3.317v2.95a.63.63 0 0 1-1.26 0V8.108a.63.63 0 0 1 .63-.63c.2 0 .385.095.51.262l2.442 3.317V8.108a.63.63 0 0 1 1.26 0v4.771zm-5.741 0a.63.63 0 0 1-1.26 0V8.108a.63.63 0 0 1 1.26 0v4.771zm-2.186.629H5.197a.63.63 0 0 1-.63-.629V8.108a.63.63 0 0 1 1.26 0v4.141h1.757c.349 0 .63.283.63.63 0 .344-.282.629-.631.629zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function KakaoTalkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.664 6.201 3 12 3zm5.519 5.442c-.336 0-.621.256-.696.588l-1.391 4.107a.559.559 0 0 0 .36.703.57.57 0 0 0 .716-.36l.263-.834h1.496l.263.834a.57.57 0 0 0 .716.36.559.559 0 0 0 .36-.703l-1.391-4.107c-.075-.332-.36-.588-.696-.588zm-9.843.072h-2.25a.476.476 0 0 0-.481.472c0 .264.216.472.48.472h.662v3.584c0 .264.216.472.48.472s.481-.208.481-.472V9.458h.628c.264 0 .48-.208.48-.472a.476.476 0 0 0-.48-.472zm3.408 0a.476.476 0 0 0-.48.472v2.416l-1.786-2.691a.477.477 0 0 0-.83.198v3.605c0 .264.216.472.48.472s.481-.208.481-.472v-2.399l1.772 2.652c.08.123.215.2.363.2h.023c.264 0 .48-.209.48-.473V9.015a.476.476 0 0 0-.503-.5zm5.138 0h-2.25a.476.476 0 0 0-.48.472v4.035c0 .264.216.472.48.472h2.25c.264 0 .48-.208.48-.472a.476.476 0 0 0-.48-.472h-1.77V11.6h1.77c.264 0 .48-.208.48-.472a.476.476 0 0 0-.48-.472h-1.77v-.67h1.77c.264 0 .48-.208.48-.472a.476.476 0 0 0-.48-.472v-.028zm4.131 1.9h-.494l.494-1.579.494 1.579h-.494z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Region detection & app mapping                                    */
/* ------------------------------------------------------------------ */

type Region =
  | 'china'
  | 'japan'
  | 'korea'
  | 'middle-east'
  | 'southeast-asia'
  | 'default';

interface ChatApp {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor?: string;
}

const SE_ASIA_LANGS = ['th', 'vi', 'ms', 'id', 'tl', 'my'];

function detectRegion(locale: string): Region {
  if (locale === 'zh') return 'china';
  if (locale === 'ja') return 'japan';
  if (locale === 'ar') return 'middle-east';

  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('ko')) return 'korea';
    if (lang.startsWith('zh')) return 'china';
    if (lang.startsWith('ja')) return 'japan';
    if (lang.startsWith('ar')) return 'middle-east';
    if (SE_ASIA_LANGS.some((l) => lang.startsWith(l))) return 'southeast-asia';
  }

  return 'default';
}

const whatsappMsg = encodeURIComponent(
  'Hello! I am interested in your marine equipment products. Could you provide more information?',
);

function buildCatalog(): Record<string, ChatApp> {
  return {
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp',
      href: `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`,
      icon: <WhatsAppIcon />,
      bgColor: 'bg-[#25D366] hover:bg-[#1da851]',
    },
    telegram: {
      id: 'telegram',
      name: 'Telegram',
      href: `https://t.me/${TELEGRAM_USERNAME}`,
      icon: <TelegramIcon />,
      bgColor: 'bg-[#0088cc] hover:bg-[#006fa3]',
    },
    email: {
      id: 'email',
      name: 'Email',
      href: `mailto:${CONTACT_EMAIL}`,
      icon: <Mail className="w-5 h-5" />,
      bgColor: 'bg-slate-600 hover:bg-slate-700',
    },
    wechat: {
      id: 'wechat',
      name: 'WeChat',
      href: WECHAT_QR_URL,
      icon: <WeChatIcon />,
      bgColor: 'bg-[#07C160] hover:bg-[#06a350]',
    },
    qq: {
      id: 'qq',
      name: 'QQ',
      href: `https://wpa.qq.com/msgrd?v=3&uin=${QQ_NUMBER}&site=qq&menu=yes`,
      icon: <QQIcon />,
      bgColor: 'bg-[#12B7F5] hover:bg-[#0e9ad0]',
    },
    line: {
      id: 'line',
      name: 'LINE',
      href: `https://line.me/R/ti/p/${LINE_ID}`,
      icon: <LineIcon />,
      bgColor: 'bg-[#00B900] hover:bg-[#009a00]',
    },
    kakaotalk: {
      id: 'kakaotalk',
      name: 'KakaoTalk',
      href: KAKAOTALK_URL,
      icon: <KakaoTalkIcon />,
      bgColor: 'bg-[#FEE500] hover:bg-[#e6cf00]',
      textColor: 'text-[#191919]',
    },
  };
}

const REGION_APPS: Record<Region, string[]> = {
  china: ['wechat', 'qq'],
  japan: ['line', 'whatsapp'],
  korea: ['kakaotalk', 'whatsapp'],
  'middle-east': ['whatsapp', 'telegram'],
  'southeast-asia': ['whatsapp', 'line', 'telegram'],
  default: ['whatsapp', 'telegram', 'email'],
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function SmartChatWidget() {
  const locale = useLocale();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const isAdminRoute =
    pathname === '/admin' || pathname.includes('/admin');
  if (!mounted || isAdminRoute) return null;

  const region = detectRegion(locale);
  const catalog = buildCatalog();
  const apps = REGION_APPS[region].map((id) => catalog[id]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {/* Expanded app list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10 min-w-[200px]"
          >
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Chat with us
            </p>

            {apps.map((app, i) => (
              <motion.a
                key={app.id}
                href={app.href}
                target={app.id === 'email' ? undefined : '_blank'}
                rel={app.id === 'email' ? undefined : 'noopener noreferrer'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-white transition-colors',
                  app.bgColor,
                  app.textColor,
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  {app.icon}
                </span>
                <span className="text-sm font-medium">{app.name}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        type="button"
        aria-label={open ? 'Close chat menu' : 'Open chat menu'}
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-xl transition-colors hover:bg-primary-700"
      >
        {/* Ping animation – only when closed */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary-400"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 3,
              delay: 2,
            }}
          />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="relative z-10 h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="relative z-10 h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
