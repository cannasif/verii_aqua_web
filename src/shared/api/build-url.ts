export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path.replace(/\?$/, '')}${path.includes('?') ? '&' : '?'}${qs}` : path;
}
