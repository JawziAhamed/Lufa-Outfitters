const DEFAULT_ASSET_BASE = import.meta.env.VITE_ASSET_URL || 'http://localhost:8080';

export const resolveProductImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return '';

  const trimmed = imageUrl.trim();
  if (!trimmed) return '';

  if (/^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${DEFAULT_ASSET_BASE}${normalizedPath}`;
};
