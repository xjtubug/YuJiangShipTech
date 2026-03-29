import { Briefcase, Play, Newspaper, ExternalLink } from 'lucide-react';

const feedCards = [
  {
    id: 'linkedin',
    title: 'Latest from LinkedIn',
    icon: Briefcase,
    color: 'bg-blue-600',
    description:
      'Follow us on LinkedIn for industry insights, product launches, and company updates.',
    cta: 'Follow on LinkedIn',
    href: 'https://linkedin.com/company/yujiang-ship-tech',
    items: [
      'New IMO-compliant marine valve series launched',
      'YuJiang attends Nor-Shipping 2024 in Oslo',
      'Partnership with major European shipyard announced',
    ],
  },
  {
    id: 'youtube',
    title: 'Latest from YouTube',
    icon: Play,
    color: 'bg-red-600',
    description:
      'Watch product demonstrations, factory tours, and technical guides on our channel.',
    cta: 'Subscribe on YouTube',
    href: 'https://youtube.com/@yujiang-ship-tech',
    items: [
      'Marine Butterfly Valve – Installation Guide',
      '360° Factory Tour – Ningbo Production Base',
      'Product Testing: Pressure Test Procedures',
    ],
  },
  {
    id: 'updates',
    title: 'Latest Updates',
    icon: Newspaper,
    color: 'bg-accent-500',
    description:
      'Stay up to date with our latest news, certifications, and product developments.',
    cta: 'View All News',
    href: '/news',
    items: [
      'ISO 9001:2015 Re-certification Completed',
      'New CCS & DNV-GL Approved Product Lines',
      'Expanded production capacity – 30% increase',
    ],
  },
];

export default function SocialFeed() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-wide">
        <div className="text-center mb-12">
          <h2 className="heading-2 mb-3">Stay Connected</h2>
          <p className="text-primary-500 max-w-xl mx-auto">
            Follow our latest updates across platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {feedCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.id} className="card flex flex-col">
                {/* Card header */}
                <div className={`${card.color} px-6 py-4 flex items-center gap-3`}>
                  <Icon className="w-5 h-5 text-white" />
                  <h3 className="text-white font-semibold text-base">
                    {card.title}
                  </h3>
                </div>

                {/* Card body */}
                <div className="flex-1 p-6 space-y-4">
                  <p className="text-sm text-primary-500 leading-relaxed">
                    {card.description}
                  </p>

                  <ul className="space-y-2.5">
                    {card.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-primary-700"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card footer */}
                <div className="px-6 pb-6">
                  <a
                    href={card.href}
                    target={card.id !== 'updates' ? '_blank' : undefined}
                    rel={card.id !== 'updates' ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-600 hover:text-secondary-700 transition-colors"
                  >
                    {card.cta}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
