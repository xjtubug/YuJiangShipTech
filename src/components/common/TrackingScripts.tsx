'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCookieConsentStore } from '@/lib/store';

function isValidId(value: string | undefined): value is string {
  if (!value) return false;
  const placeholders = ['YOUR_', 'CHANGE_', 'PLACEHOLDER', 'xxx', ''];
  return !placeholders.some((p) => value.toUpperCase().includes(p));
}

export default function TrackingScripts() {
  const { consent } = useCookieConsentStore();
  const [canLoad, setCanLoad] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setCanLoad(consent === 'accepted');
  }, [consent]);

  // Track route changes in GA4
  useEffect(() => {
    if (!canLoad) return;
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!isValidId(gaId)) return;
    window.gtag?.('config', gaId, { page_path: pathname });
  }, [pathname, canLoad]);

  if (!canLoad) return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const linkedInId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  return (
    <>
      {/* Google Analytics 4 */}
      {isValidId(gaId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                send_page_view: true,
              });
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {isValidId(fbPixelId) && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* LinkedIn Insight Tag */}
      {isValidId(linkedInId) && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`
            _linkedin_partner_id = "${linkedInId}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `}
        </Script>
      )}

      {/* Google Ads Remarketing */}
      {isValidId(googleAdsId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-ads-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAdsId}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
