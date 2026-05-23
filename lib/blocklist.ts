export const BLOCKED_DOMAINS = [
  // Extreme hate / violence
  'stormfront.org',
  'dailystormer.com',
  'kiwifarms.net',
  '8kun.top',
  '8ch.net',
  'gab.com',
  'parler.com',
  // CSAM / illegal content hubs
  'pedo.xxx',
  'lolita.city',
  'childlove.xxx',
  // Known malware/phishing domains
  'malware.example.com',
  'phishing.example.com',
  // Add more as needed
];

export const BLOCKED_KEYWORDS = [
  'child pornography',
  'csam',
  'exploitation of minors',
  'hate speech manifesto',
  'terrorist recruitment',
  // Add more as needed
];

export function isUrlBlocked(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    // If URL is invalid, block it
    return true;
  }
}

export function hasBlockedKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BLOCKED_KEYWORDS.some(keyword => lowerText.includes(keyword));
}