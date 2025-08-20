export const APP_NAME = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || 'Chanoyu DB';
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : 'Chanoyu DB';
})();

export const APP_DESCRIPTION = (() => {
  const raw =
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    process.env.APP_DESCRIPTION ||
    'Unified database for tea utensils, 茶会, and locations';
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : 'Unified database for tea utensils, 茶会, and locations';
})();

export const APP_OWNER = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_OWNER || process.env.APP_OWNER || APP_NAME;
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : APP_NAME;
})();

export const BASE_DOMAIN = (() => {
  const raw = process.env.NEXT_PUBLIC_BASE_DOMAIN || process.env.BASE_DOMAIN || 'collection.ito.com';
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : 'collection.ito.com';
})();

export const BASE_URL = (() => {
  const raw = (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || '').trim();
  if (raw) {
    return raw.replace(/\/$/, '');
  }
  const proto = (process.env.NEXT_PUBLIC_BASE_PROTOCOL || process.env.BASE_PROTOCOL || 'https').trim() || 'https';
  return `${proto}://${BASE_DOMAIN}`;
})();


