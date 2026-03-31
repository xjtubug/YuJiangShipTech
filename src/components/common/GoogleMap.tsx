'use client';

interface GoogleMapProps {
  lat: number;
  lng: number;
  apiKey?: string;
  className?: string;
  zoom?: number;
}

// Default: Ningbo, Zhejiang, China
const DEFAULT_LAT = 29.8683;
const DEFAULT_LNG = 121.544;

export default function GoogleMap({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  apiKey,
  className = '',
  zoom = 14,
}: GoogleMapProps) {
  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${lat},${lng}&zoom=${zoom}`
    : `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

  return (
    <iframe
      src={src}
      className={`w-full border-0 rounded-xl ${className}`}
      style={{ minHeight: 300 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Company Location"
    />
  );
}

export { DEFAULT_LAT, DEFAULT_LNG };
