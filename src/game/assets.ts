const PUBLIC_BASE = import.meta.env.BASE_URL || '/';

export function publicAssetPath(path: string): string {
  if (/^(?:https?:|data:|blob:)/.test(path)) return path;
  const base = PUBLIC_BASE.endsWith('/') ? PUBLIC_BASE : `${PUBLIC_BASE}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

export function splitPublicAssetPath(path: string): { rootUrl: string; file: string } {
  const resolved = publicAssetPath(path);
  const slash = resolved.lastIndexOf('/');
  return {
    rootUrl: resolved.slice(0, slash + 1),
    file: resolved.slice(slash + 1),
  };
}
