const TARGET_COUNTRIES = new Set([
  'US', 'DE', 'JP', 'KR', 'SG', 'AE', 'NO', 'GR',
]);

interface VisitorData {
  pageViews?: number;
  productViews?: number;
  timeOnSiteSeconds?: number;
  inquirySubmitted?: boolean;
  returnVisits?: number;
  country?: string;
  multipleProductsViewed?: boolean;
  downloadedPdf?: boolean;
}

export function calculateLeadScore(visitor: VisitorData): number {
  let score = 0;

  // +1 per page view
  score += visitor.pageViews ?? 0;

  // +3 per product viewed
  score += (visitor.productViews ?? 0) * 3;

  // +1 per 30 seconds on site, max +10
  const timeBonus = Math.min(
    Math.floor((visitor.timeOnSiteSeconds ?? 0) / 30),
    10
  );
  score += timeBonus;

  // +20 for submitting an inquiry
  if (visitor.inquirySubmitted) score += 20;

  // +5 per return visit
  score += (visitor.returnVisits ?? 0) * 5;

  // +10 if from a target country
  if (visitor.country && TARGET_COUNTRIES.has(visitor.country.toUpperCase())) {
    score += 10;
  }

  // +5 for viewing multiple products
  if (visitor.multipleProductsViewed) score += 5;

  // +5 for downloading a PDF
  if (visitor.downloadedPdf) score += 5;

  return score;
}

export type LeadLabel = 'cold' | 'warm' | 'hot' | 'very hot';

export function getLeadLabel(score: number): LeadLabel {
  if (score >= 81) return 'very hot';
  if (score >= 51) return 'hot';
  if (score >= 21) return 'warm';
  return 'cold';
}

export function isHighValueLead(score: number): boolean {
  return score >= 50;
}
