export function getSafeNextPath(fallback = '/messages'): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const next = new URLSearchParams(window.location.search).get('next');

  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }

  return next;
}
