import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ContactForm from '@/components/contact/ContactForm';
import ContactInfo from '@/components/contact/ContactInfo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');
  const navT = await getTranslations('nav');

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb items={[{ label: navT('contact') }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-4">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Form - takes more space */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2">
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
