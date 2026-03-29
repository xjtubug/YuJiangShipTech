'use client';

import { useTranslations } from 'next-intl';

interface ProductSpecsProps {
  specsJson: string;
}

export default function ProductSpecs({ specsJson }: ProductSpecsProps) {
  const t = useTranslations('products');

  let specs: Record<string, string> = {};
  try {
    specs = JSON.parse(specsJson);
  } catch {
    return null;
  }

  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="heading-3 mb-6">{t('specifications')}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {entries.map(([key, value], index) => (
              <tr
                key={key}
                className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}
              >
                <td className="px-4 py-3 font-medium text-primary-700 w-1/3 border-b border-slate-100">
                  {key}
                </td>
                <td className="px-4 py-3 text-primary-600 border-b border-slate-100">
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
