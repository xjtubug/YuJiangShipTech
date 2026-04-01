import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_RATES: Record<string, number> = {
  USD: 0.138,
  EUR: 0.127,
  JPY: 20.73,
  AED: 0.507,
};

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            'exchange_rate_usd',
            'exchange_rate_eur',
            'exchange_rate_jpy',
            'exchange_rate_aed',
          ],
        },
      },
    });

    const rates = { ...DEFAULT_RATES };
    for (const setting of settings) {
      const value = Number(setting.value);
      if (!Number.isFinite(value) || value <= 0) continue;

      if (setting.key === 'exchange_rate_usd') rates.USD = value;
      if (setting.key === 'exchange_rate_eur') rates.EUR = value;
      if (setting.key === 'exchange_rate_jpy') rates.JPY = value;
      if (setting.key === 'exchange_rate_aed') rates.AED = value;
    }

    return NextResponse.json({ base: 'CNY', rates, source: settings.length ? 'settings' : 'fallback' });
  } catch (error) {
    console.error('Exchange rates error:', error);
    return NextResponse.json({ base: 'CNY', rates: DEFAULT_RATES, source: 'fallback' });
  }
}
