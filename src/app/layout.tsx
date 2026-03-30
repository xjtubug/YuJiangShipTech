import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YuJiang ShipTechnology – Marine Equipment & Ship Supplies',
  description:
    'Leading B2B supplier of marine equipment, ship spare parts, and vessel supplies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
